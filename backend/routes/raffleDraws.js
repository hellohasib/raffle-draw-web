const express = require('express');
const { RaffleDraw, Prize, Participant, User } = require('../models');
const { authenticateToken, requireOwnershipOrAdmin } = require('../middleware/auth');
const { validateRaffleDraw, validatePrize, validateParticipant, validateParticipantUpdate } = require('../middleware/validation');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Raffle Draws
 *   description: Raffle draw management operations
 */

/**
 * @swagger
 * /api/raffle-draws:
 *   get:
 *     summary: Get all raffle draws for authenticated user
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, active, completed, cancelled]
 *         description: Filter by raffle draw status
 *     responses:
 *       200:
 *         description: Raffle draws retrieved successfully
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
 *                         raffleDraws:
 *                           type: array
 *                           items:
 *                             allOf:
 *                               - $ref: '#/components/schemas/RaffleDraw'
 *                               - type: object
 *                                 properties:
 *                                   prizes:
 *                                     type: array
 *                                     items:
 *                                       $ref: '#/components/schemas/Prize'
 *                                   participants:
 *                                     type: array
 *                                     items:
 *                                       $ref: '#/components/schemas/Participant'
 *                         pagination:
 *                           type: object
 *                           properties:
 *                             currentPage:
 *                               type: integer
 *                             totalPages:
 *                               type: integer
 *                             totalItems:
 *                               type: integer
 *                             itemsPerPage:
 *                               type: integer
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = { userId: req.user.id };
    if (status) {
      whereClause.status = status;
    }

    const raffleDraws = await RaffleDraw.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Prize,
          as: 'prizes',
          required: false
        },
        {
          model: Participant,
          as: 'participants',
          required: false
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        raffleDraws: raffleDraws.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(raffleDraws.count / limit),
          totalItems: raffleDraws.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Get raffle draws error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raffle draws',
      error: error.message
    });
  }
});

// Get a specific raffle draw by ID
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [
        {
          model: Prize,
          as: 'prizes',
          include: [
            {
              model: Participant,
              as: 'winner',
              required: false
            }
          ]
        },
        {
          model: Participant,
          as: 'participants'
        }
      ]
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    res.json({
      success: true,
      data: { raffleDraw }
    });
  } catch (error) {
    console.error('Get raffle draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raffle draw',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws:
 *   post:
 *     summary: Create a new raffle draw
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - drawDate
 *             properties:
 *               title:
 *                 type: string
 *                 example: Summer Giveaway 2024
 *               description:
 *                 type: string
 *                 example: Win amazing prizes this summer!
 *               drawDate:
 *                 type: string
 *                 format: date-time
 *                 example: 2024-07-15T18:00:00Z
 *               maxParticipants:
 *                 type: integer
 *                 example: 100
 *               isPublic:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       201:
 *         description: Raffle draw created successfully
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
 *                         raffleDraw:
 *                           $ref: '#/components/schemas/RaffleDraw'
 *       400:
 *         description: Validation error
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', authenticateToken, validateRaffleDraw, async (req, res) => {
  try {
    const { title, description, drawDate, maxParticipants, isPublic } = req.body;

    const raffleDraw = await RaffleDraw.create({
      title,
      description,
      drawDate,
      maxParticipants,
      isPublic: isPublic !== undefined ? isPublic : true,
      userId: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Raffle draw created successfully',
      data: { raffleDraw }
    });
  } catch (error) {
    console.error('Create raffle draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create raffle draw',
      error: error.message
    });
  }
});

// Update a raffle draw
router.put('/:id', authenticateToken, validateRaffleDraw, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot update ${raffleDraw.status} raffle draw`
      });
    }

    const { title, description, drawDate, maxParticipants, isPublic, status } = req.body;
    
    await raffleDraw.update({
      title,
      description,
      drawDate,
      maxParticipants,
      isPublic,
      status
    });

    res.json({
      success: true,
      message: 'Raffle draw updated successfully',
      data: { raffleDraw }
    });
  } catch (error) {
    console.error('Update raffle draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update raffle draw',
      error: error.message
    });
  }
});

// Delete a raffle draw
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete ${raffleDraw.status} raffle draw`
      });
    }

    await raffleDraw.destroy();

    res.json({
      success: true,
      message: 'Raffle draw deleted successfully'
    });
  } catch (error) {
    console.error('Delete raffle draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete raffle draw',
      error: error.message
    });
  }
});

// Add prizes to a raffle draw
router.post('/:id/prizes', authenticateToken, validatePrize, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot add prizes to ${raffleDraw.status} raffle draw`
      });
    }

    const { name, description, value, position } = req.body;

    const prize = await Prize.create({
      name,
      description,
      value,
      position,
      raffleDrawId: raffleDraw.id
    });

    res.status(201).json({
      success: true,
      message: 'Prize added successfully',
      data: { prize }
    });
  } catch (error) {
    console.error('Add prize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add prize',
      error: error.message
    });
  }
});

// Add participants to a raffle draw
router.post('/:id/participants', authenticateToken, validateParticipant, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot add participants to ${raffleDraw.status} raffle draw`
      });
    }

    // Check max participants limit
    if (raffleDraw.maxParticipants && raffleDraw.maxParticipants > 0) {
      const participantCount = await Participant.count({
        where: { raffleDrawId: raffleDraw.id }
      });
      
      if (participantCount >= raffleDraw.maxParticipants) {
        return res.status(400).json({
          success: false,
          message: 'Maximum participants limit reached'
        });
      }
    }

    const { name, email, phone, designation } = req.body;

    // Generate unique ticket number
    const ticketNumber = `TKT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const participant = await Participant.create({
      name,
      email,
      phone,
      designation,
      ticketNumber,
      raffleDrawId: raffleDraw.id
    });

    res.status(201).json({
      success: true,
      message: 'Participant added successfully',
      data: { participant }
    });
  } catch (error) {
    console.error('Add participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add participant',
      error: error.message
    });
  }
});

// Update participant details
router.put('/:id/participants/:participantId', authenticateToken, validateParticipantUpdate, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot update participants in a ${raffleDraw.status} raffle draw`
      });
    }

    const participant = await Participant.findOne({
      where: {
        id: req.params.participantId,
        raffleDrawId: raffleDraw.id
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    if (participant.isWinner) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a participant who has already won a prize'
      });
    }

    const updateData = {};
    ['name', 'email', 'phone', 'designation'].forEach((field) => {
      if (Object.prototype.hasOwnProperty.call(req.body, field)) {
        updateData[field] = req.body[field] === '' ? null : req.body[field];
      }
    });

    await participant.update(updateData);

    res.json({
      success: true,
      message: 'Participant updated successfully',
      data: { participant }
    });
  } catch (error) {
    console.error('Update participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update participant',
      error: error.message
    });
  }
});

// Delete participant
router.delete('/:id/participants/:participantId', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete participants from a ${raffleDraw.status} raffle draw`
      });
    }

    const participant = await Participant.findOne({
      where: {
        id: req.params.participantId,
        raffleDrawId: raffleDraw.id
      }
    });

    if (!participant) {
      return res.status(404).json({
        success: false,
        message: 'Participant not found'
      });
    }

    if (participant.isWinner) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a participant who has already won a prize'
      });
    }

    await participant.destroy();

    res.json({
      success: true,
      message: 'Participant deleted successfully'
    });
  } catch (error) {
    console.error('Delete participant error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete participant',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws/{id}/draw:
 *   post:
 *     summary: Conduct the raffle draw (select winners)
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *       - in: query
 *         name: mode
 *         schema:
 *           type: string
 *           enum: [all, step]
 *           default: all
 *         description: Draw mode - 'all' for drawing all winners at once, 'step' for step-by-step mode
 *     responses:
 *       200:
 *         description: Raffle draw completed successfully
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
 *                         winners:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               prize:
 *                                 $ref: '#/components/schemas/Prize'
 *                               winner:
 *                                 $ref: '#/components/schemas/Participant'
 *       400:
 *         description: Bad request - Raffle draw not ready or no participants/prizes
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
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/draw', authenticateToken, async (req, res) => {
  try {
    const { mode = 'all' } = req.query;
    
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [
        {
          model: Prize,
          as: 'prizes',
          order: [['position', 'ASC']]
        },
        {
          model: Participant,
          as: 'participants'
        }
      ]
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Raffle draw must be active to conduct the draw'
      });
    }

    if (raffleDraw.prizes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No prizes found for this raffle draw'
      });
    }

    if (raffleDraw.participants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No participants found for this raffle draw'
      });
    }

    if (mode === 'step') {
      // Step-by-step mode: return the first prize to draw
      const firstPrize = raffleDraw.prizes.find(prize => !prize.winnerId);
      
      if (!firstPrize) {
        return res.status(400).json({
          success: false,
          message: 'All prizes already have winners'
        });
      }

      res.json({
        success: true,
        message: 'Step-by-step mode activated. Use /draw-prize/{prizeId} endpoint to draw winners one by one.',
        data: {
          nextPrize: firstPrize,
          totalPrizes: raffleDraw.prizes.length,
          remainingPrizes: raffleDraw.prizes.filter(prize => !prize.winnerId).length,
          instructions: 'Call POST /api/raffle-draws/' + raffleDraw.id + '/draw-prize/' + firstPrize.id + ' to draw the first winner'
        }
      });
    } else {
      // All-at-once mode (original behavior)
      // Shuffle participants array
      const shuffledParticipants = [...raffleDraw.participants].sort(() => Math.random() - 0.5);
      
      // Assign winners to prizes
      const winners = [];
      for (let i = 0; i < Math.min(raffleDraw.prizes.length, shuffledParticipants.length); i++) {
        const prize = raffleDraw.prizes[i];
        const winner = shuffledParticipants[i];
        
        await prize.update({ winnerId: winner.id });
        await winner.update({ isWinner: true, prizeId: prize.id });
        
        winners.push({
          prize: prize,
          winner: winner
        });
      }

      // Update raffle draw status to completed
      await raffleDraw.update({ status: 'completed' });

      res.json({
        success: true,
        message: 'Raffle draw completed successfully',
        data: { winners }
      });
    }
  } catch (error) {
    console.error('Conduct draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to conduct raffle draw',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws/{id}/draw-status:
 *   get:
 *     summary: Get current draw status and next prize to draw
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *     responses:
 *       200:
 *         description: Draw status retrieved successfully
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
 *                         drawStatus:
 *                           type: string
 *                           enum: [not_started, in_progress, completed]
 *                         nextPrize:
 *                           $ref: '#/components/schemas/Prize'
 *                         drawnPrizes:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               prize:
 *                                 $ref: '#/components/schemas/Prize'
 *                               winner:
 *                                 $ref: '#/components/schemas/Participant'
 *                         remainingPrizes:
 *                           type: array
 *                           items:
 *                             $ref: '#/components/schemas/Prize'
 *       404:
 *         description: Raffle draw not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:id/draw-status', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [
        {
          model: Prize,
          as: 'prizes',
          include: [
            {
              model: Participant,
              as: 'winner',
              required: false
            }
          ],
          order: [['position', 'ASC']]
        },
        {
          model: Participant,
          as: 'participants'
        }
      ]
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    // Determine draw status
    let drawStatus = 'not_started';
    if (raffleDraw.status === 'completed') {
      drawStatus = 'completed';
    } else if (raffleDraw.prizes.some(prize => prize.winnerId)) {
      drawStatus = 'in_progress';
    }

    // Separate drawn and remaining prizes
    const drawnPrizes = raffleDraw.prizes.filter(prize => prize.winnerId);
    const remainingPrizes = raffleDraw.prizes.filter(prize => !prize.winnerId);
    
    // Get next prize to draw (lowest position among remaining)
    const nextPrize = remainingPrizes.length > 0 
      ? remainingPrizes.reduce((min, prize) => prize.position < min.position ? prize : min)
      : null;

    res.json({
      success: true,
      data: {
        drawStatus,
        nextPrize,
        drawnPrizes: drawnPrizes.map(prize => ({
          prize,
          winner: prize.winner
        })),
        remainingPrizes,
        totalPrizes: raffleDraw.prizes.length,
        drawnCount: drawnPrizes.length,
        remainingCount: remainingPrizes.length
      }
    });
  } catch (error) {
    console.error('Get draw status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get draw status',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws/{id}/draw-prize/{prizeId}:
 *   post:
 *     summary: Draw winner for a specific prize
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *       - in: path
 *         name: prizeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Prize ID to draw winner for
 *     responses:
 *       200:
 *         description: Winner drawn successfully
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
 *                         prize:
 *                           $ref: '#/components/schemas/Prize'
 *                         winner:
 *                           $ref: '#/components/schemas/Participant'
 *                         isLastPrize:
 *                           type: boolean
 *       400:
 *         description: Bad request - Prize already has winner or no eligible participants
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Raffle draw or prize not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/draw-prize/:prizeId', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [
        {
          model: Prize,
          as: 'prizes',
          where: { id: req.params.prizeId },
          include: [
            {
              model: Participant,
              as: 'winner',
              required: false
            }
          ]
        },
        {
          model: Participant,
          as: 'participants'
        }
      ]
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    const prize = raffleDraw.prizes[0];
    if (!prize) {
      return res.status(404).json({
        success: false,
        message: 'Prize not found'
      });
    }

    if (prize.winnerId) {
      return res.status(400).json({
        success: false,
        message: 'This prize already has a winner'
      });
    }

    if (raffleDraw.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'Raffle draw must be active to conduct draws'
      });
    }

    // Get eligible participants (those who haven't won any prize yet)
    const eligibleParticipants = raffleDraw.participants.filter(participant => !participant.isWinner);

    if (eligibleParticipants.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No eligible participants remaining (all participants have already won prizes)'
      });
    }

    // Randomly select a winner from eligible participants
    const randomIndex = Math.floor(Math.random() * eligibleParticipants.length);
    const winner = eligibleParticipants[randomIndex];

    // Update prize with winner
    await prize.update({ winnerId: winner.id });
    
    // Update participant as winner
    await winner.update({ isWinner: true, prizeId: prize.id });

    // Check if this was the last prize
    const remainingPrizes = await Prize.count({
      where: { 
        raffleDrawId: raffleDraw.id,
        winnerId: null 
      }
    });

    const isLastPrize = remainingPrizes === 0;

    // If this was the last prize, mark raffle draw as completed
    if (isLastPrize) {
      await raffleDraw.update({ status: 'completed' });
    }

    res.json({
      success: true,
      message: `Winner drawn for ${prize.name}`,
      data: {
        prize,
        winner,
        isLastPrize
      }
    });
  } catch (error) {
    console.error('Draw prize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to draw winner for prize',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws/{id}/reset-draw:
 *   post:
 *     summary: Reset the raffle draw (clear all winners)
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *     responses:
 *       200:
 *         description: Draw reset successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request - Cannot reset completed draw
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
router.post('/:id/reset-draw', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot reset a ${raffleDraw.status} raffle draw`
      });
    }

    // Clear all winners from prizes
    await Prize.update(
      { winnerId: null },
      { where: { raffleDrawId: raffleDraw.id } }
    );

    // Reset all participants' winner status
    await Participant.update(
      { isWinner: false, prizeId: null },
      { where: { raffleDrawId: raffleDraw.id } }
    );

    // Set raffle draw status to active if it was in progress
    if (raffleDraw.status === 'active') {
      await raffleDraw.update({ status: 'active' });
    }

    res.json({
      success: true,
      message: 'Raffle draw reset successfully. All winners have been cleared.'
    });
  } catch (error) {
    console.error('Reset draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to reset raffle draw',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws/{id}/prizes/{prizeId}/redraw:
 *   post:
 *     summary: Redraw winner for a specific prize (clear and redraw)
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *       - in: path
 *         name: prizeId
 *         required: true
 *         schema:
 *           type: integer
 *         description: Prize ID to redraw
 *     responses:
 *       200:
 *         description: Prize winner cleared successfully, ready for redraw
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request - Prize doesn't have a winner or raffle is completed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Raffle draw or prize not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:id/prizes/:prizeId/redraw', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot redraw prizes in a ${raffleDraw.status} raffle draw. Please reset the entire draw first.`
      });
    }

    // Find the prize
    const prize = await Prize.findOne({
      where: {
        id: req.params.prizeId,
        raffleDrawId: raffleDraw.id
      },
      include: [
        {
          model: Participant,
          as: 'winner',
          required: false
        }
      ]
    });

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: 'Prize not found'
      });
    }

    if (!prize.winnerId) {
      return res.status(400).json({
        success: false,
        message: 'This prize does not have a winner yet. Nothing to redraw.'
      });
    }

    // Store the previous winner info for the response
    const previousWinner = prize.winner;

    // Get the participant who won this prize
    const participant = await Participant.findByPk(prize.winnerId);

    // Clear the winner from the prize
    await prize.update({ winnerId: null });

    // Reset the participant's winner status
    if (participant) {
      await participant.update({ isWinner: false, prizeId: null });
    }

    res.json({
      success: true,
      message: `Winner cleared for ${prize.name}. Ready to redraw.`,
      data: {
        prize,
        previousWinner: previousWinner ? {
          id: previousWinner.id,
          name: previousWinner.name,
          ticketNumber: previousWinner.ticketNumber
        } : null
      }
    });
  } catch (error) {
    console.error('Redraw prize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to redraw prize',
      error: error.message
    });
  }
});

// Update prize details
router.put('/:id/prizes/:prizeId', authenticateToken, validatePrize, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot update prizes in a ${raffleDraw.status} raffle draw`
      });
    }

    const prize = await Prize.findOne({
      where: {
        id: req.params.prizeId,
        raffleDrawId: raffleDraw.id
      }
    });

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: 'Prize not found'
      });
    }

    if (prize.winnerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot update a prize that already has a winner'
      });
    }

    const { name, description, value, position } = req.body;
    await prize.update({ name, description, value, position });

    res.json({
      success: true,
      message: 'Prize updated successfully',
      data: { prize }
    });
  } catch (error) {
    console.error('Update prize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update prize',
      error: error.message
    });
  }
});

// Delete prize
router.delete('/:id/prizes/:prizeId', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: {
        id: req.params.id,
        userId: req.user.id
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'completed' || raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: `Cannot delete prizes from a ${raffleDraw.status} raffle draw`
      });
    }

    const prize = await Prize.findOne({
      where: {
        id: req.params.prizeId,
        raffleDrawId: raffleDraw.id
      }
    });

    if (!prize) {
      return res.status(404).json({
        success: false,
        message: 'Prize not found'
      });
    }

    if (prize.winnerId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a prize that already has a winner'
      });
    }

    await prize.destroy();

    res.json({
      success: true,
      message: 'Prize deleted successfully'
    });
  } catch (error) {
    console.error('Delete prize error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete prize',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws/{id}/mark-closed:
 *   post:
 *     summary: Mark a raffle draw as closed (no further edits allowed)
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *     responses:
 *       200:
 *         description: Raffle draw marked as closed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Success'
 *       400:
 *         description: Bad request
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
router.post('/:id/mark-closed', authenticateToken, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      }
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    if (raffleDraw.status === 'closed') {
      return res.status(400).json({
        success: false,
        message: 'Raffle draw is already closed'
      });
    }

    // Update status to closed
    await raffleDraw.update({ status: 'closed' });

    res.json({
      success: true,
      message: 'Raffle draw has been marked as closed. No further edits are allowed.',
      data: { raffleDraw }
    });
  } catch (error) {
    console.error('Mark closed error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark raffle draw as closed',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/raffle-draws/{id}/winners/download:
 *   get:
 *     summary: Download winners list as CSV
 *     tags: [Raffle Draws]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [csv, json]
 *           default: csv
 *         description: Download format
 *     responses:
 *       200:
 *         description: Winners list file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 *           application/json:
 *             schema:
 *               type: object
 *       400:
 *         description: No winners found
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
router.get('/:id/winners/download', authenticateToken, async (req, res) => {
  try {
    const { format = 'csv' } = req.query;
    
    const raffleDraw = await RaffleDraw.findOne({
      where: { 
        id: req.params.id,
        userId: req.user.id 
      },
      include: [
        {
          model: Prize,
          as: 'prizes',
          include: [
            {
              model: Participant,
              as: 'winner',
              required: false
            }
          ],
          order: [['position', 'ASC']]
        }
      ]
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    // Get prizes with winners
    const prizesWithWinners = raffleDraw.prizes.filter(prize => prize.winner);

    if (prizesWithWinners.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No winners found for this raffle draw'
      });
    }

    if (format === 'json') {
      // Return JSON format
      const winnersData = {
        raffleDraw: {
          id: raffleDraw.id,
          title: raffleDraw.title,
          drawDate: raffleDraw.drawDate,
          status: raffleDraw.status
        },
        winners: prizesWithWinners.map(prize => ({
          position: prize.position,
          prizeName: prize.name,
          prizeDescription: prize.description,
          prizeValue: prize.value,
          winnerName: prize.winner.name,
          winnerEmail: prize.winner.email,
          winnerPhone: prize.winner.phone,
          winnerDesignation: prize.winner.designation,
          ticketNumber: prize.winner.ticketNumber
        }))
      };

      res.json({
        success: true,
        data: winnersData
      });
    } else {
      // Return CSV format
      let csv = 'Position,Prize Name,Prize Description,Prize Value,Winner Name,Winner Email,Winner Phone,Winner Designation,Ticket Number\n';
      
      prizesWithWinners.forEach(prize => {
        const row = [
          prize.position || '',
          `"${(prize.name || '').replace(/"/g, '""')}"`,
          `"${(prize.description || '').replace(/"/g, '""')}"`,
          prize.value || '',
          `"${(prize.winner.name || '').replace(/"/g, '""')}"`,
          prize.winner.email || '',
          prize.winner.phone || '',
          `"${(prize.winner.designation || '').replace(/"/g, '""')}"`,
          prize.winner.ticketNumber || ''
        ];
        csv += row.join(',') + '\n';
      });

      // Set headers for CSV download
      const filename = `${raffleDraw.title.replace(/[^a-z0-9]/gi, '_')}_winners_${Date.now()}.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csv);
    }
  } catch (error) {
    console.error('Download winners error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to download winners list',
      error: error.message
    });
  }
});

module.exports = router;
