// src/services/ratingAnalyzerService.js
const { google } = require('googleapis');
const { OpenAI } = require('openai');
const dotenv = require('dotenv');

dotenv.config();

// Configure OpenAI API
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Google Sheets Setup
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const SHEET_ID = process.env.GOOGLE_SHEET_ID;

// Function to authenticate with Google Sheets
async function getGoogleSheetsAuth() {
  try {
    const auth = new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
      scopes: SCOPES,
    });
    
    const client = await auth.getClient();
    const sheets = google.sheets({ version: 'v4', auth: client });
    
    return sheets;
  } catch (error) {
    console.error('Google Sheets Auth Error:', error);
    throw new Error('Failed to authenticate with Google Sheets');
  }
}

// Function to fetch sheet data directly
async function fetchDirectSheetData() {
  try {
    const sheets = await getGoogleSheetsAuth();
    
    // Get sheet names first
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: SHEET_ID
    });
    
    const sheetNames = spreadsheetInfo.data.sheets.map(sheet => 
      sheet.properties.title
    );
    
    console.log('Available sheets:', sheetNames);
    
    // Use the first sheet that contains 'Live Class Poll' or 'Poll' in the name, or Sheet1
    const targetSheet = sheetNames.find(name => 
      name.includes('Live Class Poll') || name.includes('Poll')
    ) || 'Sheet1';
    
    console.log(`Using sheet: ${targetSheet}`);
    
    // Get the data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SHEET_ID,
      range: `${targetSheet}!A1:P1000`,
    });
    
    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('No data found in the spreadsheet');
    }
    
    console.log(`Successfully fetched ${rows.length} rows from sheet ${targetSheet}`);
    
    return {
      sheetName: targetSheet,
      rows: rows
    };
  } catch (error) {
    console.error('Error fetching sheet data:', error);
    throw new Error(`Failed to fetch data from Google Sheets: ${error.message}`);
  }
}

// Convert raw sheet data to structured format
function convertToStructured(rows) {
  if (!rows || rows.length < 2) return [];
  
  const headers = rows[0];
  return rows.slice(1).map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      if (index < row.length) {
        obj[header] = row[index];
      } else {
        obj[header] = null;
      }
    });
    return obj;
  });
}

// Filter data relevant to a specific query
function filterRelevantData(query, structuredData) {
  const lowerQuery = query.toLowerCase();
  let relevantRows = [];
  
  // Extract names and terms that might be mentioned in the query
  const instructors = [...new Set(structuredData.map(row => row['Instructor']).filter(Boolean))];
  const domains = [...new Set(structuredData.map(row => row['Domain']).filter(Boolean))];
  const topics = [...new Set(structuredData.map(row => row['Topic Code']).filter(Boolean))];
  
  // Check for instructor mentions
  for (const instructor of instructors) {
    if (lowerQuery.includes(instructor.toLowerCase())) {
      // This query is about a specific instructor
      const instructorRows = structuredData.filter(row => row['Instructor'] === instructor);
      relevantRows = [...relevantRows, ...instructorRows];
      console.log(`Found ${instructorRows.length} rows for instructor: ${instructor}`);
    }
  }
  
  // Check for domain mentions
  for (const domain of domains) {
    if (domain && lowerQuery.includes(domain.toLowerCase())) {
      // This query is about a specific domain
      const domainRows = structuredData.filter(row => row['Domain'] === domain);
      
      // Avoid duplicates
      domainRows.forEach(row => {
        if (!relevantRows.some(r => 
          r['Topic Code'] === row['Topic Code'] && 
          r['Instructor'] === row['Instructor'] && 
          r['Session Date'] === row['Session Date']
        )) {
          relevantRows.push(row);
        }
      });
      
      console.log(`Found ${domainRows.length} rows for domain: ${domain}`);
    }
  }
  
  // If we haven't found relevant rows yet, check for topic mentions
  if (relevantRows.length === 0) {
    for (const topic of topics) {
      if (topic && lowerQuery.includes(topic.toLowerCase())) {
        const topicRows = structuredData.filter(row => row['Topic Code'] === topic);
        relevantRows = [...relevantRows, ...topicRows];
        console.log(`Found ${topicRows.length} rows for topic: ${topic}`);
      }
    }
  }
  
  // If we still don't have relevant rows, try to infer intent from common query types
  if (relevantRows.length === 0) {
    if (lowerQuery.includes('highest rating') || lowerQuery.includes('top instructor')) {
      // Add all rows with ratings for a top-N analysis
      relevantRows = structuredData.filter(row => row['Overall Average Rating']);
      console.log(`Added ${relevantRows.length} rows with ratings for top instructor analysis`);
    } else if (lowerQuery.includes('backend')) {
      // Backend-specific query
      relevantRows = structuredData.filter(row => row['Domain'] === 'Backend');
      console.log(`Added ${relevantRows.length} rows for Backend domain`);
    } else if (lowerQuery.includes('fullstack')) {
      // Fullstack-specific query
      relevantRows = structuredData.filter(row => row['Domain'] === 'Fullstack');
      console.log(`Added ${relevantRows.length} rows for Fullstack domain`);
    }
  }
  
  // If we still have no relevancy filter, return a sample from each instructor
  if (relevantRows.length === 0) {
    const instructorMap = {};
    
    // Get samples from each instructor
    for (const instructor of instructors) {
      const instructorRows = structuredData.filter(row => row['Instructor'] === instructor);
      instructorMap[instructor] = instructorRows.slice(0, 3); // Take up to 3 rows per instructor
    }
    
    // Flatten the samples
    relevantRows = Object.values(instructorMap).flat();
    console.log(`No specific filter applied, using ${relevantRows.length} sample rows`);
  }
  
  return relevantRows;
}

// Format relevant rows as a CSV string
function formatAsCSV(headers, rows) {
  if (!rows || rows.length === 0) return '';
  
  // Start with headers
  let csv = headers.join(',') + '\n';
  
  // Add rows
  rows.forEach(row => {
    const rowValues = headers.map(header => {
      const value = row[header];
      // Handle commas and quotes in the data
      if (value === null || value === undefined) return '';
      if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
        return `"${value.replace(/"/g, '""')}"`;
      }
      return value;
    });
    
    csv += rowValues.join(',') + '\n';
  });
  
  return csv;
}

// Analyze data with GPT-4, focusing only on relevant parts
async function focusedGPT4Analysis(query, sheetData) {
  try {
    // Convert to structured data
    const structuredData = convertToStructured(sheetData.rows);
    const headers = sheetData.rows[0];
    
    // Filter data relevant to the query
    const relevantRows = filterRelevantData(query, structuredData);
    
    // Create dataset summary for context
    const instructors = [...new Set(structuredData.map(row => row['Instructor']).filter(Boolean))];
    const domains = [...new Set(structuredData.map(row => row['Domain']).filter(Boolean))];
    
    // Format relevant data as CSV
    const relevantCSV = formatAsCSV(headers, relevantRows);
    
    // Create a focused prompt for GPT-4
    const prompt = `
You are analyzing data from an Interview Kickstart ratings sheet. The full dataset has ${structuredData.length} rows, but I'm providing you with ${relevantRows.length} rows that are most relevant to the query.

User query: "${query}"

Dataset information:
- Available instructors: ${instructors.join(', ')}
- Available domains: ${domains.join(', ')}
- Selected rows: ${relevantRows.length} out of ${structuredData.length} total

Here is the CSV data of the relevant rows:

${relevantCSV}

Please analyze this data to answer the query, focusing on:
1. Accurate counts of sessions
2. Precise calculation of average ratings
3. All available information for the instructor(s) or domain(s) mentioned
4. Clear presentation of results with all relevant details

Your answer should be comprehensive and include ALL statistics that can be derived from the data, especially ratings when available.
`;

    console.log(`Sending focused data (${relevantRows.length} rows) to GPT-4...`);
    
    // Use GPT-4 to analyze the focused data
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { 
          role: "system", 
          content: "You are a precise data analyst. Answer the query using ONLY the data provided, showing all relevant statistics including session counts, ratings, and other metrics."
        },
        { role: "user", content: prompt }
      ],
      max_tokens: 24000,
      temperature: 0.1,
    });

    // Return the raw GPT-4 response
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('GPT-4 Analysis Error:', error);
    
    if (error.response) {
      console.error('Error details:', error.response.data);
    }
    
    // Fall back to manual analysis if GPT-4 fails
    return performManualAnalysis(query, sheetData);
  }
}

// Perform manual analysis as a fallback
function performManualAnalysis(query, sheetData) {
  try {
    const lowerQuery = query.toLowerCase();
    const structuredData = convertToStructured(sheetData.rows);
    
    // Helper function to calculate average rating
    function calculateAverage(rows, field) {
      const validValues = rows
        .map(row => {
          const value = row[field];
          if (!value) return null;
          const num = parseFloat(value);
          return isNaN(num) ? null : num;
        })
        .filter(Boolean);
      
      if (validValues.length === 0) return null;
      const sum = validValues.reduce((total, val) => total + val, 0);
      return (sum / validValues.length).toFixed(2);
    }
    
    // Check for instructor queries
    for (const instructor of [...new Set(structuredData.map(row => row['Instructor']).filter(Boolean))]) {
      if (lowerQuery.includes(instructor.toLowerCase())) {
        const instructorRows = structuredData.filter(row => row['Instructor'] === instructor);
        
        if (instructorRows.length === 0) {
          return `No data found for instructor: ${instructor}`;
        }
        
        // Calculate overall average
        const overallAvg = calculateAverage(instructorRows, 'Overall Average Rating');
        
        // Group by domain
        const domainMap = {};
        instructorRows.forEach(row => {
          const domain = row['Domain'] || 'Unknown';
          if (!domainMap[domain]) {
            domainMap[domain] = [];
          }
          domainMap[domain].push(row);
        });
        
        // Build response
        let response = `Information for instructor ${instructor}:\n\n`;
        response += `Total sessions: ${instructorRows.length}\n`;
        
        if (overallAvg) {
          response += `Overall average rating: ${overallAvg}\n`;
        } else {
          response += `Overall average rating: No valid ratings available\n`;
        }
        
        response += `\nSessions by domain:\n`;
        Object.entries(domainMap).forEach(([domain, rows]) => {
          const domainAvg = calculateAverage(rows, 'Overall Average Rating');
          response += `- ${domain}: ${rows.length} session(s)`;
          if (domainAvg) {
            response += `, Average rating: ${domainAvg}`;
          }
          response += `\n`;
        });
        
        response += `\nSessions:\n`;
        instructorRows.forEach((row, index) => {
          response += `${index + 1}. ${row['Topic Code'] || 'Unknown Topic'}\n`;
          response += `   - Domain: ${row['Domain'] || 'Not specified'}\n`;
          response += `   - Date: ${row['Session Date'] || 'Not specified'}\n`;
          response += `   - Rating: ${row['Overall Average Rating'] || 'Not rated'}\n`;
          if (row['Cohorts']) {
            response += `   - Cohorts: ${row['Cohorts']}\n`;
          }
          response += `\n`;
        });
        
        return response;
      }
    }
    
    // Check for domain queries
    for (const domain of [...new Set(structuredData.map(row => row['Domain']).filter(Boolean))]) {
      if (lowerQuery.includes(domain.toLowerCase())) {
        const domainRows = structuredData.filter(row => row['Domain'] === domain);
        
        if (domainRows.length === 0) {
          return `No data found for domain: ${domain}`;
        }
        
        // Calculate overall average
        const overallAvg = calculateAverage(domainRows, 'Overall Average Rating');
        
        // Group by instructor
        const instructorMap = {};
        domainRows.forEach(row => {
          const instructor = row['Instructor'] || 'Unknown';
          if (!instructorMap[instructor]) {
            instructorMap[instructor] = [];
          }
          instructorMap[instructor].push(row);
        });
        
        // Build response
        let response = `Analysis for ${domain} domain:\n\n`;
        response += `Total sessions: ${domainRows.length}\n`;
        
        if (overallAvg) {
          response += `Overall average rating: ${overallAvg}\n`;
        } else {
          response += `Overall average rating: No valid ratings available\n`;
        }
        
        response += `\nSessions by instructor:\n`;
        Object.entries(instructorMap).forEach(([instructor, rows]) => {
          const instructorAvg = calculateAverage(rows, 'Overall Average Rating');
          response += `- ${instructor}: ${rows.length} session(s)`;
          if (instructorAvg) {
            response += `, Average rating: ${instructorAvg}`;
          }
          response += `\n`;
        });
        
        return response;
      }
    }
    
    // Default response
    return `Could not analyze this specific query. Please try asking about a specific instructor or domain.`;
  } catch (error) {
    console.error('Manual analysis error:', error);
    return `Error performing analysis: ${error.message}`;
  }
}

// Main analysis function
async function analyzeQuery(query) {
  try {
    // Fetch sheet data directly
    const sheetData = await fetchDirectSheetData();
    
    // Use focused analysis to avoid token limits
    const analysis = await focusedGPT4Analysis(query, sheetData);
    
    // Return the analysis
    return { 
      success: true, 
      data: analysis
    };
  } catch (error) {
    console.error('Query Analysis Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = { analyzeQuery };