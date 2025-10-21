# Redraw Feature

## Overview
The Redraw feature allows you to clear the winner for a specific prize and redraw it without affecting other prizes that have already been drawn. This is useful when you need to redo a single draw due to errors or other reasons.

## Features

### 1. Individual Prize Redraw
- Clear the winner for a specific prize without resetting the entire draw
- The previous winner becomes eligible for future draws again
- The prize becomes available for a new draw

### 2. Two Ways to Access Redraw

#### In the "Draw" Tab
- View all prizes with their current winners
- Each prize card with a winner shows a "Redraw" button (orange colored)
- Click the button to clear the winner and redraw

#### In the "Prizes" Tab
- Manage all prizes in a detailed list view
- Prizes with winners show a "Redraw" button in the actions column
- Same functionality as the Draw tab

## How It Works

### User Flow
1. Navigate to a raffle draw that has already had some winners drawn
2. Go to either the "Draw" or "Prizes" tab
3. Find the prize you want to redraw
4. Click the "Redraw" button (only visible when raffle is active)
5. Confirm the action in the dialog
6. The winner is cleared and you can draw again for that prize

### Technical Details

#### Backend API
**Endpoint:** `POST /api/raffle-draws/:id/prizes/:prizeId/redraw`

**What it does:**
- Verifies the raffle draw exists and belongs to the user
- Checks that the raffle is still active (not completed)
- Confirms the prize has a winner
- Clears the `winnerId` from the prize
- Updates the participant's `isWinner` status to `false`
- Returns success message with previous winner info

**Validation:**
- Cannot redraw if the raffle draw is completed (must reset entire draw first)
- Cannot redraw if the prize doesn't have a winner yet
- Can only redraw prizes in active raffle draws

#### Frontend Updates
- Added `redrawPrize` API call to `api.js`
- Added `handleRedrawPrize` function in `RaffleDraw.js`
- Added Redraw buttons in both Draw and Prizes tabs
- Shows confirmation dialog before clearing winner
- Refreshes data after successful redraw

## Differences from Reset Draw

| Feature | Redraw (Single Prize) | Reset Draw (All Prizes) |
|---------|----------------------|-------------------------|
| Scope | One specific prize | All prizes |
| Other winners | Remain unchanged | All cleared |
| Use case | Fix a single mistake | Start over completely |
| Button color | Orange | Red/Gray |
| Location | Per prize | Global header |

## Business Rules

1. **Active Raffle Only**: Redraw is only available for active raffle draws
2. **Winner Required**: Can only redraw prizes that already have a winner
3. **Completed Raffle**: Cannot redraw individual prizes in a completed raffle (must reset entire draw first)
4. **Participant Eligibility**: When a winner is cleared, that participant becomes eligible for future draws again

## User Interface

### Visual Indicators
- **Redraw Button**: Orange color (`bg-orange-600`)
- **Icon**: Circular arrow (RotateCcw)
- **Tooltip**: "Clear winner and redraw"
- **Confirmation**: Dialog asking for confirmation before action

### Button States
- **Visible**: Only when prize has a winner AND raffle is active
- **Hidden**: When prize has no winner OR raffle is not active

## Example Usage Scenarios

### Scenario 1: Wrong Winner Selected
1. You drew a winner for "1st Prize"
2. Realize the winner is not eligible due to special rules
3. Click "Redraw" on the 1st Prize
4. The winner is cleared and you can draw again
5. Other prizes (2nd, 3rd) remain unchanged

### Scenario 2: Technical Error During Draw
1. During the draw animation, connection was lost
2. Wrong winner was recorded
3. Use "Redraw" to clear and try again
4. No need to reset all prizes

### Scenario 3: Participant Request
1. Winner requests to be removed from the draw
2. Use "Redraw" to clear their win
3. They become eligible for other draws
4. Redraw the prize for a new winner

## API Response Examples

### Success Response
```json
{
  "success": true,
  "message": "Winner cleared for 1st Prize. Ready to redraw.",
  "data": {
    "prize": {
      "id": 1,
      "name": "1st Prize",
      "winnerId": null,
      // ... other prize fields
    },
    "previousWinner": {
      "id": 15,
      "name": "John Doe",
      "ticketNumber": "TKT-12345"
    }
  }
}
```

### Error Response (No Winner)
```json
{
  "success": false,
  "message": "This prize does not have a winner yet. Nothing to redraw."
}
```

### Error Response (Completed Raffle)
```json
{
  "success": false,
  "message": "Cannot redraw prizes in a completed raffle draw. Please reset the entire draw first."
}
```

## Implementation Files

### Backend
- `/backend/routes/raffleDraws.js` - Added redraw endpoint and prize update/delete routes

### Frontend
- `/frontend/src/services/api.js` - Added `redrawPrize` API call
- `/frontend/src/pages/RaffleDraw.js` - Added redraw handler and UI buttons

## Future Enhancements

Potential improvements for future versions:
1. **Redraw History**: Track all redraws and show history
2. **Reason Input**: Add optional reason field for why a redraw was needed
3. **Audit Log**: Record who performed the redraw and when
4. **Bulk Redraw**: Select multiple prizes to redraw at once
5. **Automatic Redraw**: Set conditions for automatic redraws (e.g., duplicate winners)

