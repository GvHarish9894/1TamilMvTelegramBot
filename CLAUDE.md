# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Telegram bot that monitors 1TamilMV for new Tamil movie releases using Puppeteer for web scraping and Grammy for Telegram integration. The bot runs on a cron schedule, scrapes film listings and details, filters duplicates, and sends formatted messages to a Telegram channel.

## Commands

### Development
```bash
# Start the bot
npm start

# Development mode with auto-reload
npm run dev
```

### Configuration
Before running, copy `.env.example` to `.env` and configure:
- `TELEGRAM_BOT_TOKEN` - Required bot token from @BotFather
- `TELEGRAM_CHAT_ID` - Required channel/chat ID (format: `-100xxxxxxxxxx` for channels)
- `CRON_SCHEDULE` - Default: `0 */2 * * *` (every 2 hours)
- `ENABLE_SCHEDULER` - Set to `false` to disable automatic checking
- `MAX_FILMS` - Maximum films to fetch per check (default: 20)

## Architecture

### Application Flow

The bot follows a strict initialization and execution pattern orchestrated by `src/index.js`:

1. **Initialization** (sequential):
   - Database → FilmTracker → Scrapers → TelegramBot → Scheduler
   - All components initialized before bot starts

2. **Core Workflow** (`checkAndSendUpdates` function):
   - Scrape listing page for latest films
   - Filter against local database to find new films
   - Scrape detail pages for new films only
   - Send to Telegram with 1.5s delay between messages
   - Mark successfully sent films as seen
   - Cleanup old database entries

3. **Triggering**:
   - Automated: Cron scheduler calls `checkAndSendUpdates`
   - Manual: `/latest` command calls `checkAndSendUpdates`
   - Both use the same workflow function injected via dependency injection

### Key Architectural Patterns

**Singleton Browser Manager**: `src/scraper/browser.js` exports a singleton instance, not a class. Import as:
```javascript
import browserManager from './scraper/browser.js';
```
The browser persists across scraping operations and is only closed on shutdown.

**Dependency Injection for Workflow**: The `checkAndSendUpdates` function is defined in `src/index.js` and injected into:
- `TelegramBot` via `setUpdateChecker()` - used by `/latest` command
- `Scheduler` via `start(checkFunction)` - used by cron jobs

This ensures both manual and automated checks use identical logic.

**Two-Phase Scraping**:
1. `ListingScraper` - Scrapes forum listing page, extracts film IDs and URLs
2. `DetailScraper` - Only scrapes detail pages for new films (not in database)

This minimizes unnecessary page loads and respects the target site.

**Deduplication Strategy**: `FilmTracker` wraps `Database` and provides duplicate detection:
- Before scraping details: `filterNewFilms()` checks against database
- After successful send: `markAsSeen()` updates database
- Database stores film metadata with IDs as keys

### Component Relationships

```
index.js (orchestrator)
  ├─> Database (JSON storage)
  ├─> FilmTracker (wraps Database, deduplication logic)
  ├─> ListingScraper (uses browserManager singleton)
  ├─> DetailScraper (uses browserManager singleton)
  ├─> TelegramBot (Grammy framework)
  │     ├─> commands/ (start, help, latest)
  │     └─> messageFormatter (HTML formatting)
  └─> Scheduler (node-cron)
```

### File Organization

- `src/index.js` - Main orchestrator, defines `checkAndSendUpdates` workflow
- `config/config.js` - Environment variable loading with validation
- `src/bot/` - Grammy bot, command handlers
- `src/scraper/` - Puppeteer-based scraping (browser, listing, detail, parser)
- `src/storage/` - JSON file database and FilmTracker
- `src/scheduler/` - Cron job management
- `src/formatters/` - Telegram message formatting (HTML)
- `data/seen_films.json` - Auto-generated persistence (tracked in .gitignore)

## Common Modifications

### Adding a New Bot Command
1. Create `src/bot/commands/yourcommand.js` with async function taking `ctx`
2. Import and register in `src/bot/bot.js` using `this.bot.command()`

### Modifying Scraping Selectors
- Listing page: Update selectors in `src/scraper/listingScraper.js`
- Detail page: Update selectors in `src/scraper/detailScraper.js`
- Parsing logic: Update extraction in `src/scraper/parser.js`

### Changing Message Format
Edit `src/formatters/messageFormatter.js` - uses HTML parse mode for Telegram

### Adjusting Scheduler
Modify `CRON_SCHEDULE` in `.env` using standard cron syntax
