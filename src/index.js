/**
 * Main entry point for 1TamilMV Telegram Bot
 * Orchestrates all components and manages the bot lifecycle
 */

import express from 'express';
import config from '../config/config.js';
import logger from './utils/logger.js';
import Database from './storage/database.js';
import FilmTracker from './storage/filmTracker.js';
import ListingScraper from './scraper/listingScraper.js';
import DetailScraper from './scraper/detailScraper.js';
import TelegramBot from './bot/bot.js';
import Scheduler from './scheduler/scheduler.js';
import browserManager from './scraper/browser.js';

// Global instances
let database;
let filmTracker;
let listingScraper;
let detailScraper;
let telegramBot;
let scheduler;

/**
 * Initialize all components
 */
async function initialize() {
  try {
    logger.info('Initializing 1TamilMV Telegram Bot...');

    // Initialize database
    database = new Database(config.storage.dataPath);
    await database.initialize();

    // Initialize film tracker
    filmTracker = new FilmTracker(database);

    // Initialize scrapers
    listingScraper = new ListingScraper(config);
    detailScraper = new DetailScraper(config);

    // Initialize Telegram bot
    telegramBot = new TelegramBot(config);
    telegramBot.initialize();

    // Set up the update checker function
    telegramBot.setUpdateChecker(checkAndSendUpdates);

    // Initialize scheduler
    scheduler = new Scheduler(config);

    logger.success('All components initialized successfully');
  } catch (error) {
    logger.error('Initialization failed:', error.message);
    throw error;
  }
}

/**
 * Main function to check for new films and send updates
 */
async function checkAndSendUpdates() {
  const result = {
    success: false,
    newFilmsCount: 0,
    error: null
  };

  try {
    logger.info('Starting film check...');

    // Step 1: Scrape listing page for latest films
    const latestFilms = await listingScraper.getLatestFilms();

    if (latestFilms.length === 0) {
      logger.warn('No films found on listing page');
      result.success = true;
      return result;
    }

    logger.info(`Found ${latestFilms.length} films on listing page`);

    // Step 2: Filter out already seen films
    const newFilms = filmTracker.filterNewFilms(latestFilms);

    if (newFilms.length === 0) {
      logger.info('No new films found');
      result.success = true;
      return result;
    }

    logger.info(`Found ${newFilms.length} new films to scrape`);

    // Step 3: Scrape detail pages for new films
    const filmsWithDetails = await detailScraper.scrapeMultipleFilms(newFilms);

    if (filmsWithDetails.length === 0) {
      logger.warn('No films with valid details found');
      result.success = true;
      return result;
    }

    logger.info(`Successfully scraped ${filmsWithDetails.length} films`);

    // Step 4: Send films to Telegram
    const { sentCount, failedCount } = await telegramBot.sendFilms(filmsWithDetails);

    // Step 5: Mark successfully sent films as seen
    if (sentCount > 0) {
      const sentFilms = filmsWithDetails.slice(0, sentCount);
      await filmTracker.markAsSeen(sentFilms);

      // Cleanup old entries
      await database.cleanup(config.storage.maxTrackedFilms);
    }

    result.success = true;
    result.newFilmsCount = sentCount;

    logger.success(`Update complete: ${sentCount} films sent, ${failedCount} failed`);

    return result;
  } catch (error) {
    logger.error('Error in checkAndSendUpdates:', error.message);
    result.error = error.message;
    return result;
  }
}

/**
 * Start the bot
 */
async function start() {
  try {
    // Initialize components
    await initialize();

    // Determine if we should use webhooks (production) or polling (local)
    const useWebhook = !!config.server?.webhookUrl;

    if (useWebhook) {
      logger.info('Starting in webhook mode (production)');

      // Create Express app
      const app = express();
      app.use(express.json());

      // Health check endpoint
      app.get('/health', (req, res) => {
        res.status(200).json({
          status: 'ok',
          uptime: process.uptime(),
          timestamp: new Date().toISOString()
        });
      });

      // Start webhook
      await telegramBot.startWebhook(app, config.server.webhookPath);

      // Set webhook URL with Telegram
      const webhookUrl = config.server.webhookUrl + config.server.webhookPath;
      await telegramBot.setWebhook(webhookUrl);

      // Start Express server
      const server = app.listen(config.server.port, () => {
        logger.success(`🌐 HTTP server running on port ${config.server.port}`);
        logger.success(`📞 Webhook endpoint: ${config.server.webhookPath}`);
      });

      // Store server for shutdown
      global.httpServer = server;
    } else {
      logger.info('Starting in polling mode (local development)');
      await telegramBot.start();
    }

    // Start the scheduler
    scheduler.start(checkAndSendUpdates);

    logger.success('🚀 Bot is running!');
    logger.info('Press Ctrl+C to stop');

    // Keep the process alive
    process.once('SIGINT', () => shutdown());
    process.once('SIGTERM', () => shutdown());

  } catch (error) {
    logger.error('Failed to start bot:', error.message);
    await shutdown();
    process.exit(1);
  }
}

/**
 * Graceful shutdown
 */
async function shutdown() {
  logger.info('Shutting down...');

  try {
    // Stop scheduler
    if (scheduler) {
      scheduler.stop();
    }

    // Stop bot
    if (telegramBot) {
      await telegramBot.stop();
    }

    // Close HTTP server if running
    if (global.httpServer) {
      global.httpServer.close(() => {
        logger.info('HTTP server closed');
      });
    }

    // Close browser
    await browserManager.close();

    logger.success('Shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error.message);
    process.exit(1);
  }
}

// Start the bot
start();
