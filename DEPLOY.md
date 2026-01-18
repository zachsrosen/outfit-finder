# Deploying Outfit Finder

## Quick Deploy to Vercel (5 minutes)

### Step 1: Get your API keys

1. **Claude API Key** (required)
   - Go to https://console.anthropic.com
   - Sign up or log in
   - Go to API Keys and create one
   - Copy the key (starts with `sk-ant-`)

2. **SerpAPI Key** (optional but recommended for real products)
   - Go to https://serpapi.com
   - Sign up for free (100 searches/month free)
   - Copy your API key from the dashboard

### Step 2: Deploy to Vercel

**Option A: Using the Vercel CLI (recommended)**

```bash
# Install Vercel CLI if you haven't
npm install -g vercel

# Navigate to the project folder
cd /Users/zach/Downloads/outfit-finder

# Deploy
vercel

# Follow the prompts:
# - Link to existing project? No
# - What's your project name? outfit-finder (or anything you like)
# - Which directory? ./ (current directory)
# - Override settings? No
```

After deploying, add your environment variables:

```bash
vercel env add ANTHROPIC_API_KEY
# Paste your Claude API key when prompted

vercel env add SERPAPI_KEY
# Paste your SerpAPI key when prompted

# Redeploy to pick up the new environment variables
vercel --prod
```

**Option B: Using the Vercel Dashboard**

1. Go to https://vercel.com and sign up/log in
2. Click "Add New Project"
3. Choose "Import Git Repository" or drag the `outfit-finder` folder
4. Before deploying, add Environment Variables:
   - `ANTHROPIC_API_KEY` = your Claude API key
   - `SERPAPI_KEY` = your SerpAPI key
5. Click Deploy

### Step 3: Share the link

Once deployed, you'll get a URL like:
- `https://outfit-finder.vercel.app`
- or `https://outfit-finder-yourusername.vercel.app`

Send this link to your girlfriend - she can use it instantly on any device!

## Customization Ideas

- Change the app name in `index.html`
- Modify the color scheme in `styles.css` (look for `--primary-color`)
- Add more quick style chips in `index.html`
- Add more coupon codes in `api/search.js`

## Costs

- **Vercel hosting**: Free (hobby tier)
- **Claude API**: ~$0.01-0.03 per outfit search
- **SerpAPI**: 100 free searches/month, then $50/month

For personal use, you'll likely stay well within free tiers!
