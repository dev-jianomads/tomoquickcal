import { createClient } from '@supabase/supabase-js';
import { loggingService } from './logging';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase URL format
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return url.includes('supabase.co') || url.includes('localhost');
  } catch {
    return false;
  }
};

// Check if we have valid Supabase configuration
const hasValidSupabaseConfig = supabaseUrl && 
  supabaseAnonKey && 
  isValidUrl(supabaseUrl) &&
  !supabaseUrl.includes('your-project') &&
  !supabaseUrl.includes('placeholder') &&
  !supabaseAnonKey.includes('your_supabase') &&
  !supabaseAnonKey.includes('placeholder');

if (!hasValidSupabaseConfig) {
  console.warn('⚠️ Supabase not configured properly. Demo mode will use mock data only.');
  console.warn('To enable Supabase:');
  console.warn('1. Set VITE_SUPABASE_URL to your actual Supabase project URL');
  console.warn('2. Set VITE_SUPABASE_ANON_KEY to your actual anonymous key');
  console.warn('3. Create a .env file in your project root with these variables');
}

// Create Supabase client - use real client if configured, mock client otherwise
export const supabase = hasValidSupabaseConfig 
  ? createClient(supabaseUrl!, supabaseAnonKey!)
  : createClient('https://mock.supabase.co', 'mock-key');

export interface UserData {
  id: string;
  email: string;
  display_name?: string;
  phone_number?: string;
  access_token_2?: string;
  refresh_token_2?: string;
  client_id_2?: string;
  client_secret_2?: string;
  granted_scopes?: any;
  refresh_expired_2?: boolean;
  refresh_expired_2?: boolean;
  created_at?: string;
}

export class SupabaseService {
  private get isRealSupabase(): boolean {
    return hasValidSupabaseConfig;
  }

  // Expose supabase client for direct operations (like delete)
  public get supabase() {
    return supabase;
  }

  // Generate Firebase-compatible UID format
  private generateFirebaseUID(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 28; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // ===== New RPC Helpers for normalized integrations schema (public.*) =====
  async getUserIntegrations(userId: string): Promise<any[]> {
    try {
      await loggingService.log('rpc_call', { eventData: { name: 'get_user_integrations', user_id: userId } });
      const { data, error } = await supabase.rpc('get_user_integrations', { user_id: userId });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'get_user_integrations', count: Array.isArray(data) ? data.length : 0 } });
      return Array.isArray(data) ? data : [];
    } catch (error) {
      console.error('❌ Error getting user integrations:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'get_user_integrations' } });
      return [];
    }
  }

  async userHasService(userId: string, serviceId: string): Promise<boolean> {
    try {
      await loggingService.log('rpc_call', { eventData: { name: 'user_has_service', user_id: userId, service_id: serviceId } });
      const { data, error } = await supabase.rpc('user_has_service', { user_id: userId, service_id: serviceId });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'user_has_service', result: !!data } });
      return !!data;
    } catch (error) {
      console.error('❌ Error checking user service:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'user_has_service' } });
      return false;
    }
  }

  async linkCalendarToUser(params: {
    userId: string;
    accessToken: string | null | undefined;
    refreshToken?: string | null | undefined;
    expiresAtIso?: string | null;
    clientId?: string | null;
    clientSecret?: string | null;
    grantedScopes?: any | null;
    externalUserId?: string | null;
    displayLabel?: string | null;
  }): Promise<void> {
    const {
      userId,
      accessToken,
      refreshToken,
      expiresAtIso,
      clientId,
      clientSecret,
      grantedScopes,
      externalUserId,
      displayLabel
    } = params;

    if (!accessToken) return; // nothing to link

    try {
      await loggingService.log('rpc_call', { eventData: { name: 'link_calendar_to_user', user_id: userId, has_refresh: !!(refreshToken ?? null) } });
      const { error } = await supabase.rpc('link_calendar_to_user', {
        user_id: userId,
        access_token: accessToken,
        refresh_token: refreshToken ?? null,
        expires_at: expiresAtIso ?? null,
        client_id: clientId ?? null,
        client_secret: clientSecret ?? null,
        granted_scopes: grantedScopes ?? null,
        external_user_id: externalUserId ?? null,
        display_label: displayLabel ?? 'Google Calendar'
      });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'link_calendar_to_user' } });
    } catch (error) {
      console.error('❌ Error linking calendar to user via RPC:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'link_calendar_to_user' } });
    }
  }

  async updateCalendarToken(userId: string, accessToken: string, expirySeconds?: number, refreshToken?: string | null): Promise<boolean> {
    try {
      await loggingService.log('rpc_call', { eventData: { name: 'update_calendar_token', user_id: userId, has_refresh: !!(refreshToken ?? null), expiry_seconds: expirySeconds ?? 3600 } });
      const { data, error } = await supabase.rpc('update_calendar_token', {
        user_id: userId,
        access_token: accessToken,
        expiry_seconds: expirySeconds ?? 3600,
        refresh_token: refreshToken ?? null
      });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'update_calendar_token' } });
      return !!data;
    } catch (error) {
      console.error('❌ Error updating calendar token via RPC:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'update_calendar_token' } });
      return false;
    }
  }

  async linkTelegramToUser(userId: string, telegramId: string, username?: string | null, label?: string | null): Promise<boolean> {
    try {
      await loggingService.log('rpc_call', { eventData: { name: 'link_telegram_to_user', user_id: userId, telegram_id: telegramId } });
      const { data, error } = await supabase.rpc('link_telegram_to_user', {
        user_id: userId,
        telegram_id: telegramId,
        username: username ?? null,
        label: label ?? 'Telegram'
      });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'link_telegram_to_user' } });
      return !!data;
    } catch (error) {
      console.error('❌ Error linking Telegram via RPC:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'link_telegram_to_user' } });
      return false;
    }
  }

  async linkWhatsAppToUser(userId: string, whatsappId: string, username?: string | null, label?: string | null): Promise<boolean> {
    try {
      await loggingService.log('rpc_call', { eventData: { name: 'link_whatsapp_to_user', user_id: userId, whatsapp_id: whatsappId } });
      const { data, error } = await supabase.rpc('link_whatsapp_to_user', {
        user_id: userId,
        whatsapp_id: whatsappId,
        username: username ?? null,
        label: label ?? 'WhatsApp'
      });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'link_whatsapp_to_user' } });
      return !!data;
    } catch (error) {
      console.error('❌ Error linking WhatsApp via RPC:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'link_whatsapp_to_user' } });
      return false;
    }
  }

  async unlinkServiceFromUser(userId: string, serviceId: string, externalUserId?: string | null): Promise<boolean> {
    try {
      await loggingService.log('rpc_call', { eventData: { name: 'unlink_service_from_user', user_id: userId, service_id: serviceId } });
      const { data, error } = await supabase.rpc('unlink_service_from_user', {
        user_id: userId,
        service_id: serviceId,
        external_user_id: externalUserId ?? null
      });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'unlink_service_from_user' } });
      return !!data;
    } catch (error) {
      console.error('❌ Error unlinking service via RPC:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'unlink_service_from_user' } });
      return false;
    }
  }

  async removeServiceIntegration(userId: string, serviceId: string, externalUserId?: string | null): Promise<boolean> {
    try {
      await loggingService.log('rpc_call', { eventData: { name: 'remove_service_integration', user_id: userId, service_id: serviceId } });
      const { data, error } = await supabase.rpc('remove_service_integration', {
        user_id: userId,
        service_id: serviceId,
        external_user_id: externalUserId ?? null
      });
      if (error) throw error;
      await loggingService.log('rpc_success', { eventData: { name: 'remove_service_integration' } });
      return !!data;
    } catch (error) {
      console.error('❌ Error removing service integration via RPC:', error);
      await loggingService.log('rpc_error', { errorMessage: (error as any)?.message, eventData: { name: 'remove_service_integration' } });
      return false;
    }
  }

  // Look up user by email
  async findUserByEmail(email: string): Promise<UserData | null> {
    try {
      console.log('🔍 Looking up user by email:', email);
      
      // If not real Supabase, return mock user for demo emails
      if (!this.isRealSupabase) {
        if (email === 'demo@example.com') {
          console.log('🎭 Demo mode: Returning mock user');
          return {
            id: 'demo_user_12345',
            email: 'demo@example.com',
            display_name: 'Demo User',
            phone_number: null,
            access_token_2: 'demo_token',
            refresh_token_2: 'demo_refresh',
            created_at: new Date().toISOString()
          };
        }
        console.log('🎭 Demo mode: User not found');
        return null;
      }
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned - user doesn't exist
          console.log('👤 User not found in database');
          return null;
        }
        throw error;
      }

      console.log('✅ User found in database:', data.id);
      return data;
    } catch (error) {
      console.error('❌ Error looking up user:', error);
      throw error;
    }
  }

  // Create new user (profile-only); route token fields to integrations via RPC
  async createUser(userData: Omit<UserData, 'id' | 'created_at'>): Promise<UserData> {
    try {
      const userId = this.generateFirebaseUID();
      console.log('👤 Creating new user with ID:', userId);
      console.log('👤 Input userData for createUser:', JSON.stringify(userData, null, 2));
      console.log('👤 granted_scopes in input:', {
        hasGrantedScopes: 'granted_scopes' in userData,
        grantedScopesValue: userData.granted_scopes,
        grantedScopesType: typeof userData.granted_scopes,
        grantedScopesIsNull: userData.granted_scopes === null,
        grantedScopesIsUndefined: userData.granted_scopes === undefined
      });

      // If not real Supabase, return mock user data
      if (!this.isRealSupabase) {
        console.log('🎭 Demo mode: Simulating user creation');
        const mockUser: UserData = {
          id: userId,
          email: userData.email,
          display_name: userData.display_name || null,
          phone_number: userData.phone_number || null,
          access_token_2: userData.access_token_2 || null,
          refresh_token_2: userData.refresh_token_2 || null,
          client_id_2: userData.client_id_2 || null,
          client_secret_2: userData.client_secret_2 || null,
          created_at: new Date().toISOString()
        };
        
        // Still log the event for demo purposes
        await loggingService.logUserCreated(mockUser.id, mockUser.email, mockUser);
        return mockUser;
      }

      const newUser = {
        id: userId,
        email: userData.email,
        display_name: userData.display_name || null,
        phone_number: userData.phone_number || null
      };

      console.log('👤 Final newUser object for Supabase:', JSON.stringify(newUser, null, 2));

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      console.log('👤 Supabase insert result:', {
        hasData: !!data,
        hasError: !!error,
        dataGrantedScopes: data?.granted_scopes,
        dataGrantedScopesType: typeof data?.granted_scopes,
        errorMessage: error?.message,
        errorCode: error?.code
      });

      if (error) {
        console.error('👤 Supabase insert error details:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      console.log('✅ User created successfully:', data.id);
      
      // Log user creation
      await loggingService.logUserCreated(data.id, data.email, data);
      
      // If Google token fields were provided, link calendar integration via RPC
      if (userData.access_token_2 || userData.refresh_token_2) {
        await this.linkCalendarToUser({
          userId,
          accessToken: userData.access_token_2,
          refreshToken: userData.refresh_token_2,
          clientId: userData.client_id_2,
          clientSecret: userData.client_secret_2,
          grantedScopes: userData.granted_scopes,
          externalUserId: userData.email,
          displayLabel: 'Google Calendar'
        });
      }

      return data;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // Update existing user (profile-only); route token updates to integrations via RPC
  async updateUser(userId: string, updates: Partial<Omit<UserData, 'id' | 'created_at'>>): Promise<UserData> {
    try {
      console.log('🔄 Updating user:', userId, 'with updates:', JSON.stringify(updates, null, 2));
      console.log('🔄 granted_scopes in updates:', {
        hasGrantedScopes: 'granted_scopes' in updates,
        grantedScopesValue: updates.granted_scopes,
        grantedScopesType: typeof updates.granted_scopes,
        grantedScopesIsNull: updates.granted_scopes === null,
        grantedScopesIsUndefined: updates.granted_scopes === undefined
      });
      console.log('🔄 refresh_expired_2 in updates:', {
        hasRefreshExpired2: 'refresh_expired_2' in updates,
        refreshExpired2Value: updates.refresh_expired_2,
        refreshExpired2Type: typeof updates.refresh_expired_2,
        updateKeys: Object.keys(updates)
      });
      
      // CRITICAL DEBUG: Log the exact object being sent to Supabase
      console.log('🔄 EXACT UPDATE OBJECT KEYS:', Object.keys(updates));
      console.log('🔄 EXACT UPDATE OBJECT:', updates);

      // If not real Supabase, return mock updated user
      if (!this.isRealSupabase) {
        console.log('🎭 Demo mode: Simulating user update');
        const mockUser: UserData = {
          id: userId,
          email: 'demo@example.com',
          display_name: 'Demo User',
          phone_number: updates.phone_number || null,
          access_token_2: updates.access_token_2 || 'demo_token',
          refresh_token_2: updates.refresh_token_2 || 'demo_refresh',
          client_id_2: updates.client_id_2 || null,
          refresh_expired_2: updates.refresh_expired_2 || false,
          created_at: new Date().toISOString()
        };
        
        // Still log the event for demo purposes
        await loggingService.logUserUpdated(mockUser.id, mockUser.email, updates);
        return mockUser;
      }

      // Separate profile fields vs token fields
      const profileUpdates: Record<string, any> = {};
      if ('display_name' in updates) profileUpdates.display_name = updates.display_name ?? null;
      if ('phone_number' in updates) profileUpdates.phone_number = updates.phone_number ?? null;

      // Apply profile updates if any
      let data: any = null;
      if (Object.keys(profileUpdates).length > 0) {
        console.log('🔄 SENDING PROFILE UPDATES TO SUPABASE:', JSON.stringify(profileUpdates, null, 2));
        const resp = await supabase
          .from('users')
          .update(profileUpdates)
          .eq('id', userId)
          .select()
          .single();
        data = resp.data;
        if (resp.error) {
          console.error('❌ Supabase profile update error:', resp.error);
          throw resp.error;
        }
      } else {
        // If no profile updates, fetch the user to return consistent shape
        const resp = await supabase
          .from('users')
          .select('*')
          .eq('id', userId)
          .single();
        data = resp.data;
      }

      // Handle calendar token linking/updating via RPC
      const hasAnyTokenField = (
        'access_token_2' in updates ||
        'refresh_token_2' in updates ||
        'client_id_2' in updates ||
        'client_secret_2' in updates ||
        'granted_scopes' in updates
      );
      if (hasAnyTokenField) {
        const alreadyLinked = await this.userHasService(userId, 'google_calendar');
        if (!alreadyLinked) {
          await this.linkCalendarToUser({
            userId,
            accessToken: updates.access_token_2,
            refreshToken: updates.refresh_token_2,
            clientId: updates.client_id_2,
            clientSecret: updates.client_secret_2,
            grantedScopes: updates.granted_scopes,
            externalUserId: data?.email ?? null,
            displayLabel: 'Google Calendar'
          });
        } else if (updates.access_token_2) {
          await this.updateCalendarToken(userId, updates.access_token_2, undefined, updates.refresh_token_2 ?? null);
        }
      }

      console.log('🔄 Supabase update result (profile + RPC tokens handled).');

      console.log('✅ User updated successfully. Final data:', JSON.stringify(data, null, 2));
      
      // Log user update
      await loggingService.logUserUpdated(data.id, data.email, updates);
      
      return data;
    } catch (error) {
      console.error('❌ Error updating user:', error);
      throw error;
    }
  }

  // Save or update user after Google OAuth (Step 1)
  async saveUserAfterGoogleAuth(googleUser: {
    email: string;
    name?: string;
    accessToken: string;
    refreshToken?: string;
    clientId?: string;
  }): Promise<UserData> {
    try {
      console.log('💾 Saving user after Google OAuth...');

      // Look up existing user by email
      const existingUser = await this.findUserByEmail(googleUser.email);

      const userData = {
        email: googleUser.email,
        display_name: googleUser.name || null,
        access_token_2: googleUser.accessToken,
        refresh_token_2: googleUser.refreshToken || null,
        client_id_2: googleUser.clientId || null
        // client_secret_2 should be set server-side for security
      };

      if (existingUser) {
        // Update existing user
        return await this.updateUser(existingUser.id, userData);
      } else {
        // Create new user
        return await this.createUser(userData);
      }
    } catch (error) {
      console.error('❌ Error saving user after Google auth:', error);
      throw error;
    }
  }

  // Update user with phone number after Signal connection (Step 2)
  async saveUserPhoneNumber(email: string, phoneNumber: string): Promise<UserData> {
    try {
      console.log('📱 Saving user phone number for email:', email);
      console.log('📱 Phone number (masked):', phoneNumber.substring(0, 3) + '***' + phoneNumber.substring(phoneNumber.length - 3));

      // Find user by email
      const existingUser = await this.findUserByEmail(email);
      console.log('🔍 Found existing user with ID:', existingUser?.id);
      console.log('🔍 Current phone_number in DB:', existingUser?.phone_number || 'null');
      
      if (!existingUser) {
        console.log('❌ User not found in database. This will be handled by the caller.');
        throw new Error('User not found. Please connect Google Calendar first.');
      }

      // Update with phone number
      console.log('🔄 Updating user with phone number...');
      const updatedUser = await this.updateUser(existingUser.id, {
        phone_number: phoneNumber
      });
      console.log('✅ User updated successfully');
      console.log('✅ New phone_number in DB:', updatedUser.phone_number || 'null');
      console.log('✅ Phone numbers match:', updatedUser.phone_number === phoneNumber);
      
      // Log phone number saved
      await loggingService.logPhoneNumberSaved(updatedUser.id, updatedUser.email, phoneNumber);
      
      return updatedUser;
    } catch (error) {
      console.error('❌ Error saving user phone number:', error);
      throw error;
    }
  }

  // Debug function to verify phone number was saved
  async verifyPhoneNumberSaved(email: string): Promise<{ saved: boolean; phoneNumber: string | null; userId: string | null }> {
    try {
      console.log('🔍 Verifying phone number saved for:', email);
      
      // If not real Supabase, simulate verification for demo
      if (!this.isRealSupabase) {
        console.log('🎭 Demo mode: Simulating phone verification - always returns saved');
        return {
          saved: true,
          phoneNumber: '+1234567890',
          userId: 'demo_user_12345'
        };
      }
      
      const user = await this.findUserByEmail(email);
      
      if (!user) {
        console.log('❌ User not found during verification');
        return { saved: false, phoneNumber: null, userId: null };
      }
      
      const hasPhoneNumber = !!user.phone_number;
      console.log('📱 Phone number verification result:');
      console.log('   - User ID:', user.id);
      console.log('   - Has phone number:', hasPhoneNumber);
      console.log('   - Phone number (masked):', user.phone_number ? user.phone_number.substring(0, 3) + '***' + user.phone_number.substring(user.phone_number.length - 3) : 'null');
      
      return {
        saved: hasPhoneNumber,
        phoneNumber: user.phone_number,
        userId: user.id
      };
    } catch (error) {
      console.error('❌ Error verifying phone number:', error);
      return { saved: false, phoneNumber: null, userId: null };
    }
  }

  // Get user by email with better error handling
  async getUserByEmail(email: string): Promise<UserData | null> {
    try {
      return await this.findUserByEmail(email);
    } catch (error) {
      console.error('❌ Error getting user by email:', error);
      return null;
    }
  }
}

export const supabaseService = new SupabaseService();