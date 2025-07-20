import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';

export class DatabaseService {
  constructor() {
    this.db = null;
    this.dbPath = process.env.DATABASE_PATH || './data/app.db';
  }

  async initialize() {
    return new Promise((resolve, reject) => {
      // Ensure data directory exists
      const dataDir = path.dirname(this.dbPath);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
          return;
        }
        
        console.log('Connected to SQLite database');
        this.createTables()
          .then(resolve)
          .catch(reject);
      });
    });
  }

  async createTables() {
    return new Promise((resolve, reject) => {
      const createTablesSQL = `
        CREATE TABLE IF NOT EXISTS linking_results (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT NOT NULL,
          status TEXT NOT NULL,
          google_tokens TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS events (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          start_time DATETIME NOT NULL,
          end_time DATETIME NOT NULL,
          google_event_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS conversations (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          phone_number TEXT NOT NULL,
          message_history TEXT,
          context TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
      `;

      this.db.exec(createTablesSQL, (err) => {
        if (err) {
          console.error('Error creating tables:', err);
          reject(err);
          return;
        }
        console.log('Database tables created successfully');
        resolve();
      });
    });
  }

  async storeLinkingResult(phoneNumber, status, googleTokens = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO linking_results (phone_number, status, google_tokens, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      this.db.run(sql, [phoneNumber, status, googleTokens ? JSON.stringify(googleTokens) : null], function(err) {
        if (err) {
          console.error('Error storing linking result:', err);
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  }

  async getLinkingResult(phoneNumber) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM linking_results WHERE phone_number = ?';
      
      this.db.get(sql, [phoneNumber], (err, row) => {
        if (err) {
          console.error('Error getting linking result:', err);
          reject(err);
          return;
        }
        
        if (row && row.google_tokens) {
          try {
            row.google_tokens = JSON.parse(row.google_tokens);
          } catch (e) {
            console.error('Error parsing google tokens:', e);
            row.google_tokens = null;
          }
        }
        
        resolve(row);
      });
    });
  }

  async storeEvent(phoneNumber, eventData) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT INTO events (phone_number, title, description, start_time, end_time, google_event_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        phoneNumber,
        eventData.title,
        eventData.description || null,
        eventData.startTime,
        eventData.endTime,
        eventData.googleEventId || null
      ];
      
      this.db.run(sql, params, function(err) {
        if (err) {
          console.error('Error storing event:', err);
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  }

  async getEvents(phoneNumber) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM events WHERE phone_number = ? ORDER BY start_time DESC';
      
      this.db.all(sql, [phoneNumber], (err, rows) => {
        if (err) {
          console.error('Error getting events:', err);
          reject(err);
          return;
        }
        resolve(rows);
      });
    });
  }

  async storeConversation(phoneNumber, messageHistory, context = null) {
    return new Promise((resolve, reject) => {
      const sql = `
        INSERT OR REPLACE INTO conversations (phone_number, message_history, context, updated_at)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
      `;
      
      this.db.run(sql, [phoneNumber, JSON.stringify(messageHistory), context], function(err) {
        if (err) {
          console.error('Error storing conversation:', err);
          reject(err);
          return;
        }
        resolve({ id: this.lastID });
      });
    });
  }

  async getConversation(phoneNumber) {
    return new Promise((resolve, reject) => {
      const sql = 'SELECT * FROM conversations WHERE phone_number = ?';
      
      this.db.get(sql, [phoneNumber], (err, row) => {
        if (err) {
          console.error('Error getting conversation:', err);
          reject(err);
          return;
        }
        
        if (row && row.message_history) {
          try {
            row.message_history = JSON.parse(row.message_history);
          } catch (e) {
            console.error('Error parsing message history:', e);
            row.message_history = [];
          }
        }
        
        resolve(row);
      });
    });
  }

  close() {
    if (this.db) {
      this.db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database connection closed');
        }
      });
    }
  }
}