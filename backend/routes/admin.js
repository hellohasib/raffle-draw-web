const express = require('express');
const { RaffleDraw, Prize, Participant, User } = require('../models');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: Admin-only operations for managing users and raffle draws
 */

/**
 * @swagger
 * /api/admin/raffle-draws:
 *   get:
 *     summary: Get all raffle draws (admin only)
 *     tags: [Admin]
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
 *       - in: query
 *         name: userId
 *         schema:
 *           type: integer
 *         description: Filter by user ID
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
 *                                   user:
 *                                     $ref: '#/components/schemas/User'
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/raffle-draws', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, userId } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (status) {
      whereClause.status = status;
    }
    if (userId) {
      whereClause.userId = userId;
    }

    const raffleDraws = await RaffleDraw.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
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
    console.error('Admin get raffle draws error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raffle draws',
      error: error.message
    });
  }
});

// Get specific raffle draw details (admin only)
router.get('/raffle-draws/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        },
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
    console.error('Admin get raffle draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch raffle draw',
      error: error.message
    });
  }
});

// Get all users (admin only)
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 10, role } = req.query;
    const offset = (page - 1) * limit;

    const whereClause = {};
    if (role) {
      whereClause.role = role;
    }

    const users = await User.findAndCountAll({
      where: whereClause,
      attributes: { exclude: ['password'] },
      include: [
        {
          model: RaffleDraw,
          as: 'raffleDraws',
          required: false,
          attributes: ['id', 'title', 'status', 'createdAt']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: {
        users: users.rows,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(users.count / limit),
          totalItems: users.count,
          itemsPerPage: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('Admin get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

// Get user details (admin only)
router.get('/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
      include: [
        {
          model: RaffleDraw,
          as: 'raffleDraws',
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
          ]
        }
      ]
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Admin get user error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Update user status (admin only)
router.put('/users/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { isActive } = req.body;

    const user = await User.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    await user.update({ isActive });

    res.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: { user }
    });
  } catch (error) {
    console.error('Admin update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/dashboard:
 *   get:
 *     summary: Get dashboard statistics (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics retrieved successfully
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
 *                         statistics:
 *                           type: object
 *                           properties:
 *                             totalUsers:
 *                               type: integer
 *                             totalRaffleDraws:
 *                               type: integer
 *                             activeRaffleDraws:
 *                               type: integer
 *                             completedRaffleDraws:
 *                               type: integer
 *                             totalParticipants:
 *                               type: integer
 *                             totalPrizes:
 *                               type: integer
 *                         recentActivity:
 *                           type: object
 *                           properties:
 *                             raffleDraws:
 *                               type: array
 *                               items:
 *                                 allOf:
 *                                   - $ref: '#/components/schemas/RaffleDraw'
 *                                   - type: object
 *                                     properties:
 *                                       user:
 *                                         $ref: '#/components/schemas/User'
 *                             users:
 *                               type: array
 *                               items:
 *                                 $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin access required
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
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const totalUsers = await User.count();
    const totalRaffleDraws = await RaffleDraw.count();
    const activeRaffleDraws = await RaffleDraw.count({ where: { status: 'active' } });
    const completedRaffleDraws = await RaffleDraw.count({ where: { status: 'completed' } });
    const totalParticipants = await Participant.count();
    const totalPrizes = await Prize.count();

    // Recent activity
    const recentRaffleDraws = await RaffleDraw.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['username', 'firstName', 'lastName']
        }
      ],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    const recentUsers = await User.findAll({
      attributes: ['id', 'username', 'firstName', 'lastName', 'role', 'createdAt'],
      order: [['createdAt', 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        statistics: {
          totalUsers,
          totalRaffleDraws,
          activeRaffleDraws,
          completedRaffleDraws,
          totalParticipants,
          totalPrizes
        },
        recentActivity: {
          raffleDraws: recentRaffleDraws,
          users: recentUsers
        }
      }
    });
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * @swagger
 * /api/admin/raffle-draws/{id}/status:
 *   put:
 *     summary: Update raffle draw status (admin only)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Raffle draw ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [draft, active, completed, cancelled]
 *                 description: New status for the raffle draw
 *     responses:
 *       200:
 *         description: Raffle draw status updated successfully
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
 *         description: Bad request - Invalid status or validation error
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
 *       403:
 *         description: Forbidden - Admin access required
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
router.put('/raffle-draws/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['draft', 'active', 'completed', 'cancelled'];

    // Validate status
    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status. Must be one of: draft, active, completed, cancelled'
      });
    }

    const raffleDraw = await RaffleDraw.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'username', 'firstName', 'lastName', 'email']
        }
      ]
    });

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    const oldStatus = raffleDraw.status;
    
    // Update the status
    await raffleDraw.update({ status });

    res.json({
      success: true,
      message: `Raffle draw status updated from ${oldStatus} to ${status}`,
      data: { raffleDraw }
    });
  } catch (error) {
    console.error('Admin update raffle draw status error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update raffle draw status',
      error: error.message
    });
  }
});

// Delete raffle draw (admin only)
router.delete('/raffle-draws/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const raffleDraw = await RaffleDraw.findByPk(req.params.id);

    if (!raffleDraw) {
      return res.status(404).json({
        success: false,
        message: 'Raffle draw not found'
      });
    }

    await raffleDraw.destroy();

    res.json({
      success: true,
      message: 'Raffle draw deleted successfully'
    });
  } catch (error) {
    console.error('Admin delete raffle draw error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete raffle draw',
      error: error.message
    });
  }
});

module.exports = router;
