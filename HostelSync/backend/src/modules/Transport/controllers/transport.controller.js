const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all available vehicles
const getAvailableVehicles = async (req, res) => {
  try {
    const vehicles = await prisma.vehicle.findMany({
      where: { status: 'AVAILABLE' },
      include: { driver: true }
    });
    res.json(vehicles);
  } catch (error) {
    console.error('Error fetching vehicles:', error);
    res.status(500).json({ error: 'Failed to fetch vehicles' });
  }
};

// Get all routes with schedules
const getRoutes = async (req, res) => {
  try {
    const routes = await prisma.route.findMany({
      include: {
        schedules: {
          where: { isActive: true },
          include: {
            _count: {
              select: { bookings: true }
            },
            route: true
          }
        },
        vehicles: true
      }
    });
    res.json(routes);
  } catch (error) {
    console.error('Error fetching routes:', error);
    res.status(500).json({ error: 'Failed to fetch routes' });
  }
};

// Create a new booking
const createBooking = async (req, res) => {
  const { scheduleId, bookingDate } = req.body;
  const userId = req.user.id;

  try {
    // Check if booking already exists
    const existingBooking = await prisma.transportBooking.findFirst({
      where: {
        userId,
        scheduleId,
        bookingDate: new Date(bookingDate)
      }
    });

    if (existingBooking) {
      return res.status(400).json({ error: 'You have already booked this slot' });
    }

    // Get the schedule with vehicle and booking count
    const [schedule, bookingCount] = await Promise.all([
      prisma.schedule.findUnique({
        where: { id: scheduleId },
        include: {
          vehicle: true,
          route: true
        }
      }),
      prisma.transportBooking.count({
        where: { 
          scheduleId,
          bookingDate: new Date(bookingDate),
          status: { not: 'CANCELLED' }
        }
      })
    ]);

    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }

    // Check capacity
    if (bookingCount >= schedule.maxCapacity) {
      return res.status(400).json({ error: 'No available seats' });
    }

    // Create booking
    const booking = await prisma.transportBooking.create({
      data: {
        userId,
        vehicleId: schedule.vehicleId,  // Use schedule.vehicleId instead of vehicle.id
        scheduleId,
        bookingDate: new Date(bookingDate),
        status: 'CONFIRMED'
      },
      include: {
        schedule: {
          include: {
            route: true,
            vehicle: true
          }
        }
      }
    });

    res.status(201).json(booking);
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ error: 'Failed to create booking' });
  }
};

// Get user's bookings
const getUserBookings = async (req, res) => {
  try {
    // Get user ID from the token (it's in req.user.id)
    const userId = req.user.id;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID not found in token' });
    }

    console.log('Fetching bookings for user ID:', userId);
    
    // First, verify the user exists
    const userExists = await prisma.user.findUnique({
      where: { id: parseInt(userId) },
      select: { id: true }
    });

    if (!userExists) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Now fetch the bookings with proper relations
    const bookings = await prisma.transportBooking.findMany({
      where: { 
        userId: parseInt(userId)
      },
      include: {
        schedule: {
          include: {
            route: true,
            vehicle: true
          }
        },
        vehicle: true
      },
      orderBy: {
        createdAt: 'desc'  // Using createdAt for more reliable ordering
      }
    });
    
    console.log(`Found ${bookings.length} bookings for user ${userId}`);
    
    // Transform the response to be more client-friendly
    const formattedBookings = bookings.map(booking => ({
      id: booking.id,
      bookingDate: booking.bookingDate,
      status: booking.status,
      schedule: {
        id: booking.schedule.id,
        departureTime: booking.schedule.departureTime,
        route: booking.schedule.route,
        vehicle: booking.schedule.vehicle || booking.vehicle
      },
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt
    }));
    
    res.json(formattedBookings);
    
  } catch (error) {
    console.error('Error in getUserBookings:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      code: error.code
    });
    
    // Handle specific Prisma errors
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'Related record not found' });
    }
    
    res.status(500).json({ 
      error: 'Failed to fetch bookings',
      ...(process.env.NODE_ENV === 'development' && {
        details: error.message,
        code: error.code
      })
    });
  }
};

// Cancel a booking
const cancelBooking = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const booking = await prisma.transportBooking.findUnique({
      where: { id: parseInt(id) }
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    if (booking.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to cancel this booking' });
    }

    // Allow cancellation only if booking is in the future
    const bookingDate = new Date(booking.bookingDate);
    const now = new Date();
    
    if (bookingDate < now) {
      return res.status(400).json({ error: 'Cannot cancel past bookings' });
    }

    const updatedBooking = await prisma.transportBooking.update({
      where: { id: parseInt(id) },
      data: { status: 'CANCELLED' }
    });

    res.json(updatedBooking);
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ error: 'Failed to cancel booking' });
  }
};

// Admin: Add a new vehicle
const addVehicle = async (req, res) => {
  try {
    const { type, number, capacity, driverId } = req.body;
    
    const vehicleData = {
      type,
      number,
      capacity: parseInt(capacity),
      status: 'AVAILABLE'
    };

    // Only add driverId if it's provided
    if (driverId) {
      // Verify driver exists if driverId is provided
      const driver = await prisma.user.findUnique({
        where: { id: parseInt(driverId), role: 'DRIVER' }
      });

      if (!driver) {
        return res.status(400).json({ error: 'Driver not found or invalid driver ID' });
      }
      
      vehicleData.driver = {
        connect: { id: driver.id }
      };
    }

    const vehicle = await prisma.vehicle.create({
      data: vehicleData,
      include: { driver: true }
    });
    
    res.status(201).json(vehicle);
  } catch (error) {
    console.error('Error adding vehicle:', error);
    res.status(500).json({ 
      error: 'Failed to add vehicle',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Admin: Add a new route
const addRoute = async (req, res) => {
  try {
    const { name, description, startPoint, endPoint, stops } = req.body;
    
    const route = await prisma.route.create({
      data: {
        name,
        description: description || '',
        startPoint,
        endPoint,
        stops: stops || []
      }
    });
    
    res.status(201).json(route);
  } catch (error) {
    console.error('Error adding route:', error);
    res.status(500).json({ error: 'Failed to add route' });
  }
};

// Admin: Add a schedule to a route
const addSchedule = async (req, res) => {
  try {
    const { 
      routeId, 
      vehicleId, 
      day, 
      startTime,
      endTime,
      startDate, 
      endDate, 
      maxCapacity, 
      price 
    } = req.body;

    // Check if route exists
    const route = await prisma.route.findUnique({
      where: { id: parseInt(routeId) }
    });

    if (!route) {
      return res.status(404).json({ error: 'Route not found' });
    }

    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(vehicleId) }
    });
    
    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if a schedule with the same details already exists
    const existingSchedule = await prisma.schedule.findFirst({
      where: {
        routeId: parseInt(routeId),
        day: day.toUpperCase(),
        startTime,
        vehicleId: parseInt(vehicleId)
      }
    });

    if (existingSchedule) {
      return res.status(400).json({
        error: 'Schedule already exists',
        details: 'A schedule with the same route, day, time and vehicle already exists.'
      });
    }

    // Create the schedule
    const schedule = await prisma.schedule.create({
      data: {
        routeId: parseInt(routeId),
        vehicleId: parseInt(vehicleId),
        day: day.toUpperCase(),
        startTime,
        endTime,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxCapacity: parseInt(maxCapacity),
        price: parseFloat(price),
        isActive: true
      },
      include: {
        route: true,
        vehicle: true
      }
    });

    // Format the response
    const response = {
      id: schedule.id,
      route: {
        id: schedule.route.id,
        name: schedule.route.name,
        startPoint: schedule.route.startPoint,
        endPoint: schedule.route.endPoint
      },
      vehicle: {
        id: schedule.vehicle.id,
        type: schedule.vehicle.type,
        number: schedule.vehicle.number
      },
      day: schedule.day,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      startDate: schedule.startDate,
      endDate: schedule.endDate,
      maxCapacity: schedule.maxCapacity,
      price: schedule.price,
      isActive: schedule.isActive,
      createdAt: schedule.createdAt,
      updatedAt: schedule.updatedAt
    };

    res.status(201).json({
      message: 'Schedule created successfully',
      schedule: response
    });
  } catch (error) {
    console.error('Error adding schedule:', error);
    
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        error: 'Database error',
        details: 'A schedule with these details already exists.'
      });
    }

    // Handle validation errors
    if (error.name === 'PrismaClientValidationError') {
      return res.status(400).json({
        error: 'Validation error',
        details: 'Please check your input data and try again.'
      });
    }

    res.status(500).json({ 
      error: 'Failed to add schedule',
      details: process.env.NODE_ENV === 'development' ? error.message : 'An unexpected error occurred.'
    });
  }
};
// Admin: Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const { date, status } = req.query;
    
    const where = {};
    if (date) where.bookingDate = new Date(date);
    if (status) where.status = status;
    
    const bookings = await prisma.transportBooking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        vehicle: true,
        schedule: {
          include: {
            route: true
          }
        }
      },
      orderBy: {
        bookingDate: 'desc'
      }
    });
    
    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
};

// Delete a vehicle (Admin)
const deleteVehicle = async (req, res) => {
  const { id } = req.params;

  try {
    // Check if vehicle exists
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: parseInt(id) }
    });

    if (!vehicle) {
      return res.status(404).json({ error: 'Vehicle not found' });
    }

    // Check if vehicle has any active schedules
    const activeSchedules = await prisma.schedule.findFirst({
      where: {
        vehicleId: parseInt(id),
        isActive: true
      }
    });

    if (activeSchedules) {
      return res.status(400).json({
        error: 'Cannot delete vehicle with active schedules. Please deactivate schedules first.'
      });
    }

    // Delete the vehicle
    await prisma.vehicle.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    console.error('Error deleting vehicle:', error);
    res.status(500).json({ 
      error: 'Failed to delete vehicle',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getAvailableVehicles,
  getRoutes,
  createBooking,
  getUserBookings,
  cancelBooking,
  // Admin exports
  addVehicle,
  addRoute,
  addSchedule,
  deleteVehicle,
  getAllBookings
};
