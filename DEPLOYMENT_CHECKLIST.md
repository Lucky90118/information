# 🚀 EvilWorker Render Deployment Checklist

This checklist ensures successful deployment of EvilWorker on Render.

## 📋 Pre-Deployment Checklist

### ✅ Repository Setup
- [ ] All required files are present:
  - [ ] `proxy_server.js` - Main server file
  - [ ] `package.json` - Node.js configuration
  - [ ] `Dockerfile` - Container configuration
  - [ ] `render.yaml` - Render deployment config
  - [ ] `config.js` - Framework configuration
  - [ ] All HTML/JS framework files

- [ ] Git repository is initialized
- [ ] Code is committed and pushed to GitHub
- [ ] Repository is public or Render has access

### ✅ Security Configuration
- [ ] Encryption key changed in `proxy_server.js`
- [ ] Custom entry point configured
- [ ] Custom file names updated
- [ ] Environment variables configured
- [ ] Security headers reviewed

### ✅ Local Testing
- [ ] Application runs locally (`npm start`)
- [ ] Health check endpoint responds (`/health`)
- [ ] Phishing link works correctly
- [ ] All endpoints accessible
- [ ] No critical errors in logs

## 🚀 Deployment Steps

### ✅ Render Setup
- [ ] Render account created
- [ ] GitHub repository connected
- [ ] Blueprint deployment selected
- [ ] Service name configured
- [ ] Region selected (Oregon recommended)

### ✅ Environment Configuration
- [ ] `NODE_ENV=production` (automatic)
- [ ] `PORT=3000` (automatic)
- [ ] `ENABLE_CREDENTIAL_REDIRECT=true` (optional)
- [ ] `CREDENTIALS_REDIRECT_URL` configured (optional)
- [ ] `REDIRECT_DELAY=1000` (optional)

### ✅ Build and Deploy
- [ ] Build process started
- [ ] Docker image built successfully
- [ ] Container deployed
- [ ] Health checks passing
- [ ] Service status: "Live"

## 🔍 Post-Deployment Verification

### ✅ Service Health
- [ ] Service is accessible via Render URL
- [ ] Health check endpoint responds: `/health`
- [ ] Debug endpoint accessible: `/debug`
- [ ] Session debug endpoint works: `/session-debug`
- [ ] No build errors in logs

### ✅ Functionality Testing
- [ ] Phishing link format works:
  ```
  https://your-service.onrender.com/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F
  ```
- [ ] Service worker loads correctly
- [ ] JavaScript injection works
- [ ] Cookie capture functional
- [ ] Credential logging active

### ✅ Security Verification
- [ ] HTTPS/SSL certificate active
- [ ] Security headers configured
- [ ] Non-root user in container
- [ ] File permissions correct
- [ ] Encryption working

### ✅ Performance Testing
- [ ] Response times acceptable (< 2s)
- [ ] Memory usage within limits
- [ ] CPU usage normal
- [ ] No timeout errors
- [ ] Concurrent requests handled

## 🧪 Automated Testing

### ✅ Run Test Script
```bash
# Test local deployment
node test_render.js

# Test Render deployment
RENDER_URL=https://your-service.onrender.com node test_render.js
```

- [ ] All local tests pass
- [ ] All Render tests pass
- [ ] Health check validates
- [ ] Phishing link functional
- [ ] Endpoints accessible

## 📊 Monitoring Setup

### ✅ Render Dashboard
- [ ] Logs accessible
- [ ] Metrics visible
- [ ] Health status monitored
- [ ] Alerts configured (optional)
- [ ] Uptime tracking

### ✅ Application Monitoring
- [ ] Session logging active
- [ ] Credential capture working
- [ ] Error logging functional
- [ ] Performance metrics available
- [ ] Data encryption verified

## 🔧 Troubleshooting

### ❌ Common Issues
- [ ] Build failures → Check Node.js version (>=22.15.0)
- [ ] Service unavailable → Verify health check path
- [ ] Memory issues → Upgrade plan if needed
- [ ] SSL errors → Check certificate configuration
- [ ] Timeout errors → Review request handling

### ✅ Resolution Steps
- [ ] Check Render logs for errors
- [ ] Verify environment variables
- [ ] Test locally first
- [ ] Review Dockerfile configuration
- [ ] Contact Render support if needed

## 🔒 Security Final Check

### ✅ Production Security
- [ ] Default values changed
- [ ] Encryption key secure
- [ ] Access logs monitored
- [ ] Data retention configured
- [ ] Legal compliance verified

### ✅ Operational Security
- [ ] Authorized use only
- [ ] Red teaming scope defined
- [ ] Documentation complete
- [ ] Incident response plan ready
- [ ] Regular security reviews scheduled

## 📈 Optimization

### ✅ Performance
- [ ] Response times optimized
- [ ] Resource usage efficient
- [ ] Caching configured (if needed)
- [ ] CDN setup (optional)
- [ ] Load balancing (if required)

### ✅ Scalability
- [ ] Auto-scaling configured (if needed)
- [ ] Resource limits appropriate
- [ ] Backup strategy in place
- [ ] Disaster recovery plan
- [ ] Monitoring alerts set

## 🎯 Final Verification

### ✅ Complete System Test
- [ ] End-to-end phishing simulation
- [ ] Credential capture verification
- [ ] Data logging validation
- [ ] Redirect functionality test
- [ ] Session management test

### ✅ Documentation
- [ ] Deployment guide updated
- [ ] Configuration documented
- [ ] Troubleshooting guide ready
- [ ] Security procedures documented
- [ ] Maintenance schedule created

---

## 🚨 Emergency Contacts

- **Render Support**: [render.com/support](https://render.com/support)
- **EvilWorker Issues**: [GitHub Issues](https://github.com/Ahaz1701/EvilWorker/issues)
- **Security Incidents**: Follow your organization's incident response plan

---

**✅ Deployment Complete!**

Your EvilWorker framework is now successfully deployed on Render and ready for authorized security testing.

**Remember**: Only use against authorized targets and maintain proper documentation of all testing activities.
