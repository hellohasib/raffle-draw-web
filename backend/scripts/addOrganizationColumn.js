const sequelize = require('../config/database');

async function addOrganizationColumn() {
  try {
    console.log('Adding organization column to users table...');
    
    // Add the organization column to the users table
    await sequelize.query(`
      ALTER TABLE users 
      ADD COLUMN organization VARCHAR(100) NULL 
      AFTER lastName
    `);
    
    console.log('✅ Organization column added successfully to users table');
    
  } catch (error) {
    console.error('❌ Error adding organization column:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the migration
addOrganizationColumn();
