import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// In-memory storage for demo
const linkingSessions = new Map();
const events = [];

// Simulate processing delays
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    signalStatus: 'configured (dummy)',
    mode: 'dummy'
  });
});

app.get('/api/link-qr', async (req, res) => {
  try {
    console.log('🔗 Generating dummy QR code for device linking...');
    
    // Generate a unique session ID
    const sessionId = uuidv4();
    
    // Create dummy QR data
    const qrData = `tomo-quickcal://link/${sessionId}`;
    
    // Generate actual QR code image
    const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    // Store session
    linkingSessions.set(sessionId, {
      id: sessionId,
      created: Date.now(),
      status: 'pending',
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    });
    
    console.log(`✅ QR code generated for session: ${sessionId}`);
    
    res.json({
      success: true,
      sessionId,
      qrCode: qrCodeDataUrl,
      expiresAt: Date.now() + (5 * 60 * 1000)
    });
  } catch (error) {
    console.error('❌ Failed to generate QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

app.get('/api/tail/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    console.log(`🔍 Checking linking status for session: ${sessionId}`);
    
    const session = linkingSessions.get(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    // Simulate linking after 4-6 seconds
    const elapsed = Date.now() - session.created;
    const shouldLink = elapsed > 4000; // Link after 4 seconds
    
    if (shouldLink && session.status === 'pending') {
      session.status = 'linked';
      session.linkedAt = Date.now();
      console.log(`✅ Session ${sessionId} marked as linked`);
      
      res.json({
        success: true,
        linked: true,
        deviceInfo: {
          name: 'Signal Device (Demo)',
          linkedAt: session.linkedAt,
          platform: 'Desktop'
        }
      });
    } else {
      console.log(`⏳ Session ${sessionId} still pending...`);
      res.json({
        success: true,
        linked: false,
        message: 'Still waiting for device linking...',
        elapsed: elapsed
      });
    }
  } catch (error) {
    console.error('❌ Failed to check linking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check linking status'
    });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    console.log(`📱 Dummy: Sending message to ${phoneNumber}: "${message}"`);
    
    // Simulate processing delay
    await delay(500);
    
    res.json({ 
      success: true, 
      result: {
        messageId: uuidv4(),
        timestamp: Date.now(),
        recipient: phoneNumber,
        message: message
      }
    });
  } catch (error) {
    console.error('❌ Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Google OAuth simulation endpoints
app.get('/api/oauth/google/url', (req, res) => {
  console.log('🔐 Generating dummy Google OAuth URL...');
  
  // In a real implementation, this would generate the actual Google OAuth URL
  const dummyAuthUrl = `http://localhost:${PORT}/api/oauth/google/callback?code=dummy_auth_code&state=dummy_state`;
  
  res.json({
    success: true,
    authUrl: dummyAuthUrl
  });
});

app.get('/api/oauth/google/callback', async (req, res) => {
  console.log('🔐 Processing dummy Google OAuth callback...');
  
  // Simulate OAuth processing
  await delay(1000);
  
  // Redirect to frontend success page
  res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/oauth-success`);
});

app.post('/api/calendar/event', async (req, res) => {
  try {
    const eventData = req.body;
    console.log('📅 Creating dummy calendar event:', eventData.summary);
    
    // Simulate processing delay
    await delay(800);
    
    const dummyEvent = {
      id: uuidv4(),
      summary: eventData.summary,
      description: eventData.description,
      start: eventData.start,
      end: eventData.end,
      attendees: eventData.attendees || [],
      htmlLink: `https://calendar.google.com/calendar/event?eid=dummy_${Date.now()}`,
      created: new Date().toISOString(),
      status: 'confirmed'
    };
    
    events.push(dummyEvent);
    
    console.log(`✅ Dummy event created: ${dummyEvent.id}`);
    
    res.json({
      success: true,
      event: dummyEvent
    });
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

app.get('/api/calendar/events', (req, res) => {
  console.log('📅 Fetching dummy calendar events...');
  
  res.json({
    success: true,
    events: events.slice(-10) // Return last 10 events
  });
});

// Cleanup expired sessions periodically
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of linkingSessions.entries()) {
    if (now > session.expiresAt) {
      linkingSessions.delete(sessionId);
      console.log(`🧹 Cleaned up expired session: ${sessionId}`);
    }
  }
}, 60000); // Clean up every minute

// Start server
app.listen(PORT, () => {
  console.log('🚀 Tomo QuickCal DUMMY backend running on port', PORT);
  console.log('📱 Signal bot: +85291356545 (dummy mode)');
  console.log('🔗 Health check: http://localhost:' + PORT + '/api/health');
  console.log('');
  console.log('🎭 DUMMY MODE ACTIVE - All responses are simulated');
  console.log('   - QR codes will "link" after 4 seconds');
  console.log('   - Calendar events are stored in memory only');
  console.log('   - No real Signal or Google integration');
});

export default app;