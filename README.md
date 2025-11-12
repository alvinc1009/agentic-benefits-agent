# AgenticED Benefits Auto-Fill Parent Agent

🚀 **[Live Demo](https://benefits-agent.netlify.app)** | 📚 **[Quick Start](./QUICKSTART.md)** | 🎯 **[Deployment Guide](./DEPLOYMENT.md)**

AI-powered benefits discovery agent that proactively identifies eligible programs for families experiencing life changes. Built with Anthropic's Claude API and Model Context Protocol (MCP).

## Overview

**The Problem:** Low-income families miss out on $24 billion in unclaimed federal benefits annually because they don't know programs exist, can't navigate bureaucratic processes, or give up on lengthy applications.

**The Solution:** An AI agent that automatically detects household changes (job loss, income reduction), scans all available benefit programs, calculates exact eligibility, pre-fills applications, and guides families through a 15-minute review process.

## Demo Scenario

**Maria Santos** - Recently divorced single mother in Boston
- Lost retail manager job at Target (September 2024)
- Two children: Sofia (15) and Miguel (12)
- Income dropped from $4,333 → $2,400/month (unemployment)
- Rent: $1,800/month in Dorchester

**Agent Discovery:**
- ✅ Automatically detected unemployment status change
- ✅ Scanned 47 benefit programs across federal, state, city, education
- ✅ Found 14 programs worth **$58,980 annually**
- ✅ Pre-filled all applications
- ✅ Sent proactive notification: "We found benefits for you!"

## Key Features

### 🔍 Proactive Detection
Agent monitors household data for triggering events like employment status changes, income reductions, family composition changes, and address changes.

### 🎯 Comprehensive Scanning
Automatically scans programs across Federal (SNAP, WIC, Medicaid, Section 8), State (TAFDC, Fuel Assistance), City (Summer Youth Jobs), and Education (Workforce Development, Community College).

### 💡 Intelligent Eligibility
Real-time calculations using Federal Poverty Level formulas, Area Median Income for Boston, household-specific factors, and age-based requirements.

### 📝 Application Pre-Fill
Automatically populates applications with demographics, tax data, previous applications, and family documents. Highlights only fields requiring attention.

### 🌎 Bilingual Support
Full English/Spanish interface with cultural adaptation, SMS/email/voice notifications, accessible to families without smartphones.

### 🔍 Transparent AI
Real-time visibility into which tools Claude calls, input parameters, results returned, and how decisions are made. Complete audit trail for compliance.

## Quick Start

```bash
# Clone and setup
git clone https://github.com/YOUR_USERNAME/agenticed-benefits-agent.git
cd agenticed-benefits-agent
npm install

# Configure
cp .env.example .env
# Add ANTHROPIC_API_KEY to .env

# Run
npm start
open frontend.html
```

See [QUICKSTART.md](./QUICKSTART.md) for detailed instructions.

## Deployment

Deploy to Render (backend) + Netlify (frontend) - see [DEPLOYMENT.md](./DEPLOYMENT.md)

**Estimated cost:** $7-10/month for production demo setup

## Value Proposition

- **Foundations:** $90 investment → $8,000+ benefits secured per family
- **Cities:** Increased federal benefit enrollment → increased city funding
- **Districts:** Fed, housed, healthy families → kids ready to learn  
- **Families:** Access to guidance previously only for wealthy families

## Tech Stack

Node.js, Express, Anthropic SDK, React, Tailwind CSS, Claude Sonnet 4.5

## License

Proprietary - AgenticED Platform  
Copyright © 2024 AgenticED. All rights reserved.

**[Launch Demo →](https://benefits-agent.netlify.app)**
