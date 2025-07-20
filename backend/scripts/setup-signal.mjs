@@ .. @@
     // Create .env file
     console.log('\n7. Creating .env file...');
     const envContent = `# Signal CLI Configuration
 SIGNAL_CLI_PATH=signal-cli
 SIGNAL_BOT_NUMBER=${phoneNumber}
 SIGNAL_DATA_DIR=./signal-data
 
 # Server Configuration
 PORT=3001
 NODE_ENV=development
 
 # Database
 DATABASE_PATH=./data/app.db
 
 # CORS
 FRONTEND_URL=http://localhost:5173
+
+# OpenAI Configuration (Required)
+OPENAI_API_KEY=your_openai_api_key_here
+
+# Google OAuth Configuration (Required for calendar integration)
+GOOGLE_CLIENT_ID=your_google_client_id_here
+GOOGLE_CLIENT_SECRET=your_google_client_secret_here
+GOOGLE_REDIRECT_URI=http://localhost:5173/oauth/success
 `;
     
     const fs = await import('fs');
     fs.writeFileSync('.env', envContent);
     console.log('✅ .env file created');
     
     console.log('\n🎉 Setup complete!');
     console.log('\nNext steps:');
-    console.log('1. Run: npm install');
-    console.log('2. Run: npm run dev');
-    console.log('3. Your bot is ready to receive messages!');
+    console.log('1. Edit the .env file and add your API keys:');
+    console.log('   - OPENAI_API_KEY: Get from https://platform.openai.com/api-keys');
+    console.log('   - GOOGLE_CLIENT_ID & GOOGLE_CLIENT_SECRET: Get from Google Cloud Console');
+    console.log('2. Run: npm install');
+    console.log('3. Run: npm run dev');
+    console.log('4. Your bot is ready to receive messages!');
     
   } catch (error) {