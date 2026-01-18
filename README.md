# 1TamilMV Telegram Bot

A Node.js Telegram bot that monitors [1TamilMV](https://www.1tamilmv.haus/) for new Tamil movie releases and automatically sends detailed updates with download links to your Telegram channel or chat.

## Features

- 🎬 **Automatic Monitoring**: Checks for new releases every 2 hours
- 📸 **Rich Messages**: Sends movie posters with detailed information
- 📥 **Multiple Quality Options**: 4K, 1080p, 720p, and more
- 🔗 **Download Links**: Both torrent magnet links and direct downloads
- 🚫 **No Duplicates**: Tracks seen films to prevent repeat notifications
- ⚡ **Manual Trigger**: Use `/latest` command to check immediately
- 🎯 **Detailed Metadata**: Language, subtitles, codec, audio info
- 🌐 **Dual Mode**: Webhooks for production (Render), polling for local dev
- 🚀 **Cloud Ready**: Easy deployment to Render.com free tier

## Screenshots

Each film is sent as a separate message with:
- Movie poster/thumbnail
- Title and year
- Language and subtitle information
- All available resolutions with:
  - File size
  - Codec (HEVC x265, AVC x264, etc.)
  - Audio information (DD+5.1, AAC, etc.)
  - Torrent magnet link
  - Direct download link

## Prerequisites

- Node.js 18 or higher
- A Telegram bot token (from [@BotFather](https://t.me/botfather))
- A Telegram chat ID (channel or group where updates will be sent)

## Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd 1TamilMvTelegramBot
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file from the example:
```bash
cp .env.example .env
```

4. Configure your `.env` file:
```env
# Telegram Configuration
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# Server Configuration (optional - for webhook mode)
# WEBHOOK_URL=https://your-app.onrender.com
# PORT=3000

# Scraper Configuration
TARGET_URL=https://www.1tamilmv.haus/
LISTING_URL=https://www.1tamilmv.haus/index.php?/forums/forum/9-tamil-language/
MAX_FILMS=20
SCRAPE_TIMEOUT=30000

# Scheduler Configuration
ENABLE_SCHEDULER=true
CRON_SCHEDULE=0 */2 * * *

# Storage Configuration
DATA_PATH=./data/seen_films.json
MAX_TRACKED_FILMS=500
```

**Note**: Leave `WEBHOOK_URL` empty for local development (uses polling mode). Set it for production deployment (uses webhook mode).

## Getting Telegram Credentials

### Bot Token
1. Open Telegram and search for [@BotFather](https://t.me/botfather)
2. Send `/newbot` and follow the instructions
3. Copy the bot token provided

### Chat ID
To send to a channel:
1. Create a channel or use an existing one
2. Add your bot as an administrator
3. Get the chat ID using [@userinfobot](https://t.me/userinfobot) or other methods
4. For channels, the ID will be in format `-100xxxxxxxxxx`

To send to a group:
1. Add your bot to the group
2. Get the group chat ID (use [@userinfobot](https://t.me/userinfobot))

## Usage

### Local Development (Polling Mode)
```bash
npm start
```

The bot will:
1. Initialize and connect to Telegram in **polling mode** (no WEBHOOK_URL set)
2. Start monitoring 1TamilMV automatically
3. Send updates when new films are found

### Development mode (with auto-reload)
```bash
npm run dev
```

### Production Deployment (Webhook Mode)
When `WEBHOOK_URL` is set, the bot automatically switches to webhook mode:
- Starts an Express HTTP server
- Registers webhook with Telegram
- Provides `/health` endpoint for monitoring
- Ideal for cloud platforms like Render.com

## Bot Commands

- `/start` - Welcome message and bot information
- `/latest` - Manually check for new films immediately
- `/help` - Show help message with bot features

## Configuration

### Scheduler Settings

The bot checks for new films based on the `CRON_SCHEDULE` setting:

- `0 */2 * * *` - Every 2 hours (default)
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `*/30 * * * *` - Every 30 minutes

Set `ENABLE_SCHEDULER=false` to disable automatic checks (manual `/latest` only).

### Scraper Settings

- `MAX_FILMS`: Maximum number of films to fetch from listing page (default: 20)
- `SCRAPE_TIMEOUT`: Page load timeout in milliseconds (default: 30000)

### Storage Settings

- `DATA_PATH`: Path to JSON file for tracking seen films
- `MAX_TRACKED_FILMS`: Maximum number of films to keep in database (default: 500)

## Deployment

### Deploy to Render.com (Free Tier)

This bot is configured for easy deployment to Render's free tier using webhooks.

1. **Fork/Push this repository to GitHub**

2. **Create a new Web Service on Render**:
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Render will auto-detect the `render.yaml` configuration

3. **Configure Environment Variables**:
   - `TELEGRAM_BOT_TOKEN` - Your bot token from @BotFather
   - `TELEGRAM_CHAT_ID` - Your channel/chat ID
   - `WEBHOOK_URL` - Set to your Render app URL (e.g., `https://your-app.onrender.com`)
   - Other variables are pre-configured in `render.yaml`

4. **Deploy**:
   - Click "Create Web Service"
   - Render will build and deploy automatically
   - The bot will start in webhook mode

5. **Verify Deployment**:
   - Visit `https://your-app.onrender.com/health` - should return `{"status":"ok"}`
   - Check logs for "Starting in webhook mode (production)"
   - Test bot commands in Telegram: `/start`, `/help`, `/latest`

**Render Configuration**:
- Service Type: `Web Service` (not Background Worker)
- Runtime: Node.js
- Build Command: `npm install`
- Start Command: `node src/index.js`
- Plan: Free tier compatible

**Note**: Render's free tier may spin down after inactivity. The bot will automatically wake up when receiving commands or on scheduled checks.

### Deploy to Other Platforms

The bot supports both polling and webhook modes:

- **Webhook Mode** (recommended for production):
  - Set `WEBHOOK_URL` environment variable
  - Requires a publicly accessible HTTPS endpoint
  - Works on: Render, Heroku, Railway, Fly.io, etc.

- **Polling Mode** (for local/VPS):
  - Leave `WEBHOOK_URL` empty
  - Works on any server (local, VPS, cloud VM)
  - No public URL required

## Project Structure

```
1TamilMvTelegramBot/
├── config/
│   └── config.js              # Configuration loader
├── src/
│   ├── index.js               # Main entry point
│   ├── bot/
│   │   ├── bot.js             # Grammy bot initialization
│   │   └── commands/          # Bot commands
│   │       ├── start.js
│   │       ├── latest.js
│   │       └── help.js
│   ├── scraper/
│   │   ├── browser.js         # Puppeteer browser manager
│   │   ├── listingScraper.js  # Listing page scraper
│   │   ├── detailScraper.js   # Detail page scraper
│   │   └── parser.js          # Data extraction/parsing
│   ├── storage/
│   │   ├── database.js        # JSON file operations
│   │   └── filmTracker.js     # Duplicate detection
│   ├── scheduler/
│   │   └── scheduler.js       # Cron job scheduling
│   ├── formatters/
│   │   └── messageFormatter.js # Telegram message formatting
│   └── utils/
│       └── logger.js          # Logging utility
└── data/
    └── seen_films.json        # Persistent storage (auto-generated)
```

## How It Works

### Bot Architecture

The bot operates in two modes:
- **Polling Mode** (Local Development): Actively polls Telegram for updates
- **Webhook Mode** (Production): Telegram sends updates to your HTTP endpoint

Mode is automatically selected based on `WEBHOOK_URL` configuration.

### Film Update Workflow

1. **Listing Scan**: The bot scrapes the 1TamilMV forum listing page for the latest 20 film topics
2. **Duplicate Filter**: Compares found films against the local database to identify new releases
3. **Detail Scraping**: For each new film, visits the detail page to extract:
   - Movie poster
   - Title and year
   - Language and subtitles
   - All available quality options
   - Download links (magnet + direct)
4. **Message Sending**: Sends each film as a separate Telegram message with photo and formatted caption
5. **Database Update**: Marks sent films as seen to prevent duplicates

### Triggering Updates

- **Automatic**: Cron scheduler runs every 2 hours (configurable)
- **Manual**: Use `/latest` command in Telegram
- Both use the same workflow function for consistency

## Error Handling

The bot handles various error scenarios gracefully:

- **Website down**: Logs error, continues on next scheduled check
- **Detail page timeout**: Skips film, continues with others
- **Missing download links**: Skips film with warning
- **Telegram rate limit**: Adds delays between messages
- **Parse errors**: Logs issue, continues with valid data

## Dependencies

- [grammy](https://grammy.dev/) - Modern Telegram Bot framework
- [puppeteer](https://pptr.dev/) - Headless browser for web scraping
- [node-cron](https://www.npmjs.com/package/node-cron) - Task scheduling
- [express](https://expressjs.com/) - HTTP server for webhook mode
- [dotenv](https://www.npmjs.com/package/dotenv) - Environment variable management

## Troubleshooting

### Bot not starting
- Check that your `.env` file has valid `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID`
- Ensure your bot has permission to post in the target chat/channel

### No films being sent
- Check the logs for scraping errors
- Verify the website URL is accessible
- Try running `/latest` command manually to see detailed errors

### Duplicate notifications
- Delete `data/seen_films.json` to reset the database
- Check that the file is being written correctly (permissions)

### Puppeteer issues
On some systems, you may need to install additional dependencies:
```bash
# Ubuntu/Debian
sudo apt-get install -y libgbm-dev wget ca-certificates fonts-liberation

# macOS
# Usually works out of the box
```

### Deployment issues (Render)

**409 Conflict Error**:
- This happens when using polling mode with multiple instances
- Solution: Ensure `WEBHOOK_URL` is set in environment variables
- Verify service type is `web` not `worker` in `render.yaml`

**Health check endpoint**:
- Visit `https://your-app.onrender.com/health`
- Should return: `{"status":"ok","uptime":...}`
- If not responding, check logs for startup errors

**Webhook not receiving updates**:
- Check logs for "Webhook set successfully" message
- Verify `WEBHOOK_URL` matches your actual Render app URL
- Ensure bot has internet access to connect to Telegram
- Try sending `/start` command to trigger connection

## Development

### Adding new commands
1. Create a new file in `src/bot/commands/`
2. Export an async function that takes `ctx` parameter
3. Register it in `src/bot/bot.js`

### Modifying scraping logic
- Update `src/scraper/listingScraper.js` for listing page changes
- Update `src/scraper/detailScraper.js` for detail page changes
- Update `src/scraper/parser.js` for parsing logic changes

### Changing message format
Modify `src/formatters/messageFormatter.js` to customize how films are displayed

## Legal Disclaimer

This bot is for educational purposes only. Scraping websites may violate their terms of service. Always check the website's `robots.txt` and terms of service before scraping. The developers are not responsible for any misuse of this software.

## License

ISC

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on the GitHub repository.
