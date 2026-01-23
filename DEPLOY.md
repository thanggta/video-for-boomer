# Deploy to Render

## Quick Setup

1. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

2. **Deploy**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect `render.yaml`
   - Click "Apply" → "Create Web Service"

3. **Wait for Build**
   - First build: ~5-10 minutes
   - You'll get a URL like: `https://ghepvideo.onrender.com`

## Manual Setup (if auto-detect fails)

- **Environment**: Docker
- **Build Command**: (leave empty)
- **Start Command**: (leave empty)
- **Plan**: Free

## Important Notes

### Cold Starts
- Free tier spins down after 15 minutes of inactivity
- First request after idle: 30-60 seconds wake time
- **Solution**: Add to UptimeRobot to ping every 14 minutes (keeps it warm)

### Timeout Warning
- Your `/api/youtube/download` has `maxDuration: 120` seconds
- Render free tier: works but may be slow for large videos
- If timeouts occur, consider upgrading to Starter plan ($7/month)

## Testing Locally with Docker

```bash
# Build the Docker image
docker build -t ghepvideo .

# Run the container
docker run -p 3000:3000 ghepvideo

# Open http://localhost:3000
```

## Troubleshooting

### "Python not found"
- Check Render logs
- Verify Dockerfile installed Python correctly

### "Build failed"
- Check if all dependencies in package.json are valid
- Verify Node.js version compatibility

### "502 Bad Gateway"
- Service is starting (cold start)
- Wait 30-60 seconds and refresh
