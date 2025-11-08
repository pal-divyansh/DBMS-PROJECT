const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Create a new cleaning request
const createCleaningRequest = async (req, res) => {
  try {
    const { room, building, cleaningType, scheduledDate, timeSlot, specialInstructions } = req.body;
    const studentId = req.user.id;

    const cleaningRequest = await prisma.cleaningRequest.create({
      data: {
        studentId,
        room,
        building,
        cleaningType,
        scheduledDate: new Date(scheduledDate),
        timeSlot,
        specialInstructions,
        status: 'PENDING'
      },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            roomNo: true
          }
        }
      }
    });

    res.status(201).json({
      message: 'Cleaning request created successfully',
      data: cleaningRequest
    });
  } catch (error) {
    console.error('Error creating cleaning request:', error);
    res.status(500).json({ error: 'Failed to create cleaning request' });
  }
};

// Get cleaning requests for a student
const getStudentCleaningRequests = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { status } = req.query;

    const where = { studentId };
    if (status) where.status = status;

    const requests = await prisma.cleaningRequest.findMany({
      where,
      orderBy: { scheduledDate: 'desc' },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching cleaning requests:', error);
    res.status(500).json({ error: 'Failed to fetch cleaning requests' });
  }
};

// Update cleaning request status (for cleaners/admins)
const updateCleaningRequestStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, cleanerId } = req.body;

    const request = await prisma.cleaningRequest.findUnique({
      where: { id: parseInt(id) }
    });

    if (!request) {
      return res.status(404).json({ error: 'Cleaning request not found' });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (cleanerId) updateData.cleanerId = parseInt(cleanerId);
    
    if (status === 'COMPLETED') updateData.completedAt = new Date();
    if (status === 'CANCELLED') updateData.cancelledAt = new Date();

    const updatedRequest = await prisma.cleaningRequest.update({
      where: { id: parseInt(id) },
      data: updateData,
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            roomNo: true
          }
        },
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json({
      message: 'Cleaning request updated successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error updating cleaning request:', error);
    res.status(500).json({ error: 'Failed to update cleaning request' });
  }
};

// Get all cleaning requests (for admins/cleaners)
const getAllCleaningRequests = async (req, res) => {
  try {
    const { status, cleanerId, building } = req.query;
    
    const where = {};
    if (status) where.status = status;
    if (cleanerId) where.cleanerId = parseInt(cleanerId);
    if (building) where.building = building;

    const requests = await prisma.cleaningRequest.findMany({
      where,
      orderBy: { scheduledDate: 'asc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            email: true,
            roomNo: true
          }
        },
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    res.json(requests);
  } catch (error) {
    console.error('Error fetching all cleaning requests:', error);
    res.status(500).json({ error: 'Failed to fetch cleaning requests' });
  }
};

// Submit feedback for a completed cleaning
const submitFeedback = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const studentId = req.user.id;

    console.log(`Submitting feedback for request ${id} by user ${studentId}`);

    // First check if the request exists and belongs to the student
    const request = await prisma.cleaningRequest.findUnique({
      where: { id: parseInt(id) },
      select: {
        id: true,
        status: true,
        studentId: true,
        rating: true
      }
    });

    console.log('Found request:', request);

    // Check if request exists
    if (!request) {
      console.log('Request not found');
      return res.status(404).json({ 
        error: 'Cleaning request not found' 
      });
    }

    // Check if request belongs to the student
    if (request.studentId !== studentId) {
      console.log('Unauthorized access attempt');
      return res.status(403).json({ 
        error: 'You are not authorized to provide feedback for this request' 
      });
    }

    // Check if request is completed
    if (request.status !== 'COMPLETED') {
      console.log('Request not completed, current status:', request.status);
      return res.status(400).json({ 
        error: 'Feedback can only be submitted for completed cleaning requests',
        currentStatus: request.status
      });
    }

    // Check if feedback was already submitted
    if (request.rating !== null) {
      console.log('Feedback already submitted');
      return res.status(400).json({ 
        error: 'Feedback has already been submitted for this request' 
      });
    }

    // Update the request with feedback
    const updatedRequest = await prisma.cleaningRequest.update({
      where: { id: parseInt(id) },
      data: {
        rating: parseInt(rating),
        feedback: feedback || null
      },
      include: {
        cleaner: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        student: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    console.log('Feedback submitted successfully');
    res.json({
      message: 'Feedback submitted successfully',
      data: updatedRequest
    });
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ 
      error: 'Failed to submit feedback',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  createCleaningRequest,
  getStudentCleaningRequests,
  updateCleaningRequestStatus,
  getAllCleaningRequests,
  submitFeedback
};
