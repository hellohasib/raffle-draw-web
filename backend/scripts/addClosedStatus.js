/**
 * Migration Script: Add 'closed' status to RaffleDraw enum
 * 
 * This script adds the 'closed' status value to the existing
 * raffle_draws status enum in the database.
 * 
 * Run this script once after pulling the latest code changes.
 */

const { sequelize } = require('../models');

async function addClosedStatus() {
  console.log('🔄 Starting migration: Adding "closed" status to raffle_draws...');
  
  try {
    // Check the database dialect
    const dialect = sequelize.getDialect();
    console.log(`📊 Database dialect: ${dialect}`);

    if (dialect === 'postgres') {
      // PostgreSQL: Add enum value
      console.log('🔧 Executing PostgreSQL enum update...');
      
      // Check if the value already exists
      const checkQuery = `
        SELECT EXISTS (
          SELECT 1 FROM pg_enum 
          WHERE enumlabel = 'closed' 
          AND enumtypid = (
            SELECT oid FROM pg_type WHERE typname = 'enum_raffle_draws_status'
          )
        ) as exists;
      `;
      
      const [result] = await sequelize.query(checkQuery);
      
      if (result[0].exists) {
        console.log('✅ The "closed" status already exists in the enum. No changes needed.');
        return;
      }

      // Add the new enum value
      await sequelize.query(`
        ALTER TYPE enum_raffle_draws_status ADD VALUE 'closed';
      `);
      
      console.log('✅ Successfully added "closed" status to enum_raffle_draws_status');
      
    } else if (dialect === 'mysql' || dialect === 'mariadb') {
      // MySQL/MariaDB: Modify column enum
      console.log('🔧 Executing MySQL enum update...');
      
      await sequelize.query(`
        ALTER TABLE raffle_draws 
        MODIFY COLUMN status 
        ENUM('draft', 'active', 'completed', 'cancelled', 'closed') 
        DEFAULT 'draft' 
        NOT NULL;
      `);
      
      console.log('✅ Successfully updated status column enum values');
      
    } else if (dialect === 'sqlite') {
      // SQLite: No native enum support, just a note
      console.log('ℹ️  SQLite detected: No enum migration needed (SQLite doesn\'t use native enums)');
      console.log('✅ Application-level validation will handle the new status');
      
    } else {
      console.warn(`⚠️  Unknown database dialect: ${dialect}`);
      console.warn('⚠️  You may need to manually add the "closed" status to your database');
    }

    console.log('\n✨ Migration completed successfully!');
    console.log('📝 The "closed" status is now available for raffle draws.');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('\n📋 Error details:', error);
    
    // Provide helpful guidance
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure your database connection is configured correctly');
    console.log('2. Ensure you have the necessary permissions to alter the table');
    console.log('3. If the error persists, you can manually run the SQL command:');
    
    if (sequelize.getDialect() === 'postgres') {
      console.log('   ALTER TYPE enum_raffle_draws_status ADD VALUE \'closed\';');
    } else if (sequelize.getDialect() === 'mysql') {
      console.log('   ALTER TABLE raffle_draws MODIFY COLUMN status');
      console.log('   ENUM(\'draft\', \'active\', \'completed\', \'cancelled\', \'closed\')');
      console.log('   DEFAULT \'draft\' NOT NULL;');
    }
    
    process.exit(1);
  }
}

// Run the migration
addClosedStatus()
  .then(() => {
    console.log('\n🎉 All done! Your database is now up to date.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Unexpected error:', error);
    process.exit(1);
  });

