# Database Index Cleanup Guide

## Issue Description

The MySQL database was experiencing "Too many keys specified; max 64 keys allowed" errors when trying to create or modify indexes. This happened because Sequelize was creating duplicate indexes during development, accumulating more than 64 indexes per table (MySQL's limit).

## Root Cause

During development with Sequelize, when models are synchronized multiple times, the ORM can create duplicate indexes with names like:
- `username_2`, `username_3`, `email_2`, `email_3`, etc.
- `ticketNumber_2`, `ticketNumber_3`, etc.

This typically occurs when:
1. Running `sequelize.sync()` multiple times
2. Model definitions are modified and re-synchronized
3. Development server restarts frequently with auto-sync enabled

## Solution

We created cleanup scripts to remove duplicate indexes and restore proper index structure:

### Available Scripts

1. **`npm run clean-indexes`** - Cleans duplicate indexes from users table
2. **`npm run clean-participants-indexes`** - Cleans duplicate indexes from participants table  
3. **`npm run clean-all-indexes`** - Comprehensive cleanup of all tables

### What the Scripts Do

1. **Identify Duplicates**: Find indexes with duplicate column names (e.g., `username_2`, `username_3`)
2. **Remove Duplicates**: Keep the original index, remove numbered duplicates
3. **Preserve Required Indexes**: Ensure unique constraints are maintained
4. **Report Results**: Show how many indexes were removed and final count

## Prevention Strategies

### 1. Disable Auto-Sync in Production

Update your database configuration to prevent automatic synchronization:

```javascript
// In config/database.js or server.js
await sequelize.sync({ force: false, alter: false });
```

### 2. Use Migrations Instead of Sync

For production deployments, use Sequelize migrations instead of `sync()`:

```bash
# Create migration
npx sequelize-cli migration:generate --name add-closed-status

# Run migrations
npx sequelize-cli db:migrate
```

### 3. Development Best Practices

- Use `alter: false` in development
- Run cleanup scripts periodically during development
- Monitor index count: `SHOW INDEX FROM table_name;`

## Emergency Cleanup

If you encounter the "Too many keys" error again:

```bash
# Quick cleanup of all tables
npm run clean-all-indexes

# Or individual table cleanup
npm run clean-indexes
npm run clean-participants-indexes
```

## Verification

After cleanup, verify the fix:

```sql
-- Check index count (should be reasonable number)
SELECT COUNT(*) FROM information_schema.statistics 
WHERE table_name = 'users' AND table_schema = 'raffle_draw';

-- Should show only essential indexes
SHOW INDEX FROM users;
SHOW INDEX FROM participants;
```

## Expected Index Structure

### Users Table
- `PRIMARY` (id)
- `username` (unique)
- `email` (unique)

### Participants Table  
- `PRIMARY` (id)
- `ticketNumber` (unique)
- Foreign key indexes for relationships

## Monitoring

To prevent future issues, periodically check:

```bash
# Check index count for all tables
mysql -u username -p database_name -e "
SELECT table_name, COUNT(*) as index_count 
FROM information_schema.statistics 
WHERE table_schema = 'raffle_draw' 
GROUP BY table_name;"
```

## Environment Configuration

The cleanup scripts use the same environment configuration as the main application:

- `DB_NAME` - Database name
- `DB_USER` - Database username  
- `DB_PASSWORD` - Database password
- `DB_HOST` - Database host

Make sure your `.env` file is properly configured before running cleanup scripts.
