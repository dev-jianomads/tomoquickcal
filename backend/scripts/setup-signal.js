#!/usr/bin/env node

/**
 * Setup script for Signal CLI integration
 * This script helps you register a phone number with Signal CLI
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import readline from 'readline';

const execAsync = promisify(exec);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (prompt) => new Promise((resolve) => {
  rl.question(prompt, resolve);
});

async function setupSignal() {
  console.log('🚀 Tomo QuickCal Signal CLI Setup');
  console.log('=====================================\n');

  try {
    // Check if Signal CLI is installed
    console.log('1. Checking Signal CLI installation...');
    const { stdout } = await execAsync('signal-cli --version');
    console.log(`✅ Signal CLI found: ${stdout.trim()}\n`);
  } catch (error) {
    console.log('❌ Signal CLI not found!');
    console.log('\n📋 Installation instructions:');
    console.log('macOS: brew install signal-cli');
    console.log('Ubuntu: sudo apt install signal-cli');
    console.log('Or download from: https://github.com/AsamK/signal-cli\n');
    process.exit(1);
  }

  // Get phone number for bot
  const phoneNumber = await question('2. Enter phone number for your bot (e.g., +1234567890): ');
  
  if (!phoneNumber.startsWith('+')) {
    console.log('❌ Phone number must start with country code (e.g., +1234567890)');
    process.exit(1);
  }

  try {
    // Register the number
    console.log('\n3. Registering phone number with Signal...');
    await execAsync(`signal-cli -a ${phoneNumber} register`);
    console.log('✅ Registration request sent!');
    
    // Get verification code
    const verificationCode = await question('\n4. Enter the verification code you received via SMS: ');
    
    // Verify the number
    console.log('5. Verifying phone number...');
    await execAsync(`signal-cli -a ${phoneNumber} verify ${verificationCode}`);
    console.log('✅ Phone number verified successfully!');
    
    // Test the setup
    console.log('\n6. Testing Signal CLI setup...');
    const { stdout: identities } = await execAsync(`signal-cli -a ${phoneNumber} listIdentities`);
    console.log('✅ Signal CLI setup complete!');
    
    // Create .env file
    console.log('\n7. Creating .env file...');
    const envContent = `# Signal CLI Configuration
SIGNAL_CLI_PATH=signal-cli
SIGNAL_BOT_NUMBER=${phoneNumber}
SIGNAL_DATA_PATH=./signal-data

# Server Configuration
PORT=3001
NODE_ENV=development

# Database
DATABASE_PATH=./data/app.db

# CORS
FRONTEND_URL=http://localhost:5173

# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key_here

# Google OAuth Configuration (Required for calendar integration)
GOOGLE_CLIENT_ID=your_google_client_id_here
GOOGLE_CLIENT_SECRET=your_google_client_secret_here
GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/success
`;
    
    const fs = await import('fs');
    fs.writeFileSync('.env', envContent);
    console.log('✅ .env file created');
    
    console.log('\n🎉 Setup complete!');
    console.log('\nNext steps:');
    console.log('1. Edit the .env file and add your API keys:');
    console.log('   - OPENAI_API_KEY: Get from https://platform.openai.com/api-keys');
    console.log('   - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET: Get from Google Cloud Console');
    console.log('2. Run: npm install');
    console.log('3. Run: npm run dev');
    console.log('4. Your bot is ready to receive messages!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('- Make sure the phone number is correct');
    console.log('- Check that you received the SMS verification code');
    console.log('- Ensure Signal CLI has proper permissions');
  }
  
  rl.close();
}

setupSignal().catch(console.error);