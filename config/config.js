/**
 * Configuration loader
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file
dotenv.config({ path: join(__dirname, '..', '.env') });

/**
 * Get environment variable with validation
 */
function getEnv(key, defaultValue = undefined, required = false) {
  const value = process.env[key] || defaultValue;

  if (required && !value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * Parse boolean environment variable
 */
function getBoolEnv(key, defaultValue = false) {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Parse number environment variable
 */
function getNumberEnv(key, defaultValue = 0) {
  const value = process.env[key];
  if (value === undefined) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

const config = {
  // Telegram Configuration
  telegram: {
    botToken: getEnv('TELEGRAM_BOT_TOKEN', '', true),
    chatId: getEnv('TELEGRAM_CHAT_ID', '', true)
  },

  // Server configuration for webhooks
  server: {
    port: parseInt(process.env.PORT, 10) || 3000,
    webhookUrl: process.env.WEBHOOK_URL || '',
    webhookPath: '/webhook'
  },

  // Scraper Configuration
  scraper: {
    targetUrl: getEnv('TARGET_URL', 'https://www.1tamilmv.haus/'),
    listingUrl: getEnv('LISTING_URL', 'https://www.1tamilmv.haus/index.php?/forums/forum/9-tamil-language/'),
    maxFilms: getNumberEnv('MAX_FILMS', 20),
    timeout: getNumberEnv('SCRAPE_TIMEOUT', 30000)
  },

  // Scheduler Configuration
  scheduler: {
    enabled: getBoolEnv('ENABLE_SCHEDULER', true),
    cronSchedule: getEnv('CRON_SCHEDULE', '0 */2 * * *') // Every 2 hours
  },

  // Storage Configuration
  storage: {
    dataPath: getEnv('DATA_PATH', './data/seen_films.json'),
    maxTrackedFilms: getNumberEnv('MAX_TRACKED_FILMS', 500)
  }
};

export default config;
