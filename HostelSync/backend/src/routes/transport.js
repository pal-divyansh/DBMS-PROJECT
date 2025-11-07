const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { authenticateToken, authorizeRole } = require('./auth'); // adjusted path to existing exports

// GET /api/transport/spots
router.get('/spots', async (req, res) => {
  try {
    const spots = await prisma.transportSpot.findMany({
      include: { vehicle: true }
    });
    res.json(spots);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch spots' });
  }
});

// POST /api/transport/add-vehicle (Admin/Warden)
router.post('/add-vehicle', authenticateToken, authorizeRole(['ADMIN','WARDEN']), async (req, res) => {
  try {
    const { name, type, totalSeats, regNumber, driverName, contactNumber } = req.body;
    const vehicle = await prisma.vehicle.create({
      data: { name, type, totalSeats, regNumber, driverName, contactNumber }
    });
    res.status(201).json(vehicle);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add vehicle' });
  }
});

// POST /api/transport/add-spot (Admin/Warden)
router.post('/add-spot', authenticateToken, authorizeRole(['ADMIN','WARDEN']), async (req, res) => {
  try {
    const { fromLocation, toLocation, distanceKm, baseFare, availableSeats, vehicleId } = req.body;
    const spot = await prisma.transportSpot.create({
      data: { fromLocation, toLocation, distanceKm, baseFare, availableSeats, vehicleId }
    });
    res.status(201).json(spot);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add spot' });
  }
});

// POST /api/transport/book (Student)
router.post('/book', authenticateToken, authorizeRole(['STUDENT']), async (req, res) => {
  try {
    const userId = req.user.id; // ensure your auth middleware attaches user
    const { transportSpotId, seatsBooked } = req.body;

    // fetch spot and check availability
    const spot = await prisma.transportSpot.findUnique({ where: { id: transportSpotId } });
    if (!spot) return res.status(404).json({ error: 'Transport spot not found' });
    if (spot.availableSeats < seatsBooked) return res.status(400).json({ error: 'Not enough seats' });

    // calculate fare
    const totalFare = Number(spot.baseFare) * Number(seatsBooked);

    // create booking and update seats in a transaction
    const [booking] = await prisma.$transaction([
      prisma.transportBooking.create({
        data: {
          userId,
          transportSpotId,
          seatsBooked,
          totalFare
        },
        include: { user: true, transportSpot: true }
      }),
      prisma.transportSpot.update({
        where: { id: transportSpotId },
        data: { availableSeats: { decrement: seatsBooked } }
      })
    ]);

    res.status(201).json(booking);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Booking failed' });
  }
});

// GET /api/transport/my-bookings (Student)
router.get('/my-bookings', authenticateToken, authorizeRole(['STUDENT']), async (req, res) => {
  try {
    const userId = req.user.id;
    const bookings = await prisma.transportBooking.findMany({
      where: { userId },
      include: { transportSpot: { include: { vehicle: true } } },
      orderBy: { bookingDate: 'desc' }
    });
    res.json(bookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

// GET /api/transport/all-bookings (Admin/Warden)
router.get('/all-bookings', authenticateToken, authorizeRole(['ADMIN','WARDEN']), async (req, res) => {
  try {
    const all = await prisma.transportBooking.findMany({
      include: { user: true, transportSpot: { include: { vehicle: true } } },
      orderBy: { bookingDate: 'desc' }
    });
    res.json(all);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});

module.exports = router;
