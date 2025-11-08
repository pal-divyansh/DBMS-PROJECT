const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get current week's menu
const getWeeklyMenu = async (req, res) => {
  try {
    const startOfWeek = new Date();
    startOfWeek.setHours(0, 0, 0, 0);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Start of current week (Sunday)
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 7); // End of current week (next Sunday)

    console.log('Fetching menu from', startOfWeek, 'to', endOfWeek);

    const menu = await prisma.messMenu.findMany({
      where: {
        date: {
          gte: startOfWeek,
          lt: endOfWeek
        }
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' }
      ]
    });

    console.log('Found', menu.length, 'menu items');

    if (menu.length === 0) {
      // Check if there are any menus in the database at all
      const anyMenu = await prisma.messMenu.findFirst();
      console.log('Any menu in database?', anyMenu ? 'Yes' : 'No');
      
      if (!anyMenu) {
        return res.status(404).json({ 
          message: 'No menu data found',
          suggestion: 'Please create a menu first using POST /api/mess/menu'
        });
      }
      
      // Check date ranges in the database
      const earliestMenu = await prisma.messMenu.findFirst({
        orderBy: { date: 'asc' }
      });
      
      const latestMenu = await prisma.messMenu.findFirst({
        orderBy: { date: 'desc' }
      });
      
      console.log('Earliest menu date:', earliestMenu?.date);
      console.log('Latest menu date:', latestMenu?.date);
      
      return res.status(404).json({
        message: 'No menu found for the current week',
        currentWeek: {
          start: startOfWeek,
          end: endOfWeek
        },
        availableRanges: earliestMenu && latestMenu ? {
          earliest: earliestMenu.date,
          latest: latestMenu.date
        } : 'No menu data available'
      });
    }

    // Parse items and include servingTime in the response
    const response = menu.map(item => ({
      ...item,
      items: JSON.parse(item.items)
    }));

    res.json(response);
  } catch (error) {
    console.error('Error fetching weekly menu:', error);
    res.status(500).json({ 
      error: 'Failed to fetch weekly menu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Create/Update menu (Admin only)
const updateMenu = async (req, res) => {
  try {
    const { date, mealType, items, servingTime } = req.body;
    
    // Validate required fields
    if (!date || !mealType || !items) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['date', 'mealType', 'items']
      });
    }

    // Parse and validate date
    const menuDate = new Date(date);
    if (isNaN(menuDate.getTime())) {
      return res.status(400).json({ 
        error: 'Invalid date format',
        expectedFormat: 'YYYY-MM-DD or ISO date string'
      });
    }
    
    // Normalize mealType to uppercase
    const normalizedMealType = mealType.toUpperCase();
    const validMealTypes = ['BREAKFAST', 'LUNCH', 'DINNER', 'SPECIAL'];
    if (!validMealTypes.includes(normalizedMealType)) {
      return res.status(400).json({ 
        error: 'Invalid meal type',
        validMealTypes
      });
    }
    
    // Prepare data for create/update
    const menuData = {
      items: JSON.stringify(items),
      updatedAt: new Date()
    };
    
    // Add servingTime if provided
    if (servingTime) {
      // Basic time format validation (HH:MM)
      if (!/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(servingTime)) {
        return res.status(400).json({ 
          error: 'Invalid serving time format',
          expectedFormat: 'HH:MM (24-hour format)'
        });
      }
      menuData.servingTime = servingTime;
    }
    
    const menu = await prisma.messMenu.upsert({
      where: {
        date_mealType: {
          date: menuDate,
          mealType: normalizedMealType
        }
      },
      update: menuData,
      create: {
        date: menuDate,
        mealType: normalizedMealType,
        servingTime: servingTime || null,
        items: JSON.stringify(items)
      }
    });

    // Parse items for response
    const response = {
      ...menu,
      items: JSON.parse(menu.items)
    };

    res.json(response);
  } catch (error) {
    console.error('Error updating menu:', error);
    res.status(500).json({ 
      error: 'Failed to update menu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// Submit feedback (Student)
const submitFeedback = async (req, res) => {
  try {
    const { menuId, rating, comment } = req.body;
    const userId = req.user.id;

    const feedback = await prisma.mealFeedback.create({
      data: {
        userId,
        menuId,
        rating,
        comment,
        status: 'PENDING'
      }
    });

    res.status(201).json(feedback);
  } catch (error) {
    console.error('Error submitting feedback:', error);
    res.status(500).json({ error: 'Failed to submit feedback' });
  }
};

// Get feedback (Admin)
const getFeedback = async (req, res) => {
  try {
    const { status, startDate, endDate } = req.query;
    
    const where = {};
    if (status) where.status = status;
    
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const feedback = await prisma.mealFeedback.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        menu: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json(feedback);
  } catch (error) {
    console.error('Error fetching feedback:', error);
    res.status(500).json({ error: 'Failed to fetch feedback' });
  }
};

// Delete menu (Admin only)
const deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if menu exists
    const menu = await prisma.messMenu.findUnique({
      where: { id: parseInt(id) }
    });
    
    if (!menu) {
      return res.status(404).json({ 
        success: false,
        error: 'Menu not found' 
      });
    }
    
    // Delete the menu
    await prisma.messMenu.delete({
      where: { id: parseInt(id) }
    });
    
    res.json({ 
      success: true, 
      message: 'Menu deleted successfully' 
    });
    
  } catch (error) {
    console.error('Error deleting menu:', error);
    
    // Handle foreign key constraint errors
    if (error.code === 'P2003') {
      return res.status(400).json({
        success: false,
        error: 'Cannot delete menu with existing feedback',
        suggestion: 'Delete associated feedback first or contact support'
      });
    }
    
    res.status(500).json({ 
      success: false,
      error: 'Failed to delete menu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  getWeeklyMenu,
  updateMenu,
  submitFeedback,
  getFeedback,
  deleteMenu
};
