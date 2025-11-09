# Vehicle Valuation Tool

A simple vehicle valuation lookup tool with a frontend and serverless API.

## Project Structure

```
/
├── index.html              # Frontend HTML
├── script.js               # Frontend JavaScript
├── style.css               # Frontend styles
├── netlify.toml            # Netlify configuration
├── package.json            # Root package.json
├── netlify/
│   └── functions/
│       └── vehicle-api.js  # Netlify serverless function (used in production)
└── vehicle-api/            # Local development API (Express) - OPTIONAL
    ├── index.js            # Only needed for local testing
    └── package.json        # Only needed for local testing
```

## Local Development

### Option 1: Using the Express server (vehicle-api)

1. Navigate to the vehicle-api folder:
   ```bash
   cd vehicle-api
   npm install
   npm start
   ```
   Server runs on `http://localhost:3010`

2. Open `index.html` in your browser via a local server:
   ```bash
   python3 -m http.server 8000
   ```
   Frontend accessible at `http://localhost:8000`

### Option 2: Using Netlify Dev (recommended for production testing)

1. Install Netlify CLI globally (if not already installed):
   ```bash
   npm install -g netlify-cli
   ```

2. Run Netlify dev:
   ```bash
   netlify dev
   ```
   This will serve both the frontend and the Netlify function locally

## Deployment to Netlify

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Connect your repository to Netlify:
   - Go to https://app.netlify.com
   - Click "Add new site" → "Import an existing project"
   - Select your Git provider and repository
   - Netlify will auto-detect the settings from `netlify.toml`

3. Deploy!
   - Netlify will automatically deploy your site
   - Your function will be available at `https://your-site.netlify.app/.netlify/functions/vehicle-api`

## How It Works

- **Local Development**: The frontend detects `localhost` and uses the Express API at `http://localhost:3010/lookup`
- **Production (Netlify)**: The frontend uses the Netlify Function at `/.netlify/functions/vehicle-api`

The API validates registration numbers (minimum 5 characters) and mileage (must be a positive number), then returns mock vehicle valuation data.

## API Endpoint

**POST** `/.netlify/functions/vehicle-api`

Request body:
```json
{
  "reg": "AB12CDE",
  "mileage": 45000
}
```

Response:
```json
{
  "make": "Ford",
  "model": "Fiesta",
  "year": 2014,
  "mileage": 45000,
  "low_price": 3000,
  "avg_price": 3500,
  "high_price": 4200
}
```

## Notes

- The `vehicle-api` folder is **OPTIONAL** - it's only for local development
- Netlify uses the serverless function in `netlify/functions/vehicle-api.js`
- The Netlify function has NO dependencies (pure Node.js)
- The Express server in `vehicle-api/` requires dependencies (Express, CORS)
- **You can delete the `vehicle-api` folder if you don't need local testing**

