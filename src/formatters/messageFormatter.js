/**
 * Message formatter for Telegram
 * Formats film data into Telegram messages with HTML formatting
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('MessageFormatter');

const MAX_CAPTION_LENGTH = 1024;

/**
 * Escape HTML special characters for Telegram
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

/**
 * Format a single download option
 */
function formatDownloadOption(download) {
  const parts = [];

  // Resolution header
  parts.push(`\n<b>${download.resolution || 'Unknown Quality'}</b>`);

  // Technical details
  const techDetails = [];
  if (download.fileSize) techDetails.push(download.fileSize);
  if (download.codec) techDetails.push(download.codec);
  if (download.audio) techDetails.push(download.audio);

  if (techDetails.length > 0) {
    parts.push(techDetails.join(' | '));
  }

  // Download links
  const links = [];
  if (download.magnetLink) {
    links.push(`🧲 <a href="${escapeHtml(download.magnetLink)}">Magnet</a>`);
  }
  if (download.directLink) {
    links.push(`⬇️ <a href="${escapeHtml(download.directLink)}">Direct</a>`);
  }

  if (links.length > 0) {
    parts.push(links.join(' | '));
  }

  return parts.join('\n');
}

/**
 * Format complete film message caption
 */
export function formatFilmCaption(film) {
  const parts = [];

  // Title with year and language: "Title (Year) | Language"
  let titleText = film.title ? escapeHtml(film.title) : 'Unknown';
  if (film.year) {
    titleText += ` (${film.year})`;
  }
  if (film.language) {
    titleText += ` | ${escapeHtml(film.language)}`;
  }
  parts.push(`<b>${titleText}</b>\n`);

  // Group downloads by type
  const directDownloads = [];
  const torrentDownloads = [];

  if (film.downloads && film.downloads.length > 0) {
    for (const download of film.downloads) {
      if (download.directLink && download.fileSize) {
        directDownloads.push({
          size: download.fileSize,
          link: download.directLink
        });
      }
      if (download.magnetLink && download.fileSize) {
        torrentDownloads.push({
          size: download.fileSize,
          link: download.magnetLink
        });
      }
    }
  }

  // DIRECT DOWNLOAD section
  if (directDownloads.length > 0) {
    parts.push('<b>DIRECT DOWNLOAD:</b>');
    for (const dl of directDownloads) {
      // Don't escape URLs - they need to remain as-is for Telegram to parse them
      parts.push(`${dl.size} - <a href="${dl.link}">Download Link</a> 📥`);
    }
    parts.push(''); // Empty line
  }

  // TORRENT section
  if (torrentDownloads.length > 0) {
    parts.push('<b>TORRENT:</b>');
    for (const dl of torrentDownloads) {
      // Magnet links: show as copyable code block (Telegram doesn't support magnet: in <a> tags)
      parts.push(`${dl.size} - 🧲\n<code>${dl.link}</code>`);
    }
  }

  const caption = parts.join('\n');

  // Check if caption exceeds Telegram's limit
  if (caption.length > MAX_CAPTION_LENGTH) {
    logger.warn(`Caption too long (${caption.length} chars), truncating...`);
    return truncateCaption(film);
  }

  return caption;
}

/**
 * Create a truncated caption if the full one is too long
 */
function truncateCaption(film) {
  const parts = [];

  // Title and year
  const titleText = film.year
    ? `${escapeHtml(film.title)} (${film.year})`
    : escapeHtml(film.title);
  parts.push(`🎬 <b>${titleText}</b>\n`);

  // Metadata
  if (film.language) {
    parts.push(`📝 Language: ${escapeHtml(film.language)}`);
  }

  // Just list available qualities
  if (film.downloads && film.downloads.length > 0) {
    const qualities = film.downloads
      .map(d => d.resolution)
      .filter(r => r)
      .join(', ');
    parts.push(`\n📥 Available: ${qualities}`);
  }

  // Link to full details
  parts.push(`\n🔗 <a href="${escapeHtml(film.detailUrl)}">View Full Details & Downloads</a>`);

  return parts.join('\n');
}

/**
 * Format additional message with download links (if caption was truncated)
 */
export function formatDownloadLinks(film) {
  const parts = ['<b>Download Links:</b>\n'];

  for (const download of film.downloads) {
    parts.push(formatDownloadOption(download));
  }

  return parts.join('\n');
}

/**
 * Check if caption needs to be split
 */
export function needsSplit(caption) {
  return caption.length > MAX_CAPTION_LENGTH;
}

/**
 * Format a simple text message
 */
export function formatTextMessage(text) {
  return escapeHtml(text);
}

/**
 * Format error message
 */
export function formatErrorMessage(error) {
  return `❌ <b>Error:</b> ${escapeHtml(error)}`;
}

/**
 * Format success message
 */
export function formatSuccessMessage(message) {
  return `✅ ${escapeHtml(message)}`;
}

/**
 * Format info message
 */
export function formatInfoMessage(message) {
  return `ℹ️ ${escapeHtml(message)}`;
}

export default {
  formatFilmCaption,
  formatDownloadLinks,
  needsSplit,
  formatTextMessage,
  formatErrorMessage,
  formatSuccessMessage,
  formatInfoMessage,
  escapeHtml
};
