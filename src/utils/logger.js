/**
 * Simple logging utility with timestamp and color-coded log levels
 */

const LOG_LEVELS = {
  INFO: 'INFO',
  WARN: 'WARN',
  ERROR: 'ERROR',
  DEBUG: 'DEBUG',
  SUCCESS: 'SUCCESS'
};

const COLORS = {
  INFO: '\x1b[36m',    // Cyan
  WARN: '\x1b[33m',    // Yellow
  ERROR: '\x1b[31m',   // Red
  DEBUG: '\x1b[35m',   // Magenta
  SUCCESS: '\x1b[32m', // Green
  RESET: '\x1b[0m'
};

class Logger {
  constructor(prefix = '') {
    this.prefix = prefix;
  }

  _formatMessage(level, message) {
    const timestamp = new Date().toISOString();
    const prefixStr = this.prefix ? `[${this.prefix}] ` : '';
    const color = COLORS[level] || '';
    const reset = COLORS.RESET;

    return `${color}[${timestamp}] [${level}]${reset} ${prefixStr}${message}`;
  }

  info(message, ...args) {
    console.log(this._formatMessage(LOG_LEVELS.INFO, message), ...args);
  }

  warn(message, ...args) {
    console.warn(this._formatMessage(LOG_LEVELS.WARN, message), ...args);
  }

  error(message, ...args) {
    console.error(this._formatMessage(LOG_LEVELS.ERROR, message), ...args);
  }

  debug(message, ...args) {
    console.log(this._formatMessage(LOG_LEVELS.DEBUG, message), ...args);
  }

  success(message, ...args) {
    console.log(this._formatMessage(LOG_LEVELS.SUCCESS, message), ...args);
  }
}

// Default logger instance
export const logger = new Logger();

// Factory function to create logger with prefix
export function createLogger(prefix) {
  return new Logger(prefix);
}

export default logger;
