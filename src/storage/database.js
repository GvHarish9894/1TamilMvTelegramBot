/**
 * JSON file database operations
 * Handles reading and writing to seen_films.json
 */

import fs from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Database');

class Database {
  constructor(filePath) {
    this.filePath = filePath;
    this.data = null;
  }

  /**
   * Initialize the database file if it doesn't exist
   */
  async initialize() {
    try {
      // Create directory if it doesn't exist
      const dir = path.dirname(this.filePath);
      if (!existsSync(dir)) {
        await fs.mkdir(dir, { recursive: true });
        logger.info(`Created data directory: ${dir}`);
      }

      // Create empty database file if it doesn't exist
      if (!existsSync(this.filePath)) {
        const initialData = {
          films: [],
          lastUpdate: new Date().toISOString()
        };
        await fs.writeFile(this.filePath, JSON.stringify(initialData, null, 2));
        logger.info(`Initialized database file: ${this.filePath}`);
      }

      // Load data into memory
      await this.load();
      logger.success('Database initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize database:', error.message);
      throw error;
    }
  }

  /**
   * Load database from file
   */
  async load() {
    try {
      const content = await fs.readFile(this.filePath, 'utf-8');
      this.data = JSON.parse(content);
      logger.debug(`Loaded ${this.data.films.length} films from database`);
      return this.data;
    } catch (error) {
      logger.error('Failed to load database:', error.message);
      throw error;
    }
  }

  /**
   * Save database to file
   */
  async save() {
    try {
      this.data.lastUpdate = new Date().toISOString();
      await fs.writeFile(this.filePath, JSON.stringify(this.data, null, 2));
      logger.debug('Database saved successfully');
    } catch (error) {
      logger.error('Failed to save database:', error.message);
      throw error;
    }
  }

  /**
   * Get all films
   */
  getAllFilms() {
    return this.data.films || [];
  }

  /**
   * Add a new film to the database
   */
  async addFilm(film) {
    const filmEntry = {
      id: film.id,
      title: film.title,
      seenAt: new Date().toISOString()
    };

    this.data.films.push(filmEntry);
    await this.save();
    logger.info(`Added film to database: ${film.title} (ID: ${film.id})`);
  }

  /**
   * Add multiple films to the database
   */
  async addFilms(films) {
    for (const film of films) {
      const filmEntry = {
        id: film.id,
        title: film.title,
        seenAt: new Date().toISOString()
      };
      this.data.films.push(filmEntry);
    }

    await this.save();
    logger.info(`Added ${films.length} films to database`);
  }

  /**
   * Check if a film exists by ID
   */
  hasFilm(filmId) {
    return this.data.films.some(film => film.id === filmId);
  }

  /**
   * Clean up old entries to prevent database from growing too large
   */
  async cleanup(maxEntries) {
    if (this.data.films.length > maxEntries) {
      const removed = this.data.films.length - maxEntries;
      this.data.films = this.data.films.slice(-maxEntries);
      await this.save();
      logger.info(`Cleaned up ${removed} old entries from database`);
    }
  }

  /**
   * Get database statistics
   */
  getStats() {
    return {
      totalFilms: this.data.films.length,
      lastUpdate: this.data.lastUpdate
    };
  }
}

export default Database;
