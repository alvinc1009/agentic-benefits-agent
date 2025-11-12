# Deployment Checklist

## Prerequisites
- [ ] GitHub account
- [ ] Render account (render.com)
- [ ] Netlify account (netlify.com)
- [ ] Anthropic API key (console.anthropic.com)

## Step 1: GitHub
- [ ] Create new repository: `agenticed-benefits-agent`
- [ ] Run commands:
```bash
cd benefits-agent-mcp
git init
git add .
git commit -m "Initial commit: Benefits Agent with MCP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/agenticed-benefits-agent.git
git push -u origin main
```

## Step 2: Render (Backend)
- [ ] Go to render.com/dashboard
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repo: `agenticed-benefits-agent`
- [ ] Configure:
  - Name: `agenticed-benefits-mcp`
  - Environment: Node
  - Build: `npm install`
  - Start: `npm start`
  - Plan: Free or Starter ($7/mo)
- [ ] Add environment variables:
  - `ANTHROPIC_API_KEY` = your-key-here
  - `NODE_ENV` = production
- [ ] Deploy and wait 2-3 minutes
- [ ] Copy your Render URL: `https://agenticed-benefits-mcp.onrender.com`
- [ ] Test: `curl https://YOUR-URL.onrender.com/health`

## Step 3: Update Frontend
- [ ] Edit `frontend.html` line 18
- [ ] Change Render URL:
```javascript
: 'https://agenticed-benefits-mcp.onrender.com';  // YOUR actual Render URL
```
- [ ] Commit change:
```bash
git add frontend.html
git commit -m "Update API URL for production"
git push origin main
```

## Step 4: Netlify (Frontend)
- [ ] Go to app.netlify.com
- [ ] Click "Add new site" → "Import from Git"
- [ ] Choose GitHub and select `agenticed-benefits-agent`
- [ ] Configure:
  - Build command: (leave empty)
  - Publish directory: `.` (root)
- [ ] Deploy
- [ ] Get your URL: `https://random-name.netlify.app`
- [ ] (Optional) Change site name in settings to `benefits-agent`

## Step 5: Test End-to-End
- [ ] Open Netlify URL
- [ ] Should see landing page with "14 programs, $58,980"
- [ ] Click "Launch Demo"
- [ ] Click "Talk to Agent"
- [ ] Type: "Tell me what benefits you discovered"
- [ ] Should get AI response with tool calls in sidebar
- [ ] Toggle to Spanish - should translate
- [ ] Check browser console (F12) for errors

## Troubleshooting

**CORS Error:**
- Check frontend has correct Render URL
- Verify Render service is running (not sleeping)

**No AI Response:**
- Check Render logs for errors
- Verify ANTHROPIC_API_KEY is set correctly
- Check Render service is awake (free tier sleeps)

**Tool Calls Not Showing:**
- Check browser console for JavaScript errors
- Verify API response includes toolCalls array

## Share with Investors

Your demo URLs:
- **Landing Page:** https://benefits-agent.netlify.app
- **Backend API:** https://agenticed-benefits-mcp.onrender.com/health
- **GitHub Repo:** https://github.com/YOUR_USERNAME/agenticed-benefits-agent

## Next: On-Track to Graduate Agent

Once this is deployed and working, we'll build the next agent following the same pattern!
