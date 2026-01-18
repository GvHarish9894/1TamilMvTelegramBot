# Quick Start Guide

## Setup Steps

### 1. Get Telegram Bot Token
1. Open Telegram and message [@BotFather](https://t.me/botfather)
2. Send `/newbot`
3. Follow the prompts to create your bot
4. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Chat ID
To send to a **channel**:
1. Create a new Telegram channel
2. Add your bot as an administrator to the channel
3. Forward any message from the channel to [@userinfobot](https://t.me/userinfobot)
4. Copy the "Forwarded from chat" ID (will be like `-100xxxxxxxxxx`)

To send to a **group**:
1. Add your bot to a group
2. Send a message in the group
3. Forward it to [@userinfobot](https://t.me/userinfobot)
4. Copy the chat ID

To send to **yourself** (private chat):
1. Message [@userinfobot](https://t.me/userinfobot)
2. Copy your user ID

### 3. Configure Environment
```bash
# Copy the example file
cp .env.example .env

# Edit .env with your credentials
nano .env
```

Update these values in `.env`:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
```

### 4. Run the Bot
```bash
# Start the bot
npm start
```

The bot will:
- ✅ Connect to Telegram
- ✅ Start monitoring 1TamilMV
- ✅ Check for new films every 2 hours
- ✅ Send updates automatically

### 5. Test It
Send these commands to your bot:

- `/start` - See welcome message
- `/help` - Get help
- `/latest` - Manually check for new films NOW

## What Happens Next?

1. The bot will scrape the latest 20 films from 1TamilMV
2. It will check which ones are new (not already sent)
3. For each new film, it will:
   - Scrape the detail page
   - Extract poster, title, download links
   - Send a message to your chat with all the details
4. Every 2 hours, it automatically checks again

## Customization

### Change Check Frequency
Edit `.env` and change `CRON_SCHEDULE`:
```env
CRON_SCHEDULE=0 */6 * * *    # Every 6 hours
CRON_SCHEDULE=0 0 * * *      # Daily at midnight
CRON_SCHEDULE=*/30 * * * *   # Every 30 minutes
```

### Disable Auto-Checking
If you only want manual checks with `/latest`:
```env
ENABLE_SCHEDULER=false
```

### Adjust Film Limit
Change how many films to check:
```env
MAX_FILMS=30    # Check latest 30 films instead of 20
```

## Troubleshooting

### "Missing required environment variable"
- Make sure `.env` file exists
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` are set

### Bot not sending messages
- Check that bot is admin in the channel (for channels)
- Verify chat ID is correct (try sending with a different bot)
- Check logs for errors

### No new films found
- The site might not have new releases
- Try `/latest` to force a check
- Check the logs to see what's happening

### Puppeteer errors
If you see browser launch errors:
```bash
# macOS - usually works out of the box
# Just restart the bot

# Linux - install dependencies
sudo apt-get install -y libgbm-dev ca-certificates fonts-liberation
```

## Logs

The bot outputs colored logs showing:
- 🟦 INFO - General information
- 🟩 SUCCESS - Successful operations
- 🟨 WARN - Warnings
- 🟥 ERROR - Errors

Watch the logs to understand what's happening!

## Next Steps

1. Monitor the bot for a few hours
2. Check that films are being sent correctly
3. Adjust the schedule if needed
4. Enjoy automated movie updates!

## Need Help?

- Check README.md for detailed documentation
- Review the logs for specific errors
- Open an issue on GitHub if you find bugs
