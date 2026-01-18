/**
 * Film tracker - handles duplicate detection
 * Filters out films that have already been seen
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('FilmTracker');

class FilmTracker {
  constructor(database) {
    this.database = database;
  }

  /**
   * Filter out films that have already been seen
   * @param {Array} films - Array of film objects with id property
   * @returns {Array} - Array of new films that haven't been seen
   */
  filterNewFilms(films) {
    const newFilms = films.filter(film => !this.database.hasFilm(film.id));

    const seenCount = films.length - newFilms.length;
    logger.info(`Filtered films: ${newFilms.length} new, ${seenCount} already seen`);

    return newFilms;
  }

  /**
   * Mark films as seen by adding them to the database
   * @param {Array} films - Array of film objects to mark as seen
   */
  async markAsSeen(films) {
    if (films.length === 0) {
      logger.debug('No films to mark as seen');
      return;
    }

    await this.database.addFilms(films);
    logger.success(`Marked ${films.length} films as seen`);
  }

  /**
   * Check if a specific film has been seen
   * @param {string} filmId - The film ID to check
   * @returns {boolean} - True if the film has been seen
   */
  hasBeenSeen(filmId) {
    return this.database.hasFilm(filmId);
  }

  /**
   * Get statistics about tracked films
   */
  getStats() {
    return this.database.getStats();
  }
}

export default FilmTracker;
