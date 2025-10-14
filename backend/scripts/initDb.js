const sequelize = require('../config/database');
const { User, RaffleDraw, Prize, Participant } = require('../models');

const initializeDatabase = async () => {
  try {
    console.log('Initializing database...');
    
    // Test connection
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Sync all models
    await sequelize.sync({ force: true });
    console.log('Database models synchronized.');

    // Create default admin user
    const adminUser = await User.create({
      username: 'admin',
      email: 'admin@raffledraw.com',
      password: 'admin123',
      firstName: 'Admin',
      lastName: 'User',
      role: 'admin'
    });

    console.log('Default admin user created:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('Email: admin@raffledraw.com');

    // Create a sample user
    const sampleUser = await User.create({
      username: 'testuser',
      email: 'test@example.com',
      password: 'test123',
      firstName: 'Test',
      lastName: 'User',
      role: 'user'
    });

    console.log('Sample user created:');
    console.log('Username: testuser');
    console.log('Password: test123');
    console.log('Email: test@example.com');

    console.log('Database initialization completed successfully!');
    
  } catch (error) {
    console.error('Database initialization failed:', error);
  } finally {
    await sequelize.close();
  }
};

// Run initialization if this file is executed directly
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
