/**
 * Cron job scheduler for automatic film checking
 */

import cron from 'node-cron';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('Scheduler');

class Scheduler {
  constructor(config) {
    this.config = config;
    this.task = null;
    this.isRunning = false;
    this.checkAndSendUpdates = null;
  }

  /**
   * Start the scheduler
   */
  start(checkFunction) {
    if (!this.config.scheduler.enabled) {
      logger.info('Scheduler is disabled in configuration');
      return;
    }

    if (this.isRunning) {
      logger.warn('Scheduler is already running');
      return;
    }

    this.checkAndSendUpdates = checkFunction;

    try {
      // Validate cron expression
      if (!cron.validate(this.config.scheduler.cronSchedule)) {
        throw new Error(`Invalid cron schedule: ${this.config.scheduler.cronSchedule}`);
      }

      // Create scheduled task
      this.task = cron.schedule(this.config.scheduler.cronSchedule, async () => {
        logger.info('Scheduled check triggered');
        await this.runScheduledCheck();
      });

      this.isRunning = true;
      logger.success(`Scheduler started with schedule: ${this.config.scheduler.cronSchedule}`);
    } catch (error) {
      logger.error('Failed to start scheduler:', error.message);
      throw error;
    }
  }

  /**
   * Run a scheduled check
   */
  async runScheduledCheck() {
    try {
      const startTime = Date.now();
      logger.info('Running scheduled film check...');

      const result = await this.checkAndSendUpdates();

      const duration = ((Date.now() - startTime) / 1000).toFixed(2);

      if (result.success) {
        logger.success(
          `Scheduled check completed in ${duration}s - Found ${result.newFilmsCount} new films`
        );
      } else {
        logger.error(`Scheduled check failed: ${result.error}`);
      }
    } catch (error) {
      logger.error('Error in scheduled check:', error.message);
    }
  }

  /**
   * Stop the scheduler
   */
  stop() {
    if (this.task) {
      this.task.stop();
      this.task = null;
      this.isRunning = false;
      logger.info('Scheduler stopped');
    }
  }

  /**
   * Check if scheduler is running
   */
  getStatus() {
    return {
      enabled: this.config.scheduler.enabled,
      running: this.isRunning,
      schedule: this.config.scheduler.cronSchedule
    };
  }
}

export default Scheduler;
