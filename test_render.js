#!/usr/bin/env node

/**
 * EvilWorker Render Deployment Test Script
 * Tests the framework functionality for Render deployment
 */

const http = require('http');
const https = require('https');

// Configuration
const TEST_CONFIG = {
    localhost: 'http://localhost:3000',
    renderUrl: process.env.RENDER_URL || 'https://your-service-name.onrender.com',
    timeout: 10000,
    endpoints: [
        '/',
        '/health',
        '/debug',
        '/session-debug'
    ]
};

// Colors for console output
const colors = {
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    reset: '\x1b[0m',
    bold: '\x1b[1m'
};

function log(message, color = 'reset') {
    console.log(`${colors[color]}${message}${colors.reset}`);
}

function makeRequest(url, endpoint = '') {
    return new Promise((resolve, reject) => {
        const fullUrl = `${url}${endpoint}`;
        const client = url.startsWith('https') ? https : http;
        
        const req = client.get(fullUrl, {
            timeout: TEST_CONFIG.timeout,
            headers: {
                'User-Agent': 'EvilWorker-Test/1.0'
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    data: data,
                    url: fullUrl
                });
            });
        });
        
        req.on('error', reject);
        req.on('timeout', () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });
    });
}

async function testEndpoint(baseUrl, endpoint, expectedStatus = 200) {
    try {
        log(`Testing ${endpoint}...`, 'blue');
        const response = await makeRequest(baseUrl, endpoint);
        
        if (response.statusCode === expectedStatus) {
            log(`✅ ${endpoint} - Status: ${response.statusCode}`, 'green');
            return true;
        } else {
            log(`❌ ${endpoint} - Expected: ${expectedStatus}, Got: ${response.statusCode}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ ${endpoint} - Error: ${error.message}`, 'red');
        return false;
    }
}

async function testHealthCheck(baseUrl) {
    try {
        log('Testing health check endpoint...', 'blue');
        const response = await makeRequest(baseUrl, '/health');
        
        if (response.statusCode === 200) {
            try {
                const healthData = JSON.parse(response.data);
                log(`✅ Health check - Status: ${response.statusCode}`, 'green');
                log(`   Service: ${healthData.service}`, 'green');
                log(`   Uptime: ${healthData.uptime}s`, 'green');
                return true;
            } catch (e) {
                log(`⚠️  Health check - Invalid JSON response`, 'yellow');
                return false;
            }
        } else {
            log(`❌ Health check - Status: ${response.statusCode}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Health check - Error: ${error.message}`, 'red');
        return false;
    }
}

async function testPhishingLink(baseUrl) {
    const phishingUrl = `${baseUrl}/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F`;
    
    try {
        log('Testing phishing link...', 'blue');
        const response = await makeRequest(phishingUrl);
        
        if (response.statusCode === 200) {
            log(`✅ Phishing link - Status: ${response.statusCode}`, 'green');
            log(`   Response length: ${response.data.length} characters`, 'green');
            return true;
        } else {
            log(`❌ Phishing link - Status: ${response.statusCode}`, 'red');
            return false;
        }
    } catch (error) {
        log(`❌ Phishing link - Error: ${error.message}`, 'red');
        return false;
    }
}

async function runTests(baseUrl, name) {
    log(`\n${colors.bold}Testing ${name} (${baseUrl})${colors.reset}`, 'blue');
    log('='.repeat(50), 'blue');
    
    const results = {
        health: await testHealthCheck(baseUrl),
        endpoints: {},
        phishing: await testPhishingLink(baseUrl)
    };
    
    // Test individual endpoints
    for (const endpoint of TEST_CONFIG.endpoints) {
        results.endpoints[endpoint] = await testEndpoint(baseUrl, endpoint);
    }
    
    return results;
}

function printSummary(results) {
    log('\n' + '='.repeat(50), 'blue');
    log('TEST SUMMARY', 'bold');
    log('='.repeat(50), 'blue');
    
    for (const [environment, result] of Object.entries(results)) {
        log(`\n${environment.toUpperCase()}:`, 'bold');
        
        const passed = Object.values(result).filter(r => r === true).length;
        const total = Object.keys(result).length;
        
        log(`Health Check: ${result.health ? '✅' : '❌'}`);
        log(`Phishing Link: ${result.phishing ? '✅' : '❌'}`);
        
        log('Endpoints:');
        for (const [endpoint, success] of Object.entries(result.endpoints)) {
            log(`  ${endpoint}: ${success ? '✅' : '❌'}`);
        }
        
        log(`Overall: ${passed}/${total} tests passed`, passed === total ? 'green' : 'red');
    }
}

async function main() {
    log('🚀 EvilWorker Render Deployment Test', 'bold');
    log('====================================', 'bold');
    
    const results = {};
    
    // Test localhost if available
    try {
        results.localhost = await runTests(TEST_CONFIG.localhost, 'Localhost');
    } catch (error) {
        log(`⚠️  Localhost not available: ${error.message}`, 'yellow');
    }
    
    // Test Render deployment
    if (TEST_CONFIG.renderUrl !== 'https://your-service-name.onrender.com') {
        results.render = await runTests(TEST_CONFIG.renderUrl, 'Render');
    } else {
        log('\n⚠️  Set RENDER_URL environment variable to test Render deployment', 'yellow');
        log('   Example: RENDER_URL=https://your-service.onrender.com node test_render.js', 'yellow');
    }
    
    printSummary(results);
    
    // Exit with appropriate code
    const allPassed = Object.values(results).every(result => 
        Object.values(result).every(r => r === true)
    );
    
    process.exit(allPassed ? 0 : 1);
}

// Handle command line arguments
if (process.argv.includes('--help') || process.argv.includes('-h')) {
    log('EvilWorker Render Deployment Test', 'bold');
    log('');
    log('Usage: node test_render.js [options]', 'blue');
    log('');
    log('Options:', 'blue');
    log('  --help, -h     Show this help message', 'blue');
    log('  --local        Test only localhost', 'blue');
    log('  --render       Test only Render deployment', 'blue');
    log('');
    log('Environment Variables:', 'blue');
    log('  RENDER_URL     URL of your Render deployment', 'blue');
    log('');
    process.exit(0);
}

// Run tests
main().catch(error => {
    log(`❌ Test failed: ${error.message}`, 'red');
    process.exit(1);
});
