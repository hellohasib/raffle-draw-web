# Migration Guide: Adding New Features

## Overview
This guide helps you update your existing raffle draw system with the new features:
- **Download Winners** functionality
- **Closed Status** for raffle draws

## Prerequisites
- Node.js installed
- Database credentials configured in `backend/config/database.js`
- Backup of your database (recommended)

---

## Step 1: Pull Latest Code

```bash
git pull origin main
```

---

## Step 2: Install Dependencies

### Backend
```bash
cd backend
npm install
```

### Frontend
```bash
cd frontend
npm install
```

---

## Step 3: Database Migration

### Why is this needed?
The new "closed" status requires adding a new value to the database enum for raffle draw status.

### Run the Migration Script

```bash
cd backend
node scripts/addClosedStatus.js
```

### Expected Output
```
🔄 Starting migration: Adding "closed" status to raffle_draws...
📊 Database dialect: postgres
🔧 Executing PostgreSQL enum update...
✅ Successfully added "closed" status to enum_raffle_draws_status

✨ Migration completed successfully!
📝 The "closed" status is now available for raffle draws.

🎉 All done! Your database is now up to date.
```

### If Migration Fails

#### Option 1: Automatic Check
The script will check if the status already exists and skip if it does.

#### Option 2: Manual SQL (PostgreSQL)
```sql
ALTER TYPE enum_raffle_draws_status ADD VALUE 'closed';
```

#### Option 3: Manual SQL (MySQL/MariaDB)
```sql
ALTER TABLE raffle_draws 
MODIFY COLUMN status 
ENUM('draft', 'active', 'completed', 'cancelled', 'closed') 
DEFAULT 'draft' 
NOT NULL;
```

#### Option 4: SQLite
No migration needed - SQLite doesn't use native enums.

---

## Step 4: Start the Application

### Start Backend
```bash
cd backend
npm start
```

### Start Frontend
```bash
cd frontend
npm start
```

---

## Step 5: Verify the Features

### Test Download Winners
1. Log in to your account
2. Navigate to a raffle with at least one winner
3. Look for the "Download Winners" button (green button)
4. Click it and verify the CSV downloads correctly

### Test Closed Status
1. Navigate to an active or completed raffle
2. Click "Mark as Closed" (purple button with lock icon)
3. Confirm the action
4. Verify that:
   - Status badge shows "Closed" in purple
   - All edit buttons are disabled
   - You can still view and download winners
   - You cannot add/edit/delete prizes or participants

---

## Rollback (If Needed)

### If you need to revert the changes:

1. **Git Rollback**
   ```bash
   git checkout <previous-commit-hash>
   ```

2. **Database Rollback** (PostgreSQL)
   ```sql
   -- Note: PostgreSQL doesn't support removing enum values easily
   -- You would need to recreate the enum type without 'closed'
   -- This is complex and not recommended
   ```

3. **Database Rollback** (MySQL/MariaDB)
   ```sql
   ALTER TABLE raffle_draws 
   MODIFY COLUMN status 
   ENUM('draft', 'active', 'completed', 'cancelled') 
   DEFAULT 'draft' 
   NOT NULL;
   ```

**Note:** Rollback is not recommended if you have already marked raffles as "closed" as this will cause data inconsistency.

---

## Troubleshooting

### Issue: "Cannot read property 'downloadWinners' of undefined"
**Cause:** Frontend code not updated
**Solution:** 
```bash
cd frontend
npm install
```

### Issue: "Invalid enum value 'closed'"
**Cause:** Database migration not run
**Solution:** Run the migration script (Step 3)

### Issue: "Download button not showing"
**Cause:** No winners have been drawn yet
**Solution:** Draw at least one winner first

### Issue: Migration script fails with permission error
**Cause:** Database user doesn't have ALTER permissions
**Solution:** 
1. Connect as a database admin user
2. Run the manual SQL command
3. Or grant ALTER permissions to your application user

### Issue: "Cannot find module '../models'"
**Cause:** Running script from wrong directory
**Solution:** Make sure you're in the `backend` directory when running the script

---

## Post-Migration Checklist

- [ ] Migration script ran successfully
- [ ] Backend starts without errors
- [ ] Frontend starts without errors
- [ ] Can create new raffle draws
- [ ] Can download winners (CSV format)
- [ ] Can mark raffle as closed
- [ ] Edit buttons disabled for closed raffles
- [ ] Closed status shows correctly (purple badge)
- [ ] Download button appears on dashboard
- [ ] Download button appears on raffle page

---

## Additional Notes

### Database Backup
Before running any migration, it's recommended to backup your database:

**PostgreSQL:**
```bash
pg_dump -U username database_name > backup_$(date +%Y%m%d).sql
```

**MySQL:**
```bash
mysqldump -u username -p database_name > backup_$(date +%Y%m%d).sql
```

### Existing Data
- All existing raffle draws remain unchanged
- Their status values (draft/active/completed/cancelled) stay the same
- The new "closed" status is only used when you manually mark a raffle as closed

### Performance Impact
- Minimal to no performance impact
- Download feature generates CSV/JSON on-demand
- No additional database queries for normal operations
- Closed status check is a simple string comparison

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check the error logs in the console
2. Verify your database connection settings
3. Ensure all dependencies are installed
4. Review the documentation:
   - `DOWNLOAD_AND_CLOSED_STATUS_FEATURES.md` - Feature documentation
   - `REDRAW_FEATURE.md` - Redraw feature documentation
5. Check existing GitHub issues or create a new one

---

## Version Information

- **Feature Version:** 2.0.0
- **Required Database Changes:** Yes (enum update)
- **Breaking Changes:** No
- **Backward Compatible:** Yes

---

## Success Indicators

You'll know the migration was successful when:

1. ✅ Backend starts without database errors
2. ✅ You can see the "Mark as Closed" button on raffle pages
3. ✅ The "Download Winners" button appears when winners exist
4. ✅ You can successfully download a CSV file
5. ✅ After marking a raffle as closed, all edit functions are disabled
6. ✅ The status badge shows "Closed" in purple color

Congratulations! Your raffle draw system is now updated with the latest features! 🎉

