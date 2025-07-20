# Tomo QuickCal Backend

Backend service for Tomo QuickCal that integrates with Signal CLI to provide real Signal messaging capabilities.

## Prerequisites

1. **Signal CLI** - Install Signal CLI on your system:
   ```bash
   # macOS
   brew install signal-cli
   
   # Ubuntu/Debian
   sudo apt install signal-cli
   
   # Or download from: https://github.com/AsamK/signal-cli
   ```

2. **Phone Number** - You need a phone number to register as a Signal bot

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run the setup script:**
   ```bash
   npm run setup-signal
   ```
   This will guide you through:
   - Registering your phone number with Signal
   - Verifying the number with SMS code
   - Creating your `.env` file

3. **Start the development server:**
   ```bash
   npm run dev
   ```

## Manual Setup (Alternative)

If the setup script doesn't work, you can set up manually:

1. **Register your bot number:**
   ```bash
   signal-cli -a +1234567890 register
   ```

2. **Verify with SMS code:**
   ```bash
   signal-cli -a +1234567890 verify 123456
   ```

3. **Create `.env` file:**
   ```env
   SIGNAL_CLI_PATH=signal-cli
   SIGNAL_BOT_NUMBER=+1234567890
   SIGNAL_DATA_DIR=./signal-data
   PORT=3001
   NODE_ENV=development
   DATABASE_PATH=./data/app.db
   FRONTEND_URL=http://localhost:5173
   ```

## API Endpoints

- `GET /api/link-qr` - Generate QR code for device linking
- `GET /api/tail/:sessionId` - Poll for linking status
- `POST /api/webhook/signal` - Receive Signal messages
- `POST /api/calendar/event` - Create calendar events
- `GET /api/health` - Health check

## Signal Commands

Once linked, users can send these commands to your bot:

- `"Schedule meeting with John tomorrow at 2pm"`
- `"Create event: Team standup on Monday at 9am"`
- `"Help"` - Show available commands

## Architecture

```
Frontend (React) ←→ Backend (Express) ←→ Signal CLI ←→ Signal Network
                         ↓
                   SQLite Database
```

## Troubleshooting

### Signal CLI Issues

1. **"Command not found"**
   - Make sure Signal CLI is installed and in your PATH
   - Try using full path: `/usr/local/bin/signal-cli`

2. **"Number not registered"**
   - Run the registration process again
   - Make sure you're using the correct phone number format (+1234567890)

3. **"Permission denied"**
   - Check file permissions for Signal CLI data directory
   - Make sure the process has write access to `./signal-data`

### Backend Issues

1. **Port already in use**
   - Change PORT in `.env` file
   - Kill existing processes: `lsof -ti:3001 | xargs kill`

2. **Database errors**
   - Delete `./data/app.db` and restart
   - Check write permissions for data directory

## Development

- `npm run dev` - Start with nodemon for auto-restart
- `npm start` - Start production server
- `npm run setup-signal` - Run Signal CLI setup

## Production Deployment

1. Set up Signal CLI on your production server
2. Register your production phone number
3. Set environment variables
4. Use a process manager like PM2:
   ```bash
   pm2 start server.js --name tomo-quickcal
   ```

## Security Notes

- Keep your Signal CLI data directory secure
- Use environment variables for sensitive configuration
- Consider using a dedicated phone number for the bot
- Implement rate limiting for production use