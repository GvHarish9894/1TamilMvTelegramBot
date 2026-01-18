/**
 * Puppeteer browser manager
 * Handles browser lifecycle and page creation
 */

import puppeteer from 'puppeteer';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Browser');

class BrowserManager {
  constructor() {
    this.browser = null;
    this.isInitialized = false;
  }

  /**
   * Launch the browser
   */
  async launch() {
    if (this.isInitialized && this.browser) {
      logger.debug('Browser already running');
      return this.browser;
    }

    try {
      logger.info('Launching browser...');

      // Configuration for Puppeteer
      const launchConfig = {
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920x1080'
        ]
      };

      this.browser = await puppeteer.launch(launchConfig);

      this.isInitialized = true;
      logger.success('Browser launched successfully');
      return this.browser;
    } catch (error) {
      logger.error('Failed to launch browser:', error.message);
      throw error;
    }
  }

  /**
   * Create a new page with default settings
   */
  async createPage() {
    if (!this.browser) {
      await this.launch();
    }

    try {
      const page = await this.browser.newPage();

      // Set viewport
      await page.setViewport({
        width: 1920,
        height: 1080
      });

      // Set user agent to avoid detection
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      );

      // Block unnecessary resources to speed up loading
      await page.setRequestInterception(true);
      page.on('request', (request) => {
        const resourceType = request.resourceType();
        if (['font', 'media'].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      });

      logger.debug('Created new page');
      return page;
    } catch (error) {
      logger.error('Failed to create page:', error.message);
      throw error;
    }
  }

  /**
   * Navigate to a URL with error handling and timeout
   */
  async navigateToUrl(page, url, timeout = 30000) {
    try {
      logger.info(`Navigating to: ${url}`);
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout
      });
      logger.debug('Navigation successful');
      return true;
    } catch (error) {
      logger.error(`Navigation failed for ${url}:`, error.message);
      return false;
    }
  }

  /**
   * Close a specific page
   */
  async closePage(page) {
    try {
      await page.close();
      logger.debug('Page closed');
    } catch (error) {
      logger.warn('Error closing page:', error.message);
    }
  }

  /**
   * Close the browser
   */
  async close() {
    if (this.browser) {
      try {
        await this.browser.close();
        this.browser = null;
        this.isInitialized = false;
        logger.info('Browser closed');
      } catch (error) {
        logger.error('Error closing browser:', error.message);
      }
    }
  }

  /**
   * Check if browser is running
   */
  isRunning() {
    return this.isInitialized && this.browser !== null;
  }
}

// Singleton instance
const browserManager = new BrowserManager();

export default browserManager;
