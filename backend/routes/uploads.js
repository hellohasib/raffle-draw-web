const express = require('express');
const multer = require('multer');
const csv = require('csv-parser');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { Participant, RaffleDraw } = require('../models');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.csv', '.xlsx', '.xls'];
    const fileExt = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(fileExt)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Helper function to parse CSV file
const parseCSV = (filePath) => {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', reject);
  });
};

// Helper function to parse Excel file
const parseExcel = (filePath) => {
  const workbook = xlsx.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  return xlsx.utils.sheet_to_json(worksheet);
};

// Helper function to validate participant data
const validateParticipantData = (participants) => {
  const allErrors = [];
  const validParticipants = [];

  participants.forEach((participant, index) => {
    const rowNum = index + 1;
    const rowErrors = [];

    // Check required fields - be more flexible with field names
    const name = participant.name || participant.Name || '';
    if (!name || name.trim() === '') {
      rowErrors.push(`Row ${rowNum}: Name is required`);
    }

    // Validate email if provided - be flexible with field names
    const email = participant.email || participant.Email || '';
    if (email && email.trim() !== '') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        rowErrors.push(`Row ${rowNum}: Invalid email format`);
      }
    }

    // Validate phone if provided - be flexible with field names
    const phone = participant.phone || participant.Phone || '';
    if (phone && phone.length > 20) {
      rowErrors.push(`Row ${rowNum}: Phone number too long (max 20 characters)`);
    }

    // Validate designation if provided - be flexible with field names
    const designation = participant.designation || participant.Designation || '';
    if (designation && designation.length > 100) {
      rowErrors.push(`Row ${rowNum}: Designation too long (max 100 characters)`);
    }

    if (rowErrors.length === 0) {
      // Only include the fields we need to avoid "too many keys" error
      const cleanParticipant = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        designation: designation.trim()
      };
      
      // Remove empty fields to avoid issues
      Object.keys(cleanParticipant).forEach(key => {
        if (cleanParticipant[key] === '') {
          cleanParticipant[key] = null;
        }
      });
      
      validParticipants.push(cleanParticipant);
    } else {
      allErrors.push(...rowErrors);
    }
  });

  return { validParticipants, errors: allErrors };
};

/**
 * @swagger
 * /api/uploads/participants/{raffleId}:
 *   post:
 *     summary: Upload participants from CSV or Excel file
 *     tags: [File Uploads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: raffleId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *                 description: CSV or Excel file containing participants
 *     responses:
 *       200:
 *         description: Participants uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/Success'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         totalRows:
 *                           type: integer
 *                         validParticipants:
 *                           type: integer
 *                         errors:
 *                           type: array
 *                           items:
 *                             type: string
 *                         addedParticipants:
 *                           type: integer
 *       400:
 *         description: Bad request - Invalid file or data
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Raffle draw not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/participants/:raffleId', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file uploaded'
      });
    }

    const { raffleId } = req.params;
    
    // Check if raffle draw exists and belongs to user
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: raffleId,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed') {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Cannot add participants to completed raffle draw'
      });
    }

    // Check max participants limit
    if (raffleDraw.maxParticipants) {
      const participantCount = await Participant.count({
        where: { raffleDrawId: raffleDraw.id }
      });
      
      if (participantCount >= raffleDraw.maxParticipants) {
        // Clean up uploaded file
        fs.unlinkSync(req.file.path);
        return res.status(400).json({
          success: false,
          message: 'Maximum participants limit reached'
        });
      }
    }

    let participants = [];
    const fileExt = path.extname(req.file.originalname).toLowerCase();

    try {
      // Parse file based on extension
      if (fileExt === '.csv') {
        participants = await parseCSV(req.file.path);
      } else if (fileExt === '.xlsx' || fileExt === '.xls') {
        participants = await parseExcel(req.file.path);
      } else {
        throw new Error('Unsupported file format');
      }
      
    } catch (parseError) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'Error parsing file: ' + parseError.message
      });
    }

    // Validate participant data
    const { validParticipants, errors } = validateParticipantData(participants);
    

    if (validParticipants.length === 0) {
      // Clean up uploaded file
      fs.unlinkSync(req.file.path);
      return res.status(400).json({
        success: false,
        message: 'No valid participants found in file',
        errors: errors
      });
    }

    // Add participants to database
    let addedCount = 0;
    const addedParticipants = [];

    for (const participantData of validParticipants) {
      try {
        // Check if participant already exists (by email if provided)
        let existingParticipant = null;
        if (participantData.email) {
          existingParticipant = await Participant.findOne({
            where: {
              raffleDrawId: raffleDraw.id,
              email: participantData.email
            }
          });
        }

        if (!existingParticipant) {
          // Generate unique ticket number
          const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

          // Only pass fields that exist in the model to avoid "too many keys" error
          const createData = {
            name: participantData.name || '',
            email: participantData.email || null,
            phone: participantData.phone || null,
            designation: participantData.designation || null,
            ticketNumber,
            raffleDrawId: raffleDraw.id
          };
          
          const participant = await Participant.create(createData);

          addedParticipants.push(participant);
          addedCount++;
        } else {
          errors.push(`Participant with email ${participantData.email} already exists`);
        }
      } catch (dbError) {
        errors.push(`Error adding participant ${participantData.name}: ${dbError.message}`);
      }
    }

    // Clean up uploaded file
    fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      message: `Successfully processed ${participants.length} rows from file`,
      data: {
        totalRows: participants.length,
        validParticipants: validParticipants.length,
        errors: errors,
        addedParticipants: addedCount,
        participants: addedParticipants
      }
    });

  } catch (error) {
    // Clean up uploaded file if it exists
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    console.error('File upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process uploaded file',
      error: error.message
    });
  }
});

module.exports = router;
