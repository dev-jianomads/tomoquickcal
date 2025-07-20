import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { SignalService } from './services/SignalService.js';
import { QRService } from './services/QRService.js';
import { DatabaseService } from './services/DatabaseService.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Initialize services
const signalService = new SignalService();
const qrService = new QRService();
const dbService = new DatabaseService();

// Initialize database
await dbService.initialize();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    signalStatus: signalService.phoneNumber ? 'configured' : 'not configured'
  });
});

app.get('/api/link-qr', async (req, res) => {
  try {
    console.log('Generating QR code for device linking...');
    
    // Generate a unique session ID for this linking attempt
    const sessionId = await qrService.createLinkingSession();
    
    // For now, generate a simple QR code with session info
    // In a real implementation, this would be Signal device linking data
    const qrData = `tomo-quickcal://link/${sessionId}`;
    
    // Generate QR code image
    const qrCodeDataUrl = await qrService.generateQRCode(qrData);
    
    res.json({
      success: true,
      sessionId,
      qrCode: qrCodeDataUrl,
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    });
  } catch (error) {
    console.error('Failed to generate QR code:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate QR code'
    });
  }
});

app.get('/api/tail/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    // For demo purposes, simulate successful linking after 3 seconds
    const session = qrService.getSession(sessionId);
    if (!session) {
      return res.status(404).json({
        success: false,
        error: 'Session not found'
      });
    }
    
    const elapsed = Date.now() - session.created;
    const linked = elapsed > 3000; // Simulate linking after 3 seconds
    
    if (linked) {
      res.json({
        success: true,
        linked: true,
        deviceInfo: {
          name: 'Signal Device',
          linkedAt: Date.now()
        }
      });
    } else {
      res.json({
        success: true,
        linked: false,
        message: 'Still waiting for device linking...'
      });
    }
  } catch (error) {
    console.error('Failed to check linking status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check linking status'
    });
  }
});

app.post('/api/send-message', async (req, res) => {
  try {
    const { phoneNumber, message } = req.body;
    
    if (!signalService.phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Signal bot not configured. Please run setup first.'
      });
    }
    
    const result = await signalService.sendMessage(phoneNumber, message);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Tomo QuickCal backend running on port ${PORT}`);
  console.log(`📱 Signal bot: ${signalService.phoneNumber || 'Not configured'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
});

export default app;