import { supabase } from './supabase';

export interface LogEntry {
  user_id?: string;
  user_email?: string;
  event_type: string;
  event_data?: Record<string, any>;
  success?: boolean;
  error_message?: string;
  session_id?: string;
  ip_address?: string;
  user_agent?: string;
}

export type EventType = 
  | 'google_oauth_start'
  | 'google_oauth_success' 
  | 'google_oauth_error'
  | 'user_created'
  | 'user_updated'
  | 'phone_number_entered'
  | 'phone_number_saved'
  | 'telegram_sms_sent'
  | 'account_deleted'
  | 'setup_completed';

export class LoggingService {
  private sessionId: string;

  constructor() {
    // Generate or retrieve session ID for this browser session
    this.sessionId = this.getOrCreateSessionId();
  }

  private getOrCreateSessionId(): string {
    let sessionId = sessionStorage.getItem('tomo_session_id');
    if (!sessionId) {
      sessionId = this.generateSessionId();
      sessionStorage.setItem('tomo_session_id', sessionId);
    }
    return sessionId;
  }

  private generateSessionId(): string {
    return 'sess_' + Date.now() + '_' + Math.random().toString(36).substring(2, 15);
  }

  private getClientInfo() {
    return {
      user_agent: navigator.userAgent,
      // Note: IP address will be null from client-side, would need server-side logging for that
      ip_address: null
    };
  }

  async log(
    eventType: EventType,
    data: {
      userId?: string;
      userEmail?: string;
      eventData?: Record<string, any>;
      success?: boolean;
      errorMessage?: string;
    } = {}
  ): Promise<void> {
    try {
      const clientInfo = this.getClientInfo();
      
      const logEntry: LogEntry = {
        user_id: data.userId || null,
        user_email: data.userEmail || null,
        event_type: eventType,
        event_data: data.eventData || null,
        success: data.success !== undefined ? data.success : true,
        error_message: data.errorMessage || null,
        session_id: this.sessionId,
        user_agent: clientInfo.user_agent,
        ip_address: clientInfo.ip_address
      };

      console.log(`📝 Logging event: ${eventType}`, logEntry);

      const { error } = await supabase
        .from('user_logs')
        .insert([logEntry]);

      if (error) {
        console.error('❌ Failed to log event:', error);
        // Don't throw error to avoid breaking user flow
      } else {
        console.log(`✅ Event logged: ${eventType}`);
      }
    } catch (error) {
      console.error('❌ Logging service error:', error);
      // Don't throw error to avoid breaking user flow
    }
  }

  // Convenience methods for common events
  async logGoogleOAuthStart(userEmail?: string): Promise<void> {
    await this.log('google_oauth_start', {
      userEmail,
      eventData: { timestamp: new Date().toISOString() }
    });
  }

  async logGoogleOAuthSuccess(userEmail: string, userData: any): Promise<void> {
  }
  async logGoogleOAuthSuccess(userId: string, userEmail: string, userData: any): Promise<void> {
    await this.log('google_oauth_success', {
      userId,
      userEmail,
      eventData: {
        email: userData.email,
        name: userData.name,
        has_refresh_token: userData.refreshToken
      }
    });
  }

  async logGoogleOAuthError(userEmail: string | undefined, error: string): Promise<void> {
    await this.log('google_oauth_error', {
      userEmail,
      success: false,
      errorMessage: error,
      eventData: { timestamp: new Date().toISOString() }
    });
  }

  async logUserCreated(userId: string, userEmail: string, userData: any): Promise<void> {
    await this.log('user_created', {
      userId,
      userEmail,
      eventData: {
        user_id: userId,
        email: userEmail,
        display_name: userData.display_name
      }
    });
  }

  async logUserUpdated(userId: string, userEmail: string, updates: any): Promise<void> {
    await this.log('user_updated', {
      userId,
      userEmail,
      eventData: {
        updated_fields: Object.keys(updates),
        ...updates
      }
    });
  }

  async logPhoneNumberEntered(userEmail: string, phoneNumber: string): Promise<void> {
    await this.log('phone_number_entered', {
      userEmail,
      eventData: {
        phone_number_masked: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
        country_code: phoneNumber.match(/^\+\d{1,4}/)?.[0] || 'unknown'
      }
    });
  }

  async logPhoneNumberSaved(userId: string, userEmail: string, phoneNumber: string): Promise<void> {
    await this.log('phone_number_saved', {
      userId,
      userEmail,
      eventData: {
        phone_number_masked: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
        country_code: phoneNumber.match(/^\+\d{1,4}/)?.[0] || 'unknown'
      }
    });
  }

  async logTelegramSmsSent(userId: string, userEmail: string, phoneNumber: string): Promise<void> {
    await this.log('telegram_sms_sent', {
      userId,
      userEmail,
      eventData: {
        phone_number_masked: phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3),
        timestamp: new Date().toISOString()
      }
    });
  }

  async logSetupCompleted(userId: string, userEmail: string, setupData: any): Promise<void> {
    await this.log('setup_completed', {
      userId,
      userEmail,
      eventData: {
        google_calendar_connected: setupData.gcalLinked,
        telegram_connected: setupData.signalLinked, // Keep field name for compatibility
        phone_number: setupData.phoneNumber
      }
    });
  }
}

export const loggingService = new LoggingService();