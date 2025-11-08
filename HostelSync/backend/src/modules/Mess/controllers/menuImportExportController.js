const { PrismaClient } = require('@prisma/client');
const { parse } = require('json2csv');
const { Parser } = require('json2csv');
const fs = require('fs');
const path = require('path');
const prisma = new PrismaClient();

/**
 * Export menus to CSV
 * @param {Date} startDate - Start date for filtering menus
 * @param {Date} endDate - End date for filtering menus
 * @returns {Promise<Object>} - CSV data and filename
 */
const exportMenusToCSV = async (startDate, endDate) => {
  try {
    const menus = await prisma.messMenu.findMany({
      where: {
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        }
      },
      orderBy: [
        { date: 'asc' },
        { mealType: 'asc' }
      ]
    });

    if (menus.length === 0) {
      throw new Error('No menus found for the specified date range');
    }

    // Transform data for CSV
    const dataForCsv = menus.map(menu => ({
      date: menu.date.toISOString().split('T')[0],
      mealType: menu.mealType,
      servingTime: menu.servingTime || '',
      isRecurring: menu.isRecurring ? 'Yes' : 'No',
      items: JSON.parse(menu.items).map(item => `${item.name} (${item.type})`).join(', ')
    }));

    // Define CSV fields
    const fields = [
      'date',
      'mealType',
      'servingTime',
      'isRecurring',
      'items'
    ];

    // Convert to CSV
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(dataForCsv);

    // Create filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `menus-export-${timestamp}.csv`;
    const filePath = path.join(__dirname, '../../../exports', filename);

    // Ensure exports directory exists
    const exportsDir = path.join(__dirname, '../../../exports');
    if (!fs.existsSync(exportsDir)) {
      fs.mkdirSync(exportsDir, { recursive: true });
    }

    // Save CSV file
    fs.writeFileSync(filePath, csv);

    return {
      filename,
      filePath,
      count: menus.length,
      startDate: startDate || 'Beginning',
      endDate: endDate || 'Now'
    };
  } catch (error) {
    console.error('Error exporting menus:', error);
    throw error;
  }
};

/**
 * Import menus from CSV
 * @param {string} filePath - Path to the CSV file
 * @returns {Promise<Object>} - Import result
 */
const importMenusFromCSV = async (filePath) => {
  try {
    // Read and parse CSV file
    const csvData = fs.readFileSync(filePath, 'utf-8');
    const { parse } = require('csv-parse/sync');
    const records = parse(csvData, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    if (records.length === 0) {
      throw new Error('No data found in the CSV file');
    }

    // Transform and validate records
    const menusToCreate = [];
    const errors = [];

    for (const [index, record] of records.entries()) {
      try {
        // Basic validation
        if (!record.date || !record.mealType || !record.items) {
          throw new Error('Missing required fields');
        }

        // Parse items
        const items = record.items.split(',').map(item => {
          const [name, type] = item.trim().split('(').map(s => s.trim());
          const itemType = type ? type.replace(')', '') : 'VEG';
          return {
            name: name.trim(),
            type: ['VEG', 'NON_VEG', 'JAIN', 'SPECIAL'].includes(itemType) 
              ? itemType 
              : 'VEG' // Default to VEG if invalid type
          };
        });

        menusToCreate.push({
          date: new Date(record.date),
          mealType: record.mealType.toUpperCase(),
          servingTime: record.servingTime || null,
          isRecurring: record.isRecurring === 'Yes',
          items: JSON.stringify(items),
          recurrenceRule: record.recurrenceRule || null,
          recurrenceEndsAt: record.recurrenceEndsAt ? new Date(record.recurrenceEndsAt) : null,
          baseMenuId: record.baseMenuId ? parseInt(record.baseMenuId) : null
        });
      } catch (error) {
        errors.push({
          row: index + 2, // +2 for header and 1-based index
          error: error.message,
          data: record
        });
      }
    }

    if (menusToCreate.length === 0) {
      throw new Error('No valid menu records found in the CSV file');
    }

    // Import valid records
    const createdMenus = [];
    for (const menu of menusToCreate) {
      try {
        const created = await prisma.messMenu.upsert({
          where: {
            date_mealType: {
              date: menu.date,
              mealType: menu.mealType
            }
          },
          update: menu,
          create: menu
        });
        createdMenus.push(created);
      } catch (error) {
        errors.push({
          row: 'N/A',
          error: `Database error: ${error.message}`,
          data: menu
        });
      }
    }

    return {
      success: true,
      imported: createdMenus.length,
      total: records.length,
      errors,
      hasErrors: errors.length > 0
    };
  } catch (error) {
    console.error('Error importing menus:', error);
    throw error;
  }
};

/**
 * Get CSV template for menu import
 * @returns {Object} - Template file info
 */
const getImportTemplate = () => {
  const templateData = [{
    date: 'YYYY-MM-DD',
    mealType: 'BREAKFAST|LUNCH|DINNER|SPECIAL',
    servingTime: 'HH:MM',
    isRecurring: 'Yes/No',
    items: 'Item 1 (VEG), Item 2 (NON_VEG)',
    recurrenceRule: 'Optional: RRULE format',
    recurrenceEndsAt: 'YYYY-MM-DD',
    baseMenuId: 'Optional: ID of base menu for recurring series'
  }];

  const fields = Object.keys(templateData[0]);
  const json2csvParser = new Parser({ fields });
  const csv = json2csvParser.parse(templateData);

  const filename = 'menu-import-template.csv';
  const filePath = path.join(__dirname, '../../../templates', filename);

  // Ensure templates directory exists
  const templatesDir = path.join(__dirname, '../../../templates');
  if (!fs.existsSync(templatesDir)) {
    fs.mkdirSync(templatesDir, { recursive: true });
  }

  // Save template file
  fs.writeFileSync(filePath, csv);

  return {
    filename,
    filePath
  };
};

module.exports = {
  exportMenusToCSV,
  importMenusFromCSV,
  getImportTemplate
};
