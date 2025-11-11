const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Report a new network issue
const reportIssue = async (req, res) => {
  try {
    const { title, description, issueType, priority, ipAddress, macAddress, speedTest } = req.body;
    const userId = req.user.id;

    const issue = await prisma.networkIssue.create({
      data: {
        title,
        description,
        issueType,
        priority: priority || 'MEDIUM',
        ipAddress,
        macAddress,
        speedTest: speedTest ? JSON.parse(speedTest) : null,
        userId,
      },
      include: {
        reportedBy: {
          select: { name: true, email: true, roomNo: true }
        }
      }
    });

    res.status(201).json({
      message: 'Network issue reported successfully',
      issue,
    });
  } catch (error) {
    console.error('Error reporting network issue:', error);
    res.status(500).json({ error: 'Failed to report network issue' });
  }
};

// Get network issues
const getIssues = async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};

    if (status) where.status = status;
    if (type) where.issueType = type;

    // Role-based scoping
    if (req.user.role === 'STUDENT') {
      where.userId = req.user.id;
    } else if (req.user.role === 'IT_STAFF') {
      // IT staff should only see issues assigned to them
      where.assignedToId = req.user.id;
    } else if (req.user.role === 'ADMIN') {
      // Admin can see all; no additional scoping
    } else {
      // Default safe behavior: only own created issues
      where.userId = req.user.id;
    }

    const issues = await prisma.networkIssue.findMany({
      where,
      include: {
        reportedBy: {
          select: { name: true, email: true, roomNo: true }
        },
        assignedTo: {
          select: { name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(issues);
  } catch (error) {
    console.error('Error fetching network issues:', error);
    res.status(500).json({ error: 'Failed to fetch network issues' });
  }
};

// Update issue status (IT staff/Admin only)
const updateIssueStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedToId } = req.body;

    console.log('Update request received:', { id, status, assignedToId });

    // Validate status if provided
    if (status && !['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CANCELLED'].includes(status)) {
      return res.status(400).json({ 
        error: 'Invalid status. Must be one of: OPEN, IN_PROGRESS, RESOLVED, CANCELLED' 
      });
    }

    // Check if issue exists
    const issue = await prisma.networkIssue.findUnique({
      where: { id: parseInt(id) },
    });

    if (!issue) {
      return res.status(404).json({ error: 'Network issue not found' });
    }

    // Check if assigned user exists and is IT staff
    if (assignedToId) {
      try {
        const user = await prisma.user.findUnique({
          where: { id: parseInt(assignedToId) },
          select: { role: true }
        });

        if (!user) {
          return res.status(400).json({ error: 'Assigned user not found' });
        }

        if (user.role !== 'IT_STAFF' && user.role !== 'ADMIN') {
          return res.status(400).json({ 
            error: 'Assigned user must be IT staff or admin' 
          });
        }
      } catch (error) {
        console.error('Error validating assigned user:', error);
        return res.status(400).json({ 
          error: 'Invalid assigned user ID' 
        });
      }
    }

    // Prepare update data
    const updateData = {};
    if (status) updateData.status = status;
    if (assignedToId) updateData.assignedToId = parseInt(assignedToId);

    // Update the issue
    const updatedIssue = await prisma.networkIssue.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        reportedBy: {
          select: { name: true, email: true, roomNo: true }
        },
        assignedTo: {
          select: { name: true, email: true }
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            author: {
              select: { name: true, email: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      },
    });

    console.log('Successfully updated issue:', updatedIssue.id);
    res.json(updatedIssue);
  } catch (error) {
    console.error('Error updating network issue:', error);
    
    // More specific error handling
    if (error.code === 'P2025') {
      return res.status(404).json({ 
        error: 'Network issue not found or invalid ID' 
      });
    }
    
    if (error.code === 'P2003') {
      return res.status(400).json({ 
        error: 'Invalid user ID or reference constraint failed' 
      });
    }
    
    res.status(500).json({ 
      error: 'Failed to update network issue',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Add comment to issue
const addComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    const comment = await prisma.networkComment.create({
      data: {
        content,
        issueId: parseInt(id),
        authorId: userId,
      },
      include: {
        author: {
          select: { name: true, email: true }
        }
      }
    });

    res.status(201).json(comment);
  } catch (error) {
    console.error('Error adding comment:', error);
    res.status(500).json({ error: 'Failed to add comment' });
  }
};

// Get issue comments
const getComments = async (req, res) => {
  try {
    const { id } = req.params;

    const comments = await prisma.networkComment.findMany({
      where: { issueId: parseInt(id) },
      include: {
        author: {
          select: { name: true, email: true }
        }
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json(comments);
  } catch (error) {
    console.error('Error fetching comments:', error);
    res.status(500).json({ error: 'Failed to fetch comments' });
  }
};

// List all IT staff (admin only)
const getItStaff = async (_req, res) => {
  try {
    const users = await prisma.user.findMany({
      where: { role: 'IT_STAFF' },
      select: { id: true, name: true, email: true },
      orderBy: { name: 'asc' },
    });
    res.json(users);
  } catch (error) {
    console.error('Error fetching IT staff:', error);
    res.status(500).json({ error: 'Failed to fetch IT staff' });
  }
};

module.exports = {
  reportIssue,
  getIssues,
  updateIssueStatus,
  addComment,
  getComments,
  getItStaff,
};
