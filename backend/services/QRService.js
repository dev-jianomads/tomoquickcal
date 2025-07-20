import QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

export class QRService {
  constructor() {
    this.linkingSessions = new Map();
  }

  async createLinkingSession() {
    const sessionId = uuidv4();
    
    this.linkingSessions.set(sessionId, {
      id: sessionId,
      created: Date.now(),
      status: 'pending',
      expiresAt: Date.now() + (5 * 60 * 1000) // 5 minutes
    });
    
    return sessionId;
  }

  async generateQRCode(data) {
    try {
      // Generate QR code as data URL
      const qrCodeDataUrl = await QRCode.toDataURL(data, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      
      return qrCodeDataUrl;
    } catch (error) {
      console.error('Failed to generate QR code:', error);
      throw new Error('Failed to generate QR code');
    }
  }

  getSession(sessionId) {
    return this.linkingSessions.get(sessionId);
  }

  updateSessionStatus(sessionId, status, data = {}) {
    const session = this.linkingSessions.get(sessionId);
    if (session) {
      session.status = status;
      session.lastUpdated = Date.now();
      Object.assign(session, data);
    }
  }

  cleanupExpiredSessions() {
    const now = Date.now();
    
    for (const [sessionId, session] of this.linkingSessions.entries()) {
      if (now > session.expiresAt) {
        this.linkingSessions.delete(sessionId);
      }
    }
  }
}