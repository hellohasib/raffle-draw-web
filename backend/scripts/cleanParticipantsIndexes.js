const sequelize = require('../config/database');

async function cleanParticipantsIndexes() {
  try {
    console.log('Starting cleanup of duplicate indexes on participants table...');
    
    // Get all indexes on participants table
    const [indexes] = await sequelize.query("SHOW INDEX FROM participants");
    
    console.log(`Found ${indexes.length} indexes on participants table`);
    
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
          // Skip PRIMARY key
          if (duplicateIndex.Key_name !== 'PRIMARY') {
            indexesToRemove.push(duplicateIndex.Key_name);
          }
        }
      }
    });
    
    // Remove duplicate indexes
    for (const indexName of indexesToRemove) {
      try {
        console.log(`Removing duplicate index: ${indexName}`);
        await sequelize.query(`DROP INDEX \`${indexName}\` ON participants`);
      } catch (error) {
        console.log(`Could not remove index ${indexName}: ${error.message}`);
      }
    }
    
    console.log(`Cleanup completed. Removed ${indexesToRemove.length} duplicate indexes.`);
    
    // Show final index count
    const [finalIndexes] = await sequelize.query("SHOW INDEX FROM participants");
    console.log(`Final index count: ${finalIndexes.length}`);
    
    // Verify we have the required unique indexes
    const hasTicketNumberIndex = finalIndexes.some(idx => idx.Column_name === 'ticketNumber' && idx.Non_unique === 0);
    
    if (!hasTicketNumberIndex) {
      console.log('Creating missing ticketNumber unique index...');
      await sequelize.query('ALTER TABLE participants ADD UNIQUE INDEX ticketNumber (ticketNumber)');
    }
    
    console.log('✅ Participants table index cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error cleaning up indexes:', error);
  } finally {
    await sequelize.close();
  }
}

// Run the cleanup
cleanParticipantsIndexes();
