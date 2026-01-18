/**
 * Listing page scraper
 * Scrapes the forum listing page to get film URLs and IDs
 */

import browserManager from './browser.js';
import { extractFilmId } from './parser.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ListingScraper');

class ListingScraper {
  constructor(config) {
    this.config = config;
  }

  /**
   * Scrape the listing page for film entries
   * @returns {Array} Array of {id, detailUrl, title} objects
   */
  async scrapeListingPage() {
    let page = null;

    try {
      logger.info('Starting listing page scrape...');

      // Create new page
      page = await browserManager.createPage();

      // Navigate to listing URL
      const navigated = await browserManager.navigateToUrl(
        page,
        this.config.scraper.listingUrl,
        this.config.scraper.timeout
      );

      if (!navigated) {
        throw new Error('Failed to navigate to listing page');
      }

      // Wait for forum topics to load
      await page.waitForSelector('.ipsBox a[href*="/forums/topic/"]', { timeout: 10000 });
      logger.debug('Forum topics loaded');

      // Extract film entries
      const films = await page.evaluate((maxFilms) => {
        const filmEntries = [];
        const topicLinks = document.querySelectorAll('.ipsBox a[href*="/forums/topic/"]');
        const uniqueUrls = new Set(); // Prevent duplicates

        for (let i = 0; i < topicLinks.length && filmEntries.length < maxFilms; i++) {
          const link = topicLinks[i];
          const detailUrl = link.href;
          const title = link.textContent.trim();

          // Skip if already added or empty title
          if (uniqueUrls.has(detailUrl) || !title) continue;

          uniqueUrls.add(detailUrl);
          filmEntries.push({
            detailUrl,
            title
          });
        }

        return filmEntries;
      }, this.config.scraper.maxFilms);

      // Extract IDs from URLs
      const filmsWithIds = films
        .map(film => {
          const id = extractFilmId(film.detailUrl);
          return id ? { ...film, id } : null;
        })
        .filter(film => film !== null);

      // Remove duplicates by ID (in case same film appears with different URLs)
      const uniqueFilms = [];
      const seenIds = new Set();

      for (const film of filmsWithIds) {
        if (!seenIds.has(film.id)) {
          seenIds.add(film.id);
          uniqueFilms.push(film);
        }
      }

      logger.success(`Scraped ${uniqueFilms.length} films from listing page (${filmsWithIds.length - uniqueFilms.length} duplicates removed)`);

      return uniqueFilms;
    } catch (error) {
      logger.error('Error scraping listing page:', error.message);
      throw error;
    } finally {
      if (page) {
        await browserManager.closePage(page);
      }
    }
  }

  /**
   * Get latest films from the listing page
   * This is the main entry point for the listing scraper
   */
  async getLatestFilms() {
    try {
      const films = await this.scrapeListingPage();
      return films;
    } catch (error) {
      logger.error('Failed to get latest films:', error.message);
      return [];
    }
  }
}

export default ListingScraper;
