// Mock API service for UI testing without backend
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export interface QRResponse {
  success: boolean;
  sessionId: string;
  qrCode: string;
  expiresAt: number;
  error?: string;
}

export interface LinkingStatusResponse {
  success: boolean;
  linked: boolean;
  deviceInfo?: any;
  message?: string;
  error?: string;
}

export interface HealthResponse {
  success: boolean;
  message: string;
  timestamp: string;
  signalStatus: string;
}

class ApiService {
  private mockSessionId: string = '';
  private mockStartTimes: Map<string, number> = new Map();

  private async mockDelay(ms: number = 500): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private generateMockQR(): string {
    // Generate a simple mock QR code as SVG data URL
    const qrSvg = `
      <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="200" fill="white"/>
        <rect x="20" y="20" width="160" height="160" fill="none" stroke="black" stroke-width="2"/>
        <rect x="30" y="30" width="30" height="30" fill="black"/>
        <rect x="140" y="30" width="30" height="30" fill="black"/>
        <rect x="30" y="140" width="30" height="30" fill="black"/>
        <rect x="70" y="70" width="60" height="60" fill="black"/>
        <rect x="85" y="85" width="30" height="30" fill="white"/>
        <text x="100" y="190" text-anchor="middle" font-family="Arial" font-size="8" fill="black">Mock QR Code</text>
      </svg>
    `;
    return `data:image/svg+xml;base64,${btoa(qrSvg)}`;
  }

  async generateQR(): Promise<QRResponse> {
    console.log('🎭 Mock: Generating QR code...');
    await this.mockDelay(800);
    
    this.mockSessionId = `mock_session_${Date.now()}`;
    
    return {
      success: true,
      sessionId: this.mockSessionId,
      qrCode: this.generateMockQR(),
      expiresAt: Date.now() + (5 * 60 * 1000)
    };
  }

  async checkLinkingStatus(sessionId: string): Promise<LinkingStatusResponse> {
    console.log('🎭 Mock: Checking linking status...');
    await this.mockDelay(300);
    
    // Start timing from first status check for this session
    if (!this.mockStartTimes.has(sessionId)) {
      this.mockStartTimes.set(sessionId, Date.now());
      console.log('🎭 Mock: Started timing for session', sessionId);
    }
    
    // Simulate linking after 4 seconds from when waiting screen starts polling
    const startTime = this.mockStartTimes.get(sessionId) || Date.now();
    const elapsed = Date.now() - startTime;
    const shouldLink = elapsed > 4000; // 4 seconds after first poll
    
    console.log(`🎭 Mock: Session ${sessionId}, elapsed: ${elapsed}ms, shouldLink: ${shouldLink}`);
    
    if (shouldLink) {
      // Clean up the timing for this session
      this.mockStartTimes.delete(sessionId);
      return {
        success: true,
        linked: true,
        deviceInfo: {
          name: 'Mock Signal Device',
          linkedAt: startTime + 4000,
          platform: 'Desktop'
        }
      };
    } else {
      return {
        success: true,
        linked: false,
        message: `Still waiting for device linking... (${Math.round(elapsed/1000)}s)`
      };
    }
  }

  async createCalendarEvent(eventData: {
    summary: string;
    description?: string;
    start: { dateTime: string; timeZone?: string };
    end: { dateTime: string; timeZone?: string };
    attendees?: { email: string }[];
    sender: string;
  }) {
    console.log('🎭 Mock: Creating calendar event...');
    await this.mockDelay(1000);
    
    return {
      success: true,
      event: {
        id: `mock_event_${Date.now()}`,
        summary: eventData.summary,
        description: eventData.description,
        start: eventData.start,
        end: eventData.end,
        attendees: eventData.attendees || [],
        htmlLink: `https://calendar.google.com/calendar/event?eid=mock_${Date.now()}`,
        created: new Date().toISOString(),
        status: 'confirmed'
      }
    };
  }

  async checkHealth(): Promise<HealthResponse> {
    console.log('🎭 Mock: Health check...');
    await this.mockDelay(200);
    
    return {
      success: true,
      message: 'Mock backend is healthy',
      timestamp: new Date().toISOString(),
      signalStatus: 'mock_configured'
    };
  }
}

export const apiService = new ApiService();