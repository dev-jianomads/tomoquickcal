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
  created_at?: string;
}

export class SupabaseService {
  private get isRealSupabase(): boolean {
    return hasValidSupabaseConfig;
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

  // Create new user
  async createUser(userData: Omit<UserData, 'id' | 'created_at'>): Promise<UserData> {
    try {
      const userId = this.generateFirebaseUID();
      console.log('👤 Creating new user with ID:', userId);

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
        phone_number: userData.phone_number || null,
        access_token_2: userData.access_token_2 || null,
        refresh_token_2: userData.refresh_token_2 || null,
      };

      const { data, error } = await supabase
        .from('users')
        .insert([newUser])
        .select()
        .single();

      if (error) {
        throw error;
      }

      console.log('✅ User created successfully:', data.id);
      
      // Log user creation
      await loggingService.logUserCreated(data.id, data.email, data);
      
      return data;
    } catch (error) {
      console.error('❌ Error creating user:', error);
      throw error;
    }
  }

  // Update existing user
  async updateUser(userId: string, updates: Partial<Omit<UserData, 'id' | 'created_at'>>): Promise<UserData> {
    try {
      console.log('🔄 Updating user:', userId, 'with updates:', JSON.stringify(updates, null, 2));

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
          created_at: new Date().toISOString()
        };
        
        // Still log the event for demo purposes
        await loggingService.logUserUpdated(mockUser.id, mockUser.email, updates);
        return mockUser;
      }

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        console.error('❌ Supabase update error:', error);
        throw error;
      }

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