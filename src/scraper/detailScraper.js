/**
 * Detail page scraper
 * Scrapes individual film detail pages for complete information
 */

import browserManager from './browser.js';
import {
  parseTitle,
  extractLanguage,
  extractSubtitles,
  parseDownloads
} from './parser.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('DetailScraper');

class DetailScraper {
  constructor(config) {
    this.config = config;
  }

  /**
   * Scrape a single film detail page
   * @param {Object} filmBasic - Basic film info {id, detailUrl, title}
   * @returns {Object} Complete film object or null if failed
   */
  async scrapeFilmDetail(filmBasic) {
    let page = null;

    try {
      logger.info(`Scraping detail page for: ${filmBasic.title}`);

      // Create new page
      page = await browserManager.createPage();

      // Navigate to detail URL
      const navigated = await browserManager.navigateToUrl(
        page,
        filmBasic.detailUrl,
        this.config.scraper.timeout
      );

      if (!navigated) {
        throw new Error('Failed to navigate to detail page');
      }

      // Wait for post content to load
      await page.waitForSelector('.cPost_contentWrap', { timeout: 10000 });
      logger.debug('Post content loaded');

      // Wait for JavaScript to render content and handle any redirects
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Wait for actual content to appear (not just the wrapper)
      try {
        await page.waitForFunction(() => {
          const wrapper = document.querySelector('.cPost_contentWrap');
          return wrapper && wrapper.innerHTML.length > 100;
        }, { timeout: 5000 });
        logger.debug('Content rendering complete');
      } catch (e) {
        logger.warn('Content wait timeout - proceeding anyway');
      }

      // Extract all film data
      const filmData = await page.evaluate(() => {
        // Get the first post (main post with film info)
        const firstPost = document.querySelector('.cPost_contentWrap');
        if (!firstPost) {
          return { error: 'Post wrapper not found' };
        }

        // Extract poster image
        let posterUrl = null;
        const posterImg = firstPost.querySelector('img[src*=".jpg"], img[src*=".png"], img[src*=".jpeg"]');
        if (posterImg) {
          posterUrl = posterImg.src;
        }

        // Get post title
        const postTitle = document.querySelector('.ipsType_pageTitle')?.textContent.trim() || '';

        // Try multiple selectors for post content
        const contentSelectors = [
          '[data-role="commentContent"]',
          '.cPost_post',
          '.cPost_article',
          '.ipsComment_content',
          '.cPost_contentWrap .ipsType_richText',
          '.cPost_contentWrap'  // Fallback to wrapper itself
        ];

        let postContent = null;
        let usedSelector = '';

        for (const selector of contentSelectors) {
          postContent = firstPost.querySelector(selector);
          if (postContent && postContent.innerHTML.trim().length > 0) {
            usedSelector = selector;
            break;
          }
        }

        if (!postContent) {
          return {
            posterUrl,
            postTitle,
            contentText: '',
            contentHTML: '',
            error: 'No content selector matched'
          };
        }

        // Use innerHTML instead of textContent to preserve links
        const contentHTML = postContent.innerHTML || '';
        const contentText = postContent.textContent || '';

        // Debug info
        const debug = {
          usedSelector,
          contentLength: contentHTML.length,
          hasLinks: contentHTML.includes('<a href'),
          linkCount: (contentHTML.match(/<a href/g) || []).length
        };

        return {
          posterUrl,
          postTitle,
          contentText,
          contentHTML,
          debug
        };
      });

      // Log debug information
      if (filmData.debug) {
        logger.debug(`Content extraction: selector=${filmData.debug.usedSelector}, ` +
                     `length=${filmData.debug.contentLength}, ` +
                     `links=${filmData.debug.linkCount}`);
      }

      if (filmData.error) {
        logger.warn(`Content extraction issue: ${filmData.error}`);
      }

      // Save HTML content to file for debugging (only for first film)
      if (filmData.contentHTML && filmBasic.id) {
        try {
          const fs = await import('fs/promises');
          const path = await import('path');
          const debugDir = path.join(process.cwd(), 'debug');
          await fs.mkdir(debugDir, { recursive: true });
          const htmlFile = path.join(debugDir, `film_${filmBasic.id}_content.html`);
          await fs.writeFile(htmlFile, filmData.contentHTML, 'utf-8');
          logger.debug(`Saved HTML content to: ${htmlFile}`);
        } catch (err) {
          // Ignore file write errors
        }
      }

      if (!filmData) {
        logger.warn(`No film data found for ${filmBasic.title}`);
        return null;
      }

      // Parse title to extract movie name and year
      const { title, year } = parseTitle(filmData.postTitle || filmBasic.title);

      // Extract metadata
      const language = extractLanguage(filmData.contentText);
      const subtitles = extractSubtitles(filmData.contentText);

      // Parse download links from content (use HTML to preserve link structure)
      const downloads = parseDownloads(filmData.contentHTML || filmData.contentText);

      // Build complete film object
      const film = {
        id: filmBasic.id,
        title,
        year,
        posterUrl: filmData.posterUrl,
        detailUrl: filmBasic.detailUrl,
        downloads,
        language,
        subtitles,
        scrapedAt: new Date().toISOString()
      };

      logger.success(`Successfully scraped: ${title} with ${downloads.length} download options`);

      return film;
    } catch (error) {
      logger.error(`Error scraping detail page for ${filmBasic.title}:`, error.message);
      return null;
    } finally {
      if (page) {
        await browserManager.closePage(page);
      }
    }
  }

  /**
   * Scrape multiple film detail pages
   * @param {Array} films - Array of basic film objects
   * @returns {Array} Array of complete film objects
   */
  async scrapeMultipleFilms(films) {
    const results = [];

    for (const film of films) {
      try {
        const filmData = await this.scrapeFilmDetail(film);
        if (filmData && filmData.downloads.length > 0) {
          results.push(filmData);
        } else {
          logger.warn(`Skipping ${film.title} - no download links found`);
        }

        // Add delay between requests to avoid rate limiting
        await this.delay(2000);
      } catch (error) {
        logger.error(`Failed to scrape ${film.title}, continuing with next...`);
      }
    }

    logger.info(`Successfully scraped ${results.length} of ${films.length} films`);
    return results;
  }

  /**
   * Delay helper
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default DetailScraper;
