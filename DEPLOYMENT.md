# Kantongin Local Testing Setup

## Local Testing Instructions

### 1. Setup Environment
```bash
./start-local.sh
```

### 2. Access Application
Open browser to: http://localhost:8080

### 3. Test Features
- Login with Google account
- Add income/expense transactions
- View statistics and charts
- Test export CSV functionality
- Check PWA install prompt
- Test offline mode (toggle network)

### 4. Debugging
Open Browser DevTools → Console tab for JavaScript errors

## File Structure
- `index.html` - Main application
- `js/` - JavaScript code
- `css/` - Stylesheet
- `icons/` - Icon assets
- `.env` - Supabase configuration

## Start Local Server
Run `./start-local.sh` to start local development
