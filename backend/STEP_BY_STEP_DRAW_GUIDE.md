# Step-by-Step Raffle Draw Guide

This guide explains how to use the new step-by-step raffle draw functionality, which allows you to draw winners one by one for each prize in an event.

## Overview

The step-by-step draw feature provides more control over the raffle process, allowing you to:
- Draw winners for individual prizes
- Track the current draw status
- Reset the draw if needed
- Ensure no participant wins multiple prizes

## API Endpoints

### 1. Get Draw Status
**GET** `/api/raffle-draws/{id}/draw-status`

Returns the current status of the raffle draw, including:
- Current draw status (not_started, in_progress, completed)
- Next prize to draw
- List of already drawn prizes with winners
- Remaining prizes to draw

**Example Response:**
```json
{
  "success": true,
  "data": {
    "drawStatus": "in_progress",
    "nextPrize": {
      "id": 2,
      "name": "Second Prize",
      "position": 2,
      "winnerId": null
    },
    "drawnPrizes": [
      {
        "prize": { "id": 1, "name": "First Prize", "position": 1 },
        "winner": { "id": 5, "name": "John Doe", "email": "john@example.com" }
      }
    ],
    "remainingPrizes": [
      { "id": 2, "name": "Second Prize", "position": 2 },
      { "id": 3, "name": "Third Prize", "position": 3 }
    ],
    "totalPrizes": 3,
    "drawnCount": 1,
    "remainingCount": 2
  }
}
```

### 2. Draw Winner for Specific Prize
**POST** `/api/raffle-draws/{id}/draw-prize/{prizeId}`

Draws a winner for a specific prize. The system will:
- Randomly select from eligible participants (those who haven't won yet)
- Assign the winner to the prize
- Mark the participant as a winner
- Automatically complete the raffle if this was the last prize

**Example Response:**
```json
{
  "success": true,
  "message": "Winner drawn for Second Prize",
  "data": {
    "prize": {
      "id": 2,
      "name": "Second Prize",
      "position": 2,
      "winnerId": 8
    },
    "winner": {
      "id": 8,
      "name": "Jane Smith",
      "email": "jane@example.com",
      "ticketNumber": "TKT-1234567890-abc123"
    },
    "isLastPrize": false
  }
}
```

### 3. Reset Draw
**POST** `/api/raffle-draws/{id}/reset-draw`

Clears all winners and resets the draw to allow starting over. This is useful if you need to restart the draw process.

**Example Response:**
```json
{
  "success": true,
  "message": "Raffle draw reset successfully. All winners have been cleared."
}
```

### 4. Enhanced Draw Endpoint
**POST** `/api/raffle-draws/{id}/draw?mode=step`

The existing draw endpoint now supports a `mode` parameter:
- `mode=all` (default): Draws all winners at once (original behavior)
- `mode=step`: Activates step-by-step mode and returns the first prize to draw

**Example Response (step mode):**
```json
{
  "success": true,
  "message": "Step-by-step mode activated. Use /draw-prize/{prizeId} endpoint to draw winners one by one.",
  "data": {
    "nextPrize": {
      "id": 1,
      "name": "First Prize",
      "position": 1
    },
    "totalPrizes": 3,
    "remainingPrizes": 3,
    "instructions": "Call POST /api/raffle-draws/1/draw-prize/1 to draw the first winner"
  }
}
```

## Usage Workflow

### Starting a Step-by-Step Draw

1. **Check Draw Status**
   ```bash
   GET /api/raffle-draws/{id}/draw-status
   ```

2. **Activate Step-by-Step Mode** (optional)
   ```bash
   POST /api/raffle-draws/{id}/draw?mode=step
   ```

3. **Draw Winners One by One**
   ```bash
   POST /api/raffle-draws/{id}/draw-prize/{prizeId}
   ```

4. **Repeat Step 3** for each remaining prize

5. **Check Status** between draws to see progress

### Example Complete Workflow

```bash
# 1. Check initial status
curl -H "Authorization: Bearer YOUR_TOKEN" \
     GET /api/raffle-draws/1/draw-status

# 2. Draw first prize winner
curl -H "Authorization: Bearer YOUR_TOKEN" \
     POST /api/raffle-draws/1/draw-prize/1

# 3. Check status after first draw
curl -H "Authorization: Bearer YOUR_TOKEN" \
     GET /api/raffle-draws/1/draw-status

# 4. Draw second prize winner
curl -H "Authorization: Bearer YOUR_TOKEN" \
     POST /api/raffle-draws/1/draw-prize/2

# 5. Continue until all prizes are drawn...
```

## Key Features

### Duplicate Winner Prevention
- Participants who have already won a prize are automatically excluded from subsequent draws
- The system ensures each participant can only win one prize per raffle

### Automatic Completion
- When the last prize is drawn, the raffle draw status automatically changes to "completed"
- No manual intervention required to mark the draw as finished

### Prize Order
- Prizes are drawn in order of their `position` field (ascending)
- The `nextPrize` in the status response shows the next prize to be drawn

### Error Handling
- Clear error messages for common scenarios:
  - Prize already has a winner
  - No eligible participants remaining
  - Raffle draw not in active status
  - Invalid raffle draw or prize IDs

## Authentication

All endpoints require authentication using the Bearer token in the Authorization header:
```
Authorization: Bearer YOUR_JWT_TOKEN
```

## Error Responses

Common error scenarios and responses:

- **Prize already has winner**: `400 Bad Request`
- **No eligible participants**: `400 Bad Request`
- **Raffle draw not found**: `404 Not Found`
- **Unauthorized access**: `401 Unauthorized`
- **Raffle not active**: `400 Bad Request`

This step-by-step functionality provides complete control over the raffle draw process while maintaining fairness and preventing duplicate winners.
