const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticateToken, authorizeRole } = require('../../middleware/authMiddleware');
const prisma = new PrismaClient();

// Get users by role
router.get('/role/:role', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { role } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    const skip = (page - 1) * limit;
    const take = parseInt(limit);

    // Validate role
    const validRoles = ['ADMIN', 'STUDENT', 'STAFF', 'CLEANER'];
    if (!validRoles.includes(role.toUpperCase())) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid role',
        validRoles
      });
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: { role: role.toUpperCase() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roomNo: true,
          createdAt: true,
          updatedAt: true
        },
        skip,
        take,
        orderBy: { name: 'asc' }
      }),
      prisma.user.count({ 
        where: { role: role.toUpperCase() } 
      })
    ]);

    res.json({
      success: true,
      data: users,
      pagination: {
        total,
        page: parseInt(page),
        limit: take,
        totalPages: Math.ceil(total / take)
      }
    });
  } catch (error) {
    console.error('Error fetching users by role:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch users by role',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all users with pagination and filters
router.get('/', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  console.log('Fetching users with query:', req.query);
  
  try {
    // Parse query parameters with validation
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const skip = (page - 1) * limit;
    const { role, search } = req.query;
    
    // Build query conditions
    const where = {};

    if (role) where.role = role;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
      // Only add roomNo to search if it's a valid search term
      if (/^[a-zA-Z0-9-]+$/.test(search)) {
        where.OR.push({ roomNo: { contains: search, mode: 'insensitive' } });
      }
    }

    console.log('Database query conditions:', JSON.stringify(where, null, 2));
    
    // Execute queries in parallel
    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          roomNo: true,
          createdAt: true,
          updatedAt: true
        },
        orderBy: { createdAt: 'desc' }
      }).catch(err => {
        console.error('Error in findMany:', err);
        throw new Error('Failed to fetch users from database');
      }),
      prisma.user.count({ 
        where: Object.keys(where).length > 0 ? where : undefined 
      }).catch(err => {
        console.error('Error in count:', err);
        throw new Error('Failed to count users');
      })
    ]);

    const response = {
      success: true,
      data: users,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    console.log(`Successfully fetched ${users.length} of ${total} users`);
    res.json(response);
    
  } catch (error) {
    console.error('Error in GET /api/admin/users:', {
      error: error.message,
      stack: error.stack,
      query: req.query,
      timestamp: new Date().toISOString()
    });
    
    res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to fetch users',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get single user by ID
router.get('/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(req.params.id) },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roomNo: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    res.json({ success: true, data: user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch user' });
  }
});

// Create new user
router.post('/', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { name, email, password, role, roomNo } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ success: false, error: 'Email already in use' });
    }

    // Hash password (you'll need to implement this function)
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        roomNo
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roomNo: true,
      }
    });

    res.status(201).json({ success: true, data: user });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ success: false, error: 'Failed to create user' });
  }
});

// Update user
router.put('/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  try {
    const { name, email, role, roomNo } = req.body;
    const userId = parseInt(req.params.id);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!existingUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if email is already in use by another user
    if (email && email !== existingUser.email) {
      const emailInUse = await prisma.user.findFirst({
        where: { email, NOT: { id: userId } }
      });
      if (emailInUse) {
        return res.status(400).json({ success: false, error: 'Email already in use' });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        name: name || existingUser.name,
        email: email || existingUser.email,
        role: role || existingUser.role,
        roomNo: roomNo !== undefined ? roomNo : existingUser.roomNo,
        isActive: isActive !== undefined ? isActive : existingUser.isActive
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        roomNo: true,
        updatedAt: true
      }
    });

    res.json({ success: true, data: updatedUser });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ success: false, error: 'Failed to update user' });
  }
});

// Delete user (soft delete)
router.delete('/:id', authenticateToken, authorizeRole(['ADMIN']), async (req, res) => {
  const userId = parseInt(req.params.id);
  
  try {
    // Check if user exists
    const user = await prisma.user.findUnique({ 
      where: { id: userId },
      include: {
        _count: {
          select: {
            complaints: true,
            bookings: true,
            feedbacks: true,
            reportedIssues: true,
            assignedIssues: true,
            qualityTests: true,
            createdSchedules: true,
            waterComments: true,
            reportedNetworkIssues: true,
            assignedNetworkIssues: true,
            networkComments: true,
            createdMaintenances: true,
            cleaningRequests: true,
            cleaningAssignments: true
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    // Check if user has any related records
    const hasRelatedRecords = Object.values(user._count).some(count => count > 0);
    
    if (hasRelatedRecords) {
      // Option 1: Return error with related records count
      return res.status(400).json({
        success: false,
        error: 'Cannot delete user with related records',
        relatedRecords: user._count,
        suggestion: 'Please delete or reassign related records first or contact support for assistance.'
      });
      
      // Option 2: Uncomment below to force delete (use with caution)
      // This will delete all related records
      /*
      await prisma.$transaction([
        // Delete all related records
        prisma.networkComment.deleteMany({ where: { authorId: userId } }),
        // Add other delete operations for related tables
        // ...
        
        // Finally delete the user
        prisma.user.delete({ where: { id: userId } })
      ]);
      
      return res.json({ 
        success: true, 
        message: 'User and all related records have been deleted',
        relatedRecordsDeleted: user._count
      });
      */
    }

    // If no related records, safe to delete
    await prisma.user.delete({
      where: { id: userId }
    });

    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting user:', error);
    
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        success: false, 
        error: 'User not found' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      error: 'Failed to delete user',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
