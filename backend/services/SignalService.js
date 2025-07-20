import { spawn } from 'child_process';
import fs from 'fs/promises';
import path from 'path';

export class SignalService {
  constructor() {
    this.signalCliPath = process.env.SIGNAL_CLI_PATH || 'signal-cli';
    this.phoneNumber = process.env.SIGNAL_BOT_NUMBER;
    this.dataPath = process.env.SIGNAL_DATA_PATH || './signal-data';
  }

  async sendMessage(recipient, message) {
    return new Promise((resolve, reject) => {
      const args = [
        '--config', this.dataPath,
        '-u', this.phoneNumber,
        'send',
        '-m', message,
        recipient
      ];

      const signalProcess = spawn(this.signalCliPath, args);
      let output = '';
      let errorOutput = '';

      signalProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      signalProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      signalProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(`Signal CLI failed with code ${code}: ${errorOutput}`));
        }
      });

      signalProcess.on('error', (error) => {
        reject(new Error(`Failed to start Signal CLI: ${error.message}`));
      });
    });
  }

  async receiveMessages() {
    return new Promise((resolve, reject) => {
      const args = [
        '--config', this.dataPath,
        '-u', this.phoneNumber,
        'receive',
        '--json'
      ];

      const signalProcess = spawn(this.signalCliPath, args);
      let output = '';
      let errorOutput = '';

      signalProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      signalProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      signalProcess.on('close', (code) => {
        if (code === 0) {
          try {
            const messages = output.split('\n')
              .filter(line => line.trim())
              .map(line => JSON.parse(line))
              .filter(msg => msg.envelope && msg.envelope.dataMessage);
            
            resolve(messages);
          } catch (parseError) {
            reject(new Error(`Failed to parse messages: ${parseError.message}`));
          }
        } else {
          reject(new Error(`Signal CLI failed with code ${code}: ${errorOutput}`));
        }
      });

      signalProcess.on('error', (error) => {
        reject(new Error(`Failed to start Signal CLI: ${error.message}`));
      });
    });
  }

  async isRegistered() {
    try {
      const configPath = path.join(this.dataPath, 'data', this.phoneNumber);
      await fs.access(configPath);
      return true;
    } catch {
      return false;
    }
  }

  async register() {
    return new Promise((resolve, reject) => {
      const args = [
        '--config', this.dataPath,
        '-u', this.phoneNumber,
        'register'
      ];

      const signalProcess = spawn(this.signalCliPath, args);
      let output = '';
      let errorOutput = '';

      signalProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      signalProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      signalProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(`Registration failed with code ${code}: ${errorOutput}`));
        }
      });

      signalProcess.on('error', (error) => {
        reject(new Error(`Failed to start Signal CLI: ${error.message}`));
      });
    });
  }

  async verify(verificationCode) {
    return new Promise((resolve, reject) => {
      const args = [
        '--config', this.dataPath,
        '-u', this.phoneNumber,
        'verify',
        verificationCode
      ];

      const signalProcess = spawn(this.signalCliPath, args);
      let output = '';
      let errorOutput = '';

      signalProcess.stdout.on('data', (data) => {
        output += data.toString();
      });

      signalProcess.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

      signalProcess.on('close', (code) => {
        if (code === 0) {
          resolve({ success: true, output });
        } else {
          reject(new Error(`Verification failed with code ${code}: ${errorOutput}`));
        }
      });

      signalProcess.on('error', (error) => {
        reject(new Error(`Failed to start Signal CLI: ${error.message}`));
      });
    });
  }
}