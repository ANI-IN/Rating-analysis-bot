// src/debug-sheets.js
const { google } = require('googleapis');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config();

// Google Sheets Setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;
const SERVICE_ACCOUNT_KEY_PATH = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;

// Debug information collection
const debugInfo = {
  environment: {},
  sheets: {},
  errors: []
};

async function debugGoogleSheets() {
  console.log('\n---------- GOOGLE SHEETS CONNECTION DEBUGGER ----------\n');
  
  // 1. Environment Check
  console.log('STEP 1: Checking environment variables...');
  debugInfo.environment.SHEET_ID = SHEET_ID ? '✓ Set' : '✗ Missing';
  debugInfo.environment.SERVICE_ACCOUNT_KEY_PATH = SERVICE_ACCOUNT_KEY_PATH ? '✓ Set' : '✗ Missing';
  
  // Check if the service account key file exists
  if (SERVICE_ACCOUNT_KEY_PATH) {
    try {
      const keyFileExists = fs.existsSync(SERVICE_ACCOUNT_KEY_PATH);
      debugInfo.environment.KEY_FILE_EXISTS = keyFileExists ? '✓ File exists' : '✗ File not found';
      
      if (keyFileExists) {
        // Check if it's valid JSON
        try {
          const keyFileContent = fs.readFileSync(SERVICE_ACCOUNT_KEY_PATH, 'utf8');
          JSON.parse(keyFileContent);
          debugInfo.environment.KEY_FILE_JSON = '✓ Valid JSON';
          
          // Verify key file has required fields
          const keyData = JSON.parse(keyFileContent);
          const requiredFields = ['client_email', 'private_key', 'project_id'];
          const missingFields = requiredFields.filter(field => !keyData[field]);
          
          if (missingFields.length === 0) {
            debugInfo.environment.KEY_FILE_FIELDS = '✓ Contains required fields';
            debugInfo.environment.CLIENT_EMAIL = `✓ ${keyData.client_email}`;
          } else {
            debugInfo.environment.KEY_FILE_FIELDS = `✗ Missing fields: ${missingFields.join(', ')}`;
          }
        } catch (error) {
          debugInfo.environment.KEY_FILE_JSON = '✗ Invalid JSON';
          debugInfo.errors.push(`Service account key file is not valid JSON: ${error.message}`);
        }
      } else {
        debugInfo.errors.push(`Service account key file not found at: ${SERVICE_ACCOUNT_KEY_PATH}`);
      }
    } catch (error) {
      debugInfo.environment.KEY_FILE_EXISTS = `✗ Error checking file: ${error.message}`;
      debugInfo.errors.push(`Error checking service account key file: ${error.message}`);
    }
  } else {
    debugInfo.errors.push('GOOGLE_SERVICE_ACCOUNT_KEY environment variable is not set');
  }
  
  if (!SHEET_ID) {
    debugInfo.errors.push('GOOGLE_SHEET_ID environment variable is not set');
  }
  
  // 2. Google Auth Test
  console.log('\nSTEP 2: Testing Google Authentication...');
  if (debugInfo.errors.length === 0) {
    try {
      const auth = new google.auth.GoogleAuth({
        keyFile: SERVICE_ACCOUNT_KEY_PATH,
        scopes: SCOPES,
      });
      
      const client = await auth.getClient();
      debugInfo.sheets.AUTH = '✓ Authentication successful';
      console.log('Authentication successful!');
      
      // 3. Spreadsheet Info Test
      console.log('\nSTEP 3: Getting spreadsheet information...');
      const sheets = google.sheets({ version: 'v4', auth: client });
      
      try {
        const spreadsheetInfo = await sheets.spreadsheets.get({
          spreadsheetId: SHEET_ID
        });
        
        debugInfo.sheets.SPREADSHEET_ACCESS = '✓ Successfully accessed spreadsheet';
        debugInfo.sheets.SPREADSHEET_TITLE = spreadsheetInfo.data.properties.title;
        
        // Get sheet names
        const sheetNames = spreadsheetInfo.data.sheets.map(sheet => sheet.properties.title);
        debugInfo.sheets.SHEET_NAMES = sheetNames;
        console.log(`Spreadsheet title: ${debugInfo.sheets.SPREADSHEET_TITLE}`);
        console.log(`Available sheets: ${sheetNames.join(', ')}`);
        
        // 4. Data Access Test
        console.log('\nSTEP 4: Testing data access for each sheet...');
        const dataAccessResults = {};
        
        for (const sheetName of sheetNames) {
          try {
            // Try to get a small sample of data
            const response = await sheets.spreadsheets.values.get({
              spreadsheetId: SHEET_ID,
              range: `${sheetName}!A1:C5`,
            });
            
            const rows = response.data.values || [];
            dataAccessResults[sheetName] = {
              success: true,
              rowCount: rows.length,
              headers: rows.length > 0 ? rows[0] : []
            };
            console.log(`Sheet "${sheetName}": ✓ Successfully accessed data (${rows.length} rows)`);
            
            if (rows.length > 0) {
              console.log(`  Headers: ${JSON.stringify(rows[0])}`);
            }
          } catch (error) {
            dataAccessResults[sheetName] = {
              success: false,
              error: error.message
            };
            console.log(`Sheet "${sheetName}": ✗ Error accessing data: ${error.message}`);
            debugInfo.errors.push(`Error accessing data in sheet "${sheetName}": ${error.message}`);
          }
        }
        
        debugInfo.sheets.DATA_ACCESS = dataAccessResults;
        
      } catch (error) {
        debugInfo.sheets.SPREADSHEET_ACCESS = `✗ Error accessing spreadsheet: ${error.message}`;
        console.log(`Error accessing spreadsheet: ${error.message}`);
        
        if (error.response && error.response.data && error.response.data.error) {
          console.log('Detailed error:', JSON.stringify(error.response.data.error, null, 2));
          debugInfo.errors.push(`Spreadsheet access error: ${JSON.stringify(error.response.data.error)}`);
        } else {
          debugInfo.errors.push(`Spreadsheet access error: ${error.message}`);
        }
      }
      
    } catch (error) {
      debugInfo.sheets.AUTH = `✗ Authentication failed: ${error.message}`;
      console.log(`Authentication failed: ${error.message}`);
      
      if (error.response && error.response.data && error.response.data.error) {
        console.log('Detailed error:', JSON.stringify(error.response.data.error, null, 2));
        debugInfo.errors.push(`Authentication error: ${JSON.stringify(error.response.data.error)}`);
      } else {
        debugInfo.errors.push(`Authentication error: ${error.message}`);
      }
    }
  }
  
  // Summary
  console.log('\n---------- DEBUG SUMMARY ----------');
  if (debugInfo.errors.length === 0) {
    console.log('✅ All checks passed! Your Google Sheets integration should be working correctly.');
    console.log('\nTo fix your rating analyzer service:');
    console.log(`1. Update your code to use one of these sheet names: ${debugInfo.sheets.SHEET_NAMES.join(', ')}`);
    console.log('2. Make sure to use the exact sheet name in your code');
  } else {
    console.log('❌ There were errors in your Google Sheets integration:');
    debugInfo.errors.forEach((error, index) => {
      console.log(`${index + 1}. ${error}`);
    });
    
    console.log('\nRECOMMENDED FIXES:');
    if (!debugInfo.environment.SHEET_ID || debugInfo.environment.SHEET_ID === '✗ Missing') {
      console.log('- Add GOOGLE_SHEET_ID to your .env file');
    }
    if (!debugInfo.environment.SERVICE_ACCOUNT_KEY_PATH || debugInfo.environment.SERVICE_ACCOUNT_KEY_PATH === '✗ Missing') {
      console.log('- Add GOOGLE_SERVICE_ACCOUNT_KEY to your .env file');
    }
    if (debugInfo.environment.KEY_FILE_EXISTS === '✗ File not found') {
      console.log('- Check that your service account key file exists at the specified path');
    }
    if (debugInfo.sheets.AUTH && debugInfo.sheets.AUTH.includes('✗')) {
      console.log('- Verify your service account has the correct permissions');
      console.log('- Make sure you\'ve shared the spreadsheet with your service account email');
    }
  }
  
  // Save debug info to file
  const debugFilePath = path.join(__dirname, 'google-sheets-debug.json');
  fs.writeFileSync(debugFilePath, JSON.stringify(debugInfo, null, 2));
  console.log(`\nFull debug information saved to: ${debugFilePath}`);
}

// Run the debugger
debugGoogleSheets().catch(error => {
  console.error('Debugger error:', error);
});