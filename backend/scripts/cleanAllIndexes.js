const sequelize = require('../config/database');

async function cleanAllIndexes() {
  try {
    console.log('🔧 Starting comprehensive index cleanup...\n');
    
    // Get all tables in the database
    const [tables] = await sequelize.query("SHOW TABLES");
    const tableNames = tables.map(row => Object.values(row)[0]);
    
    console.log(`Found ${tableNames.length} tables: ${tableNames.join(', ')}\n`);
    
    let totalIndexesRemoved = 0;
    
    for (const tableName of tableNames) {
      console.log(`📋 Processing table: ${tableName}`);
      
      try {
        // Get all indexes on the table
        const [indexes] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);
        
        if (indexes.length === 0) {
          console.log(`   No indexes found on ${tableName}\n`);
          continue;
        }
        
        console.log(`   Found ${indexes.length} indexes`);
        
        // Group indexes by column name
        const indexesByColumn = {};
        indexes.forEach(index => {
          if (!indexesByColumn[index.Column_name]) {
            indexesByColumn[index.Column_name] = [];
          }
          indexesByColumn[index.Column_name].push(index);
        });
        
        // Find duplicate indexes to remove
        const indexesToRemove = [];
        
        Object.keys(indexesByColumn).forEach(columnName => {
          const columnIndexes = indexesByColumn[columnName];
          
          // Keep the first index (usually the original), remove duplicates
          if (columnIndexes.length > 1) {
            // Sort by Key_name to keep the original index
            columnIndexes.sort((a, b) => a.Key_name.localeCompare(b.Key_name));
            
            // Mark all but the first as duplicates
            for (let i = 1; i < columnIndexes.length; i++) {
              const duplicateIndex = columnIndexes[i];
              // Skip PRIMARY key and foreign key constraints
              if (duplicateIndex.Key_name !== 'PRIMARY' && !duplicateIndex.Key_name.startsWith('PRIMARY')) {
                indexesToRemove.push(duplicateIndex.Key_name);
              }
            }
          }
        });
        
        // Remove duplicate indexes
        let indexesRemovedFromTable = 0;
        for (const indexName of indexesToRemove) {
          try {
            console.log(`   Removing duplicate index: ${indexName}`);
            await sequelize.query(`DROP INDEX \`${indexName}\` ON ${tableName}`);
            indexesRemovedFromTable++;
          } catch (error) {
            console.log(`   Could not remove index ${indexName}: ${error.message}`);
          }
        }
        
        totalIndexesRemoved += indexesRemovedFromTable;
        
        // Show final index count
        const [finalIndexes] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);
        console.log(`   ✅ ${tableName}: Removed ${indexesRemovedFromTable} duplicates, ${finalIndexes.length} indexes remaining\n`);
        
      } catch (error) {
        console.log(`   ❌ Error processing ${tableName}: ${error.message}\n`);
      }
    }
    
    console.log(`🎉 Index cleanup completed successfully!`);
    console.log(`📊 Total indexes removed: ${totalIndexesRemoved}`);
    
    // Show summary of all tables
    console.log('\n📋 Final index summary:');
    for (const tableName of tableNames) {
      try {
        const [finalIndexes] = await sequelize.query(`SHOW INDEX FROM ${tableName}`);
        console.log(`   ${tableName}: ${finalIndexes.length} indexes`);
      } catch (error) {
        console.log(`   ${tableName}: Error getting index count`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error during index cleanup:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the cleanup
cleanAllIndexes();
