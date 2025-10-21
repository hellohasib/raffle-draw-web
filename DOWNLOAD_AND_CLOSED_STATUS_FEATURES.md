# Download Winners & Closed Status Features

## Overview
Two new powerful features have been added to the raffle draw system:
1. **Download Winners List** - Export winners to CSV or JSON format
2. **Closed Status** - Lock raffles to prevent any modifications

---

## 1. Download Winners List Feature

### Description
Users can download a complete list of all winners with their prize information in CSV or JSON format. This makes it easy to share results, create reports, or keep records.

### Where to Access
The download feature is available in **two locations**:

#### 1. Raffle Draw Page Header
- Location: Top right corner of raffle detail page
- Button: "Download Winners" with download icon
- Appears when: At least one prize has been drawn
- Downloads: CSV format by default

#### 2. API (Programmatic)
- Endpoint: `GET /api/raffle-draws/:id/winners/download?format=csv|json`
- Supports both CSV and JSON formats

### CSV Format
The downloaded CSV file includes:
- **Position** - Prize position/ranking
- **Prize Name** - Name of the prize
- **Prize Description** - Prize details
- **Prize Value** - Value of the prize
- **Winner Name** - Full name of the winner
- **Winner Email** - Email address
- **Winner Phone** - Phone number
- **Winner Designation** - Job title or designation
- **Ticket Number** - Unique ticket number

### JSON Format
The JSON format includes:
```json
{
  "success": true,
  "data": {
    "raffleDraw": {
      "id": 1,
      "title": "Summer Giveaway",
      "drawDate": "2024-07-15T18:00:00Z",
      "status": "completed"
    },
    "winners": [
      {
        "position": 1,
        "prizeName": "1st Prize",
        "prizeDescription": "Grand Prize",
        "prizeValue": "500",
        "winnerName": "John Doe",
        "winnerEmail": "john@example.com",
        "winnerPhone": "+1234567890",
        "winnerDesignation": "Manager",
        "ticketNumber": "TKT-1234567890"
      }
    ]
  }
}
```

### File Naming Convention
Files are automatically named using the pattern:
- Format: `{RaffleTitle}_winners_{Timestamp}.csv`
- Example: `Summer_Giveaway_winners_1710543210123.csv`

### Business Rules
- Can only download when at least one winner has been drawn
- Available for active, completed, and closed raffles
- No winners = Error message "No winners found for this raffle draw"

---

## 2. Closed Status Feature

### Description
The "Closed" status is a final state that locks a raffle draw, preventing any further modifications. Once closed, the raffle becomes read-only.

### Status Colors
- **Draft** - Gray (planning stage)
- **Active** - Blue (currently running)
- **Completed** - Green (all prizes drawn)
- **Cancelled** - Red (cancelled)
- **Closed** - Purple 🆕 (locked, no edits allowed)

### How to Close a Raffle

#### From Raffle Draw Page
1. Navigate to the raffle draw details page
2. Find the "Mark as Closed" button in the header (purple button with lock icon)
3. Click the button
4. Confirm the action in the dialog
5. The raffle status changes to "Closed"

**Button Availability:**
- Visible when status is "Active" or "Completed"
- Hidden when status is already "Closed"

### What Gets Locked
Once a raffle is marked as "Closed", the following operations are **prevented**:

#### ❌ No Edits Allowed
- Cannot update raffle draw details (title, description, date)
- Cannot edit prize information
- Cannot edit participant information

#### ❌ No Deletions Allowed
- Cannot delete the raffle draw
- Cannot delete prizes
- Cannot delete participants

#### ❌ No Draw Operations Allowed
- Cannot draw new winners
- Cannot reset the draw
- Cannot redraw prizes

#### ❌ No Additions Allowed
- Cannot add new prizes
- Cannot add new participants

### What Still Works
Even when closed, you can still:
- ✅ View all information
- ✅ Download winners list
- ✅ Navigate through tabs
- ✅ View draw status

### Use Cases

#### Scenario 1: Final Results Published
1. Complete all prize draws
2. Verify all winners are correct
3. Mark as "Closed" to prevent accidental changes
4. Share the winners list with confidence

#### Scenario 2: Archiving
1. After event is over and winners have received prizes
2. Mark as "Closed" for permanent record
3. Keep for future reference without risk of modification

#### Scenario 3: Audit Trail
1. For compliance or legal requirements
2. Close the raffle to maintain integrity
3. Demonstrate results haven't been tampered with

### Visual Indicators
- **Status Badge**: Purple background with lock icon
- **Disabled Buttons**: Gray/disabled state for all edit buttons
- **Tooltips**: Explain why actions are disabled

---

## API Documentation

### Download Winners

**Endpoint:** `GET /api/raffle-draws/:id/winners/download`

**Query Parameters:**
- `format` (optional): `csv` or `json` (default: `csv`)

**Response (CSV):**
- Content-Type: `text/csv`
- Content-Disposition: `attachment; filename="..."`
- Body: CSV formatted data

**Response (JSON):**
```json
{
  "success": true,
  "data": {
    "raffleDraw": { /* raffle info */ },
    "winners": [ /* array of winners */ ]
  }
}
```

**Error Responses:**
- 404: Raffle draw not found
- 400: No winners found

---

### Mark as Closed

**Endpoint:** `POST /api/raffle-draws/:id/mark-closed`

**Request Body:** None required

**Response:**
```json
{
  "success": true,
  "message": "Raffle draw has been marked as closed. No further edits are allowed.",
  "data": {
    "raffleDraw": { /* updated raffle with status: 'closed' */ }
  }
}
```

**Error Responses:**
- 404: Raffle draw not found
- 400: Raffle draw is already closed

---

## Database Changes

### RaffleDraw Model
Updated the `status` enum to include the new "closed" value:

**Before:**
```javascript
status: {
  type: DataTypes.ENUM('draft', 'active', 'completed', 'cancelled'),
  defaultValue: 'draft',
  allowNull: false
}
```

**After:**
```javascript
status: {
  type: DataTypes.ENUM('draft', 'active', 'completed', 'cancelled', 'closed'),
  defaultValue: 'draft',
  allowNull: false
}
```

### Migration Required
If you have an existing database, you'll need to run a migration to add the 'closed' status to the enum. Contact your database administrator or run:

```sql
ALTER TYPE enum_raffle_draws_status ADD VALUE 'closed';
```

---

## Frontend Implementation

### Components Updated
1. **RaffleDraw.js** - Main raffle details page
   - Added download button
   - Added mark as closed button
   - Updated status colors and icons
   - Disabled edit buttons for closed raffles

2. **UserDashboard.js** - Dashboard overview
   - Added quick download button on raffle cards
   - Updated status colors and icons

3. **api.js** - API service
   - Added `downloadWinners()` method
   - Added `markAsClosed()` method

### Icons Used
- Download: `Download` from lucide-react
- Closed/Lock: `Lock` from lucide-react

### Color Scheme
- Closed Status: Purple (`bg-purple-100`, `text-purple-800`)
- Download Button: Green (`bg-green-600`)
- Mark as Closed Button: Purple (`bg-purple-600`)

---

## User Workflow Example

### Complete Workflow: From Draft to Closed

1. **Create Raffle** (Status: Draft)
   - Add prizes
   - Add participants
   - Set draw date

2. **Activate Raffle** (Status: Active)
   - Change status to active
   - Ready to conduct draws

3. **Conduct Draws** (Status: Active)
   - Draw winners for each prize
   - Verify results
   - Download winners list for review

4. **Complete Draw** (Status: Completed)
   - All prizes have winners
   - Status automatically changes to completed

5. **Final Review**
   - Verify all winners are correct
   - Download final winners list
   - Share with stakeholders

6. **Lock Results** (Status: Closed)
   - Click "Mark as Closed"
   - Confirm the action
   - Raffle is now permanently locked

7. **Archive**
   - Keep for records
   - Can still view and download
   - Protected from accidental changes

---

## Security & Permissions

### Authorization
- All endpoints require authentication (JWT token)
- Users can only download winners from their own raffles
- Users can only close their own raffles

### Validation
Backend validates:
- Raffle ownership
- Current status before allowing close operation
- Prevents operations on closed raffles
- Ensures at least one winner exists before download

---

## Error Handling

### Common Errors

#### "No winners found for this raffle draw"
**Cause:** Attempting to download when no prizes have been drawn
**Solution:** Draw at least one winner first

#### "Raffle draw is already closed"
**Cause:** Attempting to mark an already closed raffle as closed
**Solution:** No action needed, raffle is already protected

#### "Cannot {operation} a closed raffle draw"
**Cause:** Attempting to edit/delete/draw in a closed raffle
**Solution:** The raffle is locked for data integrity

#### "Cannot delete a closed raffle draw"
**Cause:** Attempting to delete a closed raffle
**Solution:** Closed raffles cannot be deleted to maintain records

---

## Best Practices

### When to Download Winners
- ✅ After completing all draws
- ✅ Before marking as closed
- ✅ For backup purposes
- ✅ To share with stakeholders
- ✅ For record keeping

### When to Mark as Closed
- ✅ After verifying all results are correct
- ✅ When winners have been notified
- ✅ Before archiving
- ✅ When you need to prevent any changes
- ✅ For audit trail requirements

### When NOT to Mark as Closed
- ❌ Before all draws are complete
- ❌ If you might need to make changes
- ❌ Before downloading and backing up winners
- ❌ While winners are still being verified

---

## Testing Checklist

### Download Winners
- [ ] Can download from dashboard
- [ ] Can download from raffle page
- [ ] CSV format downloads correctly
- [ ] JSON format downloads correctly
- [ ] File name is correct
- [ ] All winner data is included
- [ ] Error shown when no winners
- [ ] Button only shows when winners exist

### Closed Status
- [ ] Can mark active raffle as closed
- [ ] Can mark completed raffle as closed
- [ ] Cannot mark draft raffle as closed
- [ ] Cannot mark already closed raffle again
- [ ] Status badge shows correctly (purple)
- [ ] All edit buttons are disabled
- [ ] Cannot add prizes/participants
- [ ] Cannot delete anything
- [ ] Cannot draw/redraw winners
- [ ] Can still view all information
- [ ] Can still download winners

---

## Future Enhancements

Potential improvements for future versions:

### Download Features
1. **Multiple Formats**: PDF, Excel support
2. **Custom Templates**: Customizable winner certificates
3. **Email Integration**: Email winners directly
4. **Batch Download**: Download multiple raffles at once

### Closed Status Features
1. **Reopen Option**: Admin ability to reopen closed raffles
2. **Closure Reason**: Add optional reason for closing
3. **Closure History**: Track who closed and when
4. **Automatic Closing**: Auto-close after X days

### Both Features
1. **Audit Log**: Complete history of downloads and status changes
2. **Notifications**: Alert when raffle is closed
3. **Permissions**: Granular control over who can close/download
4. **Digital Signatures**: Cryptographic proof of closure

