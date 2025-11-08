const { PrismaClient } = require('@prisma/client');
const { RRule } = require('rrule');
const prisma = new PrismaClient();

/**
 * Create a recurring menu series
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const createRecurringMenu = async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      mealType, 
      items, 
      servingTime, 
      frequency, // 'DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS'
      daysOfWeek = [] // For WEEKLY frequency: [1,3,5] for Mon, Wed, Fri
    } = req.body;

    // Validate required fields
    if (!startDate || !endDate || !mealType || !items || !frequency) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['startDate', 'endDate', 'mealType', 'items', 'frequency']
      });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (isNaN(start) || isNaN(end)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid date format. Use ISO 8601 (e.g., 2025-11-09)'
      });
    }

    // Create base menu to get ID for the series
    const baseMenu = await prisma.messMenu.create({
      data: {
        date: start,
        mealType,
        servingTime,
        items: JSON.stringify(items),
        isRecurring: true,
        recurrenceEndsAt: end
      }
    });

    // Generate recurrence rules based on frequency
    let rule;
    const rules = [];
    
    switch (frequency) {
      case 'DAILY':
        rule = new RRule({
          freq: RRule.DAILY,
          dtstart: start,
          until: end,
        });
        rules.push(...rule.all());
        break;

      case 'WEEKLY':
        rule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: daysOfWeek.map(day => {
            // Convert from 0-6 (Sun-Sat) to RRule's weekday numbers (0=Monday)
            const rruleDay = (day + 6) % 7; // Convert to 0=Monday, 6=Sunday
            return rruleDay;
          }),
          dtstart: start,
          until: end,
        });
        rules.push(...rule.all());
        break;

      case 'WEEKDAYS':
        rule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: [RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR],
          dtstart: start,
          until: end,
        });
        rules.push(...rule.all());
        break;

      case 'WEEKENDS':
        rule = new RRule({
          freq: RRule.WEEKLY,
          byweekday: [RRule.SA, RRule.SU],
          dtstart: start,
          until: end,
        });
        rules.push(...rule.all());
        break;

      default:
        return res.status(400).json({
          success: false,
          error: 'Invalid frequency',
          validFrequencies: ['DAILY', 'WEEKLY', 'WEEKDAYS', 'WEEKENDS']
        });
    }

    // Remove the first date since it's already created as baseMenu
    const recurringDates = rules.filter(date => date > start);

    // Create recurring menus in bulk
    const recurringMenus = await Promise.all(
      recurringDates.map(date => 
        prisma.messMenu.create({
          data: {
            date,
            mealType,
            servingTime,
            items: JSON.stringify(items),
            isRecurring: true,
            recurrenceEndsAt: end,
            baseMenuId: baseMenu.id
          }
        })
      )
    );

    res.status(201).json({
      success: true,
      message: `Created ${recurringMenus.length + 1} menu instances`,
      baseMenuId: baseMenu.id,
      count: recurringMenus.length + 1
    });

  } catch (error) {
    console.error('Error creating recurring menu:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create recurring menu',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get all menus in a recurring series
 */
const getRecurringSeries = async (req, res) => {
  try {
    const { baseMenuId } = req.params;
    
    const series = await prisma.messMenu.findMany({
      where: {
        OR: [
          { id: parseInt(baseMenuId) },
          { baseMenuId: parseInt(baseMenuId) }
        ]
      },
      orderBy: { date: 'asc' }
    });

    res.json({
      success: true,
      count: series.length,
      data: series.map(menu => ({
        ...menu,
        items: JSON.parse(menu.items)
      }))
    });

  } catch (error) {
    console.error('Error fetching recurring series:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recurring series'
    });
  }
};

/**
 * Delete an entire recurring series
 */
const deleteRecurringSeries = async (req, res) => {
  try {
    const { baseMenuId } = req.params;
    
    // First, find all menus in the series
    const series = await prisma.messMenu.findMany({
      where: {
        OR: [
          { id: parseInt(baseMenuId) },
          { baseMenuId: parseInt(baseMenuId) }
        ]
      },
      select: { id: true }
    });

    // Delete all menus in the series
    await prisma.messMenu.deleteMany({
      where: {
        id: { in: series.map(m => m.id) }
      }
    });

    res.json({
      success: true,
      message: `Deleted ${series.length} menu instances`
    });

  } catch (error) {
    console.error('Error deleting recurring series:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete recurring series'
    });
  }
};

module.exports = {
  createRecurringMenu,
  getRecurringSeries,
  deleteRecurringSeries
};
