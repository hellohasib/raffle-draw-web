const sequelize = require('../config/database');

async function cleanUsersIndexes() {
  try {
    console.log('Cleaning up duplicate indexes in users table...');
    
    // Get all indexes
    const [indexes] = await sequelize.query(`SHOW INDEX FROM users;`);
    
    // Group indexes by column name
    const indexGroups = {};
    indexes.forEach(index => {
      if (index.Key_name !== 'PRIMARY') {
        if (!indexGroups[index.Column_name]) {
          indexGroups[index.Column_name] = [];
        }
        indexGroups[index.Column_name].push(index.Key_name);
      }
    });
    
    console.log('Index groups:', indexGroups);
    
    // Remove duplicate indexes, keeping only the first one for each column
    for (const [column, indexNames] of Object.entries(indexGroups)) {
      if (indexNames.length > 1) {
        // Keep the first index, remove the rest
        const indexesToRemove = indexNames.slice(1);
        
        for (const indexName of indexesToRemove) {
          try {
            console.log(`Dropping duplicate index: ${indexName} on column ${column}`);
            await sequelize.query(`DROP INDEX \`${indexName}\` ON users;`);
          } catch (error) {
            console.log(`Could not drop index ${indexName}: ${error.message}`);
          }
        }
      }
    }
    
    // Verify the cleanup
    const [remainingIndexes] = await sequelize.query(`SHOW INDEX FROM users;`);
    console.log(`\nRemaining indexes: ${remainingIndexes.length}`);
    remainingIndexes.forEach(index => {
      console.log(`  - ${index.Key_name}: ${index.Column_name}`);
    });
    
    console.log('✅ Users table indexes cleaned up successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning indexes:', error.message);
    throw error;
  }
}

// Run the cleanup
cleanUsersIndexes()
  .then(() => {
    console.log('🎉 Index cleanup completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Index cleanup failed:', error);
    process.exit(1);
  });
