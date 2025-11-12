# Deployment Instructions

## Step 1: Push to GitHub

```bash
cd benefits-agent-mcp
git init
git add .
git commit -m "Initial commit: Benefits Auto-Fill Parent Agent with MCP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agenticed-benefits-agent.git
git push -u origin main
```

## Step 2: Deploy MCP Server to Render

### Option A: Via Render Dashboard (Recommended)

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `agenticed-benefits-agent`
4. Configure:
   - **Name**: `agenticed-benefits-mcp`
   - **Environment**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free (for testing) or Starter ($7/mo for always-on)

5. **Environment Variables** - Click "Environment" tab and add:
   ```
   ANTHROPIC_API_KEY=sk-ant-api03-your-key-here
   NODE_ENV=production
   ```

6. Click **"Create Web Service"**

7. Wait for deployment (2-3 minutes)

8. You'll get a URL like: `https://agenticed-benefits-mcp.onrender.com`

### Option B: Via render.yaml (Auto-deploy)

If you add `render.yaml` to your repo (included below), Render will auto-configure:

```yaml
services:
  - type: web
    name: agenticed-benefits-mcp
    env: node
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: ANTHROPIC_API_KEY
        sync: false  # You'll add this manually in dashboard
```

### Test Your Backend

Once deployed, test it:
```bash
curl https://agenticed-benefits-mcp.onrender.com/health
```

Should return:
```json
{
  "status": "healthy",
  "service": "AgenticED Benefits Agent MCP Server",
  "version": "1.0.0"
}
```

## Step 3: Deploy Frontend to Netlify

### Update Frontend API URL

Before deploying, you need to update `frontend.html` to use your Render URL.

Find this line (around line 16):
```javascript
const API_BASE_URL = 'http://localhost:3002';
```

Change to:
```javascript
const API_BASE_URL = 'https://agenticed-benefits-mcp.onrender.com';
```

### Deploy to Netlify

#### Option A: Drag & Drop (Quickest)

1. Go to https://app.netlify.com/
2. Drag the entire `benefits-agent-mcp` folder onto the Netlify dashboard
3. Netlify will deploy immediately
4. You'll get a URL like: `https://random-name-12345.netlify.app`
5. Rename to: `https://benefits-agent.netlify.app` (or similar)

#### Option B: Connect to GitHub (Better for updates)

1. Go to https://app.netlify.com/
2. Click **"Add new site"** → **"Import an existing project"**
3. Choose **GitHub** and select your `agenticed-benefits-agent` repository
4. Configure:
   - **Build command**: (leave empty - it's just HTML)
   - **Publish directory**: `.` (root directory)
5. Click **"Deploy site"**

#### Option C: Netlify CLI

```bash
# Install Netlify CLI
npm install -g netlify-cli

# Login
netlify login

# Deploy
cd benefits-agent-mcp
netlify deploy --prod

# Follow prompts:
# - Create new site
# - Choose team
# - Site name: benefits-agent
# - Publish directory: . (current directory)
```

### Configure Custom Domain (Optional)

If you want `benefits.agenticed.com`:

1. In Netlify dashboard, go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Add your domain and follow DNS instructions

## Step 4: Test the Full Stack

1. Open your Netlify URL: `https://benefits-agent.netlify.app`
2. Should see the notification landing page
3. Click "Talk to Agent"
4. Type a message - should get AI response
5. Check sidebar for tool calls

### Troubleshooting

**CORS Issues:**
If you get CORS errors, make sure your Render backend has CORS enabled (already configured in `server.js`).

**API Connection Failed:**
- Check that Render service is running (not sleeping on free tier)
- Verify API_BASE_URL in frontend matches your Render URL exactly
- Check browser console for specific error messages

**Render Free Tier Sleeping:**
Free tier services sleep after 15 minutes of inactivity. First request will be slow (30 seconds) while it wakes up. Upgrade to Starter ($7/mo) for always-on.

## URLs for Your Demo

Once deployed, you'll have:

- **Frontend (Netlify)**: `https://benefits-agent.netlify.app`
- **Backend (Render)**: `https://agenticed-benefits-mcp.onrender.com`
- **Health Check**: `https://agenticed-benefits-mcp.onrender.com/health`
- **GitHub Repo**: `https://github.com/YOUR_USERNAME/agenticed-benefits-agent`

## Updating After Changes

### Backend (Render):
```bash
git add .
git commit -m "Update benefits logic"
git push origin main
# Render auto-deploys in 2-3 minutes
```

### Frontend (Netlify):
```bash
# Update frontend.html
git add frontend.html
git commit -m "Update UI"
git push origin main
# Netlify auto-deploys in 30 seconds
```

## Environment Variables Security

**IMPORTANT:** Never commit `.env` file to GitHub!

Your `.gitignore` already excludes it, but double-check:
```bash
git status
# Should NOT see .env in the list
```

Add secrets in Render dashboard only.

## Cost Estimate

- **Render Free Tier**: $0 (but services sleep)
- **Render Starter**: $7/month (always-on, recommended for demos)
- **Netlify Free Tier**: $0 (100GB bandwidth/month - plenty for demos)
- **Anthropic API**: Pay-as-you-go (~$0.003 per conversation)

**Total for production demo setup: $7-10/month**

## Next Steps

1. Push to GitHub
2. Deploy backend to Render
3. Get your Render URL
4. Update frontend.html with Render URL
5. Deploy frontend to Netlify
6. Test end-to-end
7. Share Netlify URL with investors

## Support

Issues deploying? Check:
- Render deployment logs
- Netlify deployment logs
- Browser console (F12)
- Network tab (F12) for API calls

For help: alvin@agenticed.com
