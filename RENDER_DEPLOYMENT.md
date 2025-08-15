# 🚀 EvilWorker Deployment on Render

This guide will help you deploy the EvilWorker framework on Render's PaaS platform.

## 📋 Prerequisites

- A Render account (free tier available)
- Git repository with your EvilWorker code
- Basic understanding of Docker and web services

## 🔧 Quick Deployment

### 1. Automated Deployment
```bash
chmod +x deploy.sh
./deploy.sh
```

### 2. Manual Steps

#### Step 1: Prepare Repository
Ensure these files are present:
- `proxy_server.js` - Main server file
- `package.json` - Node.js configuration
- `Dockerfile` - Container configuration
- `render.yaml` - Render deployment config
- `config.js` - Framework configuration

#### Step 2: Push to GitHub
```bash
git add .
git commit -m "Prepare for Render deployment"
git push origin main
```

#### Step 3: Deploy on Render
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub repository
4. Render will automatically deploy using `render.yaml`

## ⚙️ Environment Variables

**Automatic (set by Render):**
- `PORT` - Service port
- `NODE_ENV` - Production environment

**Optional (configure in Render dashboard):**
- `ENABLE_CREDENTIAL_REDIRECT=true`
- `CREDENTIALS_REDIRECT_URL=https://login.microsoftonline.com/`
- `REDIRECT_DELAY=1000`

## 🌐 Access Your Framework

**URL**: `https://your-service-name.onrender.com`

**Health Check**: `https://your-service-name.onrender.com/health`

## 🔗 Phishing Link Format

```
https://your-service-name.onrender.com/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F
```

## 🔒 Security Configuration

### 1. Change Default Values
Modify in `proxy_server.js`:
```javascript
const ENCRYPTION_KEY = "Your-Custom-Key";
const PROXY_ENTRY_POINT = "/your-custom-entry";
const PHISHED_URL_PARAMETER = "your-custom-param";
```

### 2. Update File Names
```javascript
const PROXY_FILES = {
    index: "your-custom-index.html",
    notFound: "your-custom-404.html",
    script: "your-custom-script.js"
};
```

## 🔍 Monitoring

### Render Dashboard
- Build logs during deployment
- Runtime logs in "Logs" tab
- Health checks and metrics
- Service status monitoring

### Health Check
```bash
curl https://your-service-name.onrender.com/health
```

## 🚨 Troubleshooting

### Common Issues

**Build Failures**
- Check Node.js version (>=22.15.0)
- Validate Dockerfile locally
- Review build logs

**Service Unavailable**
- Verify health check path: `/health`
- Check port configuration: `PORT=3000`
- Review runtime logs

**Memory Issues**
- Upgrade to higher plan if needed
- Monitor memory usage
- Optimize application

### Debug Commands
```bash
# Test locally
npm start

# Check health
curl http://localhost:3000/health

# Test phishing link
curl "http://localhost:3000/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F"
```

## 🔄 Updates

```bash
git add .
git commit -m "Update configuration"
git push origin main
# Render auto-deploys
```

## 🚨 Legal Considerations

- **Authorized Use Only**: Only against authorized targets
- **Red Teaming**: For legitimate security testing
- **Compliance**: Follow local laws and regulations
- **Documentation**: Keep testing records

## 📞 Support

- **Render**: [render.com/docs](https://render.com/docs)
- **EvilWorker**: [github.com/Ahaz1701/EvilWorker](https://github.com/Ahaz1701/EvilWorker)

---

**Happy Deploying! 🎯**
