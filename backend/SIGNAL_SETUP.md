# Signal CLI Setup Guide

## Prerequisites

1. **Install Signal CLI** on your system:

### macOS
```bash
brew install signal-cli
```

### Ubuntu/Debian
```bash
sudo apt update
sudo apt install signal-cli
```

### Manual Installation
Download from: https://github.com/AsamK/signal-cli/releases

## Setup Steps

### 1. Get a Phone Number
You need a dedicated phone number for your bot. Options:
- Use a spare phone/SIM card
- Get a Google Voice number
- Use a VoIP service like Twilio

### 2. Register the Bot Number

Navigate to your backend directory and run the setup script:

```bash
cd backend
npm run setup-signal
```

This will guide you through:
1. Registering your phone number with Signal
2. Verifying with SMS code
3. Creating your `.env` file with proper configuration

### 3. Manual Setup (Alternative)

If the setup script doesn't work:

```bash
# Replace +1234567890 with your actual bot number
signal-cli -u +1234567890 register

# You'll receive an SMS with a verification code
signal-cli -u +1234567890 verify 123456
```

### 4. Configure Environment Variables

Update your `backend/.env` file:

```env
# Signal Configuration
SIGNAL_CLI_PATH=signal-cli
SIGNAL_BOT_NUMBER=+1234567890
SIGNAL_DATA_PATH=./signal-data

# OpenAI Configuration (Required)
OPENAI_API_KEY=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

# Google OAuth Configuration
GOOGLE_CLIENT_ID=1006131597048-l0eu5s02oudm1ivqg0buch4ois39oira.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=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

# Server Configuration
PORT=3001
NODE_ENV=development
DATABASE_PATH=./data/app.db
FRONTEND_URL=http://localhost:5173
```

### 5. Test the Setup

```bash
# Start the backend server
npm run dev

# Test sending a message (replace with actual number)
curl -X POST http://localhost:3001/api/send-message \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber": "+1234567890", "message": "Hello from Tomo QuickCal!"}'
```

## Troubleshooting

### Signal CLI Not Found
```bash
# Check if Signal CLI is installed
signal-cli --version

# If not found, install it or use full path
export SIGNAL_CLI_PATH=/usr/local/bin/signal-cli
```

### Registration Issues
- Make sure the phone number format includes country code (+1234567890)
- Check that you can receive SMS on that number
- Try registering manually if the script fails

### Permission Issues
```bash
# Make sure Signal CLI has proper permissions
chmod +x $(which signal-cli)

# Create data directory if needed
mkdir -p ./signal-data
chmod 755 ./signal-data
```

### Testing Message Reception
```bash
# Test receiving messages
signal-cli -u +1234567890 receive --json
```

## Next Steps

Once Signal CLI is working:

1. **Start the backend server**: `npm run dev`
2. **Test the bot**: Send a message to your bot number from another Signal account
3. **Check logs**: Monitor the backend console for incoming messages
4. **Test calendar integration**: Send "Schedule meeting tomorrow at 2pm"

## Security Notes

- Keep your Signal CLI data directory secure
- Use environment variables for sensitive configuration
- Consider using a dedicated phone number for the bot
- Implement rate limiting for production use

## Production Deployment

For production:
1. Set up Signal CLI on your production server
2. Register your production phone number
3. Set environment variables securely
4. Use a process manager like PM2
5. Set up proper logging and monitoring