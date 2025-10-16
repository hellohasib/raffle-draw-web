const sequelize = require('../config/database');

async function addDesignationColumn() {
  try {
    console.log('Adding designation column to participants table...');
    
    // Add the designation column to the participants table
    await sequelize.query(`
      ALTER TABLE participants 
      ADD COLUMN designation VARCHAR(100) NULL 
      AFTER phone;
    `);
    
    console.log('✅ Successfully added designation column to participants table');
    
    // Verify the column was added
    const [results] = await sequelize.query(`
      DESCRIBE participants;
    `);
    
    console.log('📋 Current participants table structure:');
    results.forEach(row => {
      console.log(`  - ${row.Field}: ${row.Type} ${row.Null === 'YES' ? '(NULL)' : '(NOT NULL)'} ${row.Key ? `[${row.Key}]` : ''}`);
    });
    
  } catch (error) {
    if (error.message.includes('Duplicate column name')) {
      console.log('ℹ️  Designation column already exists in participants table');
    } else {
      console.error('❌ Error adding designation column:', error.message);
      throw error;
    }
  }
}

// Run the migration
addDesignationColumn()
  .then(() => {
    console.log('🎉 Migration completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });
