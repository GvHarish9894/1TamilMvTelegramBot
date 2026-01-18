/**
 * Grammy bot initialization and message sending
 */

import { Bot, webhookCallback } from 'grammy';
import { startCommand } from './commands/start.js';
import { helpCommand } from './commands/help.js';
import { latestCommand } from './commands/latest.js';
import { formatFilmCaption } from '../formatters/messageFormatter.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Bot');

class TelegramBot {
  constructor(config) {
    this.config = config;
    this.bot = null;
    this.isRunning = false;
    this.checkAndSendUpdates = null; // Will be set from index.js
  }

  /**
   * Initialize the bot
   */
  initialize() {
    try {
      this.bot = new Bot(this.config.telegram.botToken);

      // Register commands
      this.bot.command('start', startCommand);
      this.bot.command('help', helpCommand);
      this.bot.command('latest', (ctx) => latestCommand(ctx, this.checkAndSendUpdates));

      // Error handler
      this.bot.catch((err) => {
        logger.error('Bot error:', err);
      });

      logger.success('Bot initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize bot:', error.message);
      throw error;
    }
  }

  /**
   * Start the bot in long polling mode (local development)
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    try {
      logger.info('Starting bot in polling mode...');
      this.bot.start({
        onStart: (botInfo) => {
          logger.success(`Bot started: @${botInfo.username}`);
          this.isRunning = true;
        }
      });
    } catch (error) {
      logger.error('Failed to start bot:', error.message);
      throw error;
    }
  }

  /**
   * Start the bot in webhook mode (production)
   */
  async startWebhook(app, path) {
    if (this.isRunning) {
      logger.warn('Bot is already running');
      return;
    }

    try {
      logger.info('Starting bot in webhook mode...');

      // Set up webhook endpoint using Grammy's webhookCallback function
      // Telegram sends POST requests to webhooks
      app.post(path, webhookCallback(this.bot, 'express'));

      this.isRunning = true;
      logger.success('Bot webhook configured');
    } catch (error) {
      logger.error('Failed to configure webhook:', error.message);
      throw error;
    }
  }

  /**
   * Set the webhook URL with Telegram
   */
  async setWebhook(webhookUrl) {
    try {
      logger.info(`Setting webhook URL: ${webhookUrl}`);
      await this.bot.api.setWebhook(webhookUrl);

      const webhookInfo = await this.bot.api.getWebhookInfo();
      logger.success(`Webhook set successfully: ${webhookInfo.url}`);

      return webhookInfo;
    } catch (error) {
      logger.error('Failed to set webhook:', error.message);
      throw error;
    }
  }

  /**
   * Stop the bot
   */
  async stop() {
    if (this.bot && this.isRunning) {
      await this.bot.stop();
      this.isRunning = false;
      logger.info('Bot stopped');
    }
  }

  /**
   * Send a film as a photo message with caption
   */
  async sendFilm(film) {
    try {
      const caption = formatFilmCaption(film);
      const chatId = this.config.telegram.chatId;

      // Send photo with caption if poster is available
      if (film.posterUrl) {
        await this.bot.api.sendPhoto(chatId, film.posterUrl, {
          caption,
          parse_mode: 'HTML'
        });
      } else {
        // Send as text message if no poster
        await this.bot.api.sendMessage(chatId, caption, {
          parse_mode: 'HTML',
          disable_web_page_preview: false
        });
      }

      logger.info(`Sent film: ${film.title}`);
      return true;
    } catch (error) {
      logger.error(`Failed to send film ${film.title}:`, error.message);
      return false;
    }
  }

  /**
   * Send multiple films with delay between each
   */
  async sendFilms(films) {
    let sentCount = 0;
    let failedCount = 0;

    for (const film of films) {
      const success = await this.sendFilm(film);

      if (success) {
        sentCount++;
      } else {
        failedCount++;
      }

      // Wait between messages to avoid rate limiting
      if (sentCount < films.length) {
        await this.delay(1500);
      }
    }

    logger.info(`Sent ${sentCount} films, ${failedCount} failed`);
    return { sentCount, failedCount };
  }

  /**
   * Send a text message
   */
  async sendMessage(text, parseMode = 'HTML') {
    try {
      const chatId = this.config.telegram.chatId;
      await this.bot.api.sendMessage(chatId, text, {
        parse_mode: parseMode
      });
      return true;
    } catch (error) {
      logger.error('Failed to send message:', error.message);
      return false;
    }
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Set the update checker function
   */
  setUpdateChecker(checkFunction) {
    this.checkAndSendUpdates = checkFunction;
  }
}

export default TelegramBot;
