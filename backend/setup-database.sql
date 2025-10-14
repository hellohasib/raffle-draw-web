-- MySQL Database Setup Script
-- Run this script in your MySQL client (MySQL Workbench, phpMyAdmin, or command line)

-- Create the database
CREATE DATABASE IF NOT EXISTS raffle_draw;

-- Create user if it doesn't exist (optional - you can use existing user)
-- CREATE USER IF NOT EXISTS 'sigmind'@'localhost' IDENTIFIED BY '$!gmind9876!';

-- Grant all privileges on the raffle_draw database to the user
GRANT ALL PRIVILEGES ON raffle_draw.* TO 'sigmind'@'localhost';

-- If you created a new user, flush privileges
-- FLUSH PRIVILEGES;

-- Verify the database was created
SHOW DATABASES;

-- Verify user permissions
SHOW GRANTS FOR 'sigmind'@'localhost';
