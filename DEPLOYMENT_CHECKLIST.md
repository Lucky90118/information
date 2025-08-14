# ✅ EvilWorker Render Deployment Checklist

## 🚀 Pre-Deployment Setup

- [ ] **Repository Preparation**
  - [ ] All files are committed to git
  - [ ] Repository is pushed to GitHub/GitLab
  - [ ] Repository is public or Render has access

- [ ] **Configuration Files Created**
  - [ ] `package.json` ✅
  - [ ] `Dockerfile` ✅
  - [ ] `render.yaml` ✅
  - [ ] `.dockerignore` ✅
  - [ ] `.gitignore` ✅

- [ ] **Code Modifications**
  - [ ] Health check endpoint added ✅
  - [ ] Windows filename compatibility fixed ✅
  - [ ] Server uses `process.env.PORT` ✅

## 🔧 Render Deployment Steps

- [ ] **Create Render Account**
  - [ ] Sign up at [render.com](https://render.com)
  - [ ] Verify email address
  - [ ] Set up payment method (free tier available)

- [ ] **Deploy Service**
  - [ ] Go to [Render Dashboard](https://dashboard.render.com)
  - [ ] Click "New +" button
  - [ ] Select "Blueprint" option
  - [ ] Connect your GitHub/GitLab repository
  - [ ] Render will auto-detect `render.yaml`

- [ ] **Monitor Deployment**
  - [ ] Watch build logs for any errors
  - [ ] Verify service starts successfully
  - [ ] Check health check endpoint responds
  - [ ] Note your service URL

## 🌐 Post-Deployment Verification

- [ ] **Service Health**
  - [ ] Health check endpoint responds: `https://your-service.onrender.com/`
  - [ ] Service shows as "Live" in dashboard
  - [ ] No error logs in service logs

- [ ] **Framework Testing**
  - [ ] Phishing endpoint responds: `https://your-service.onrender.com/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F`
  - [ ] Service worker file accessible
  - [ ] Proxy functionality working

- [ ] **Security Configuration**
  - [ ] Change default encryption key in `proxy_server.js`
  - [ ] Update file names and paths in configuration
  - [ ] Modify proxy entry point if desired

## 🔗 Your Deployment URLs

After successful deployment, your EvilWorker will be available at:

**Base URL**: `https://your-service-name.onrender.com`

**Health Check**: `https://your-service-name.onrender.com/`

**Phishing Entry**: `https://your-service-name.onrender.com/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F`

## ⚠️ Important Notes

- **Free Tier Limitations**: Render free tier has cold starts and limited bandwidth
- **Service Suspension**: Free services suspend after 15 minutes of inactivity
- **Custom Domain**: Consider upgrading to paid plan for custom domains
- **Monitoring**: Check Render dashboard regularly for service status

## 🆘 Troubleshooting

### Common Issues:

1. **Build Failures**
   - Check Node.js version compatibility (>=22.15.0)
   - Verify all files are committed and pushed
   - Check build logs for specific errors

2. **Service Won't Start**
   - Verify `process.env.PORT` is used in code
   - Check service logs for startup errors
   - Ensure health check endpoint responds

3. **Phishing Not Working**
   - Verify service worker registration
   - Check proxy server logs
   - Test with different target URLs

### Support Resources:

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **EvilWorker Issues**: [GitHub Issues](https://github.com/Ahaz1701/EvilWorker/issues)
- **Community Support**: Check original repository for help

---

**🎯 Deployment Status**: Ready for Render! 🚀
