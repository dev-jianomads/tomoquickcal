#!/usr/bin/env node

/**
 * Test script for Signal CLI integration
 * Run this after setting up Signal CLI to verify everything works
 */

import { SignalService } from '../services/SignalService.js';
import dotenv from 'dotenv';

dotenv.config();

async function testSignalSetup() {
  console.log('🧪 Testing Signal CLI Setup');
  console.log('============================\n');

  const signalService = new SignalService();

  try {
    // Test 1: Check if Signal CLI is accessible
    console.log('1. Checking Signal CLI installation...');
    const { spawn } = await import('child_process');
    
    const testProcess = spawn(signalService.signalCliPath, ['--version']);
    
    await new Promise((resolve, reject) => {
      let output = '';
      
      testProcess.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      testProcess.on('close', (code) => {
        if (code === 0) {
          console.log(`✅ Signal CLI found: ${output.trim()}`);
          resolve();
        } else {
          reject(new Error('Signal CLI not found or not working'));
        }
      });
      
      testProcess.on('error', (error) => {
        reject(new Error(`Failed to run Signal CLI: ${error.message}`));
      });
    });

    // Test 2: Check if bot number is configured
    console.log('\n2. Checking bot number configuration...');
    if (!signalService.phoneNumber) {
      throw new Error('SIGNAL_BOT_NUMBER not configured in .env file');
    }
    console.log(`✅ Bot number configured: ${signalService.phoneNumber}`);

    // Test 3: Check if bot is registered
    console.log('\n3. Checking bot registration...');
    const isRegistered = await signalService.isRegistered();
    if (isRegistered) {
      console.log('✅ Bot is registered with Signal');
    } else {
      console.log('❌ Bot is not registered. Run the setup script first.');
      return;
    }

    // Test 4: Test sending a message to yourself
    console.log('\n4. Testing message sending...');
    try {
      const testMessage = `🤖 Test message from Tomo QuickCal at ${new Date().toLocaleTimeString()}`;
      await signalService.sendMessage(signalService.phoneNumber, testMessage);
      console.log('✅ Test message sent successfully');
      console.log('   Check your Signal app to see if you received it');
    } catch (error) {
      console.log(`❌ Failed to send test message: ${error.message}`);
    }

    // Test 5: Test receiving messages
    console.log('\n5. Testing message reception...');
    try {
      const messages = await signalService.receiveMessages();
      console.log(`✅ Message reception test completed`);
      console.log(`   Found ${messages.length} new messages`);
      
      if (messages.length > 0) {
        console.log('   Recent messages:');
        messages.slice(-3).forEach((msg, i) => {
          const text = msg.envelope?.dataMessage?.message || 'No text';
          const sender = msg.envelope?.source || 'Unknown';
          console.log(`   ${i + 1}. From ${sender}: "${text.substring(0, 50)}..."`);
        });
      }
    } catch (error) {
      console.log(`❌ Failed to receive messages: ${error.message}`);
    }

    console.log('\n🎉 Signal CLI setup test completed!');
    console.log('\nNext steps:');
    console.log('1. Start the backend server: npm run dev');
    console.log('2. Send a message to your bot from another Signal account');
    console.log('3. Check the server logs to see if messages are received');

  } catch (error) {
    console.error('\n❌ Signal CLI setup test failed:', error.message);
    console.log('\n💡 Troubleshooting:');
    console.log('1. Make sure Signal CLI is installed and in your PATH');
    console.log('2. Run the setup script: npm run setup-signal');
    console.log('3. Check that your phone number is properly registered');
    console.log('4. Verify your .env file has the correct configuration');
  }
}

testSignalSetup().catch(console.error);