/**
 * Parser for extracting film data and download links
 * Handles parsing of title, metadata, and download links
 */

import { createLogger } from '../utils/logger.js';

const logger = createLogger('Parser');

/**
 * Extract film ID from URL
 * URL format: /forums/topic/12345-movie-name/
 */
export function extractFilmId(url) {
  const match = url.match(/\/topic\/(\d+)-/);
  return match ? match[1] : null;
}

/**
 * Parse title to extract movie name and year
 * Example: "Movie Name (2024) [Tamil + Telugu] 1080p"
 */
export function parseTitle(titleText) {
  try {
    // Extract year
    const yearMatch = titleText.match(/\((\d{4})\)/);
    const year = yearMatch ? parseInt(yearMatch[1]) : null;

    // Extract title (everything before the year or quality indicators)
    let title = titleText;
    if (yearMatch) {
      title = titleText.substring(0, titleText.indexOf(yearMatch[0])).trim();
    } else {
      // Try to remove quality indicators
      title = titleText.split(/\[|\(|4K|1080p|720p|480p/)[0].trim();
    }

    // Clean up title
    title = title.replace(/\s+/g, ' ').trim();

    return { title, year };
  } catch (error) {
    logger.warn('Failed to parse title:', titleText, error.message);
    return { title: titleText, year: null };
  }
}

/**
 * Extract language information from text
 */
export function extractLanguage(text) {
  const languageMatch = text.match(/\[(Tamil|Telugu|Malayalam|Kannada|Hindi)([^\]]*)\]/i);
  return languageMatch ? languageMatch[0].replace(/[\[\]]/g, '') : 'Tamil';
}

/**
 * Extract subtitle information
 */
export function extractSubtitles(text) {
  const subtitleMatch = text.match(/(ESub|HC-ESub|E-Sub|HC ESub)/i);
  return subtitleMatch ? subtitleMatch[0] : null;
}

/**
 * Extract resolution from text
 * Returns null if no standard resolution found
 */
export function extractResolution(text) {
  const resolutions = ['4K', '2160p', '1080p', '720p', '480p', '360p'];
  for (const res of resolutions) {
    if (text.includes(res)) {
      return res === '2160p' ? '4K' : res;
    }
  }
  return null;
}

/**
 * Extract file size from text
 */
export function extractFileSize(text) {
  const sizeMatch = text.match(/(\d+(?:\.\d+)?)\s*(GB|MB|TB)/i);
  return sizeMatch ? sizeMatch[0] : null;
}

/**
 * Extract codec information
 */
export function extractCodec(text) {
  const codecs = ['HEVC x265', 'x265', 'AVC x264', 'x264', 'H.265', 'H.264'];
  for (const codec of codecs) {
    if (text.includes(codec)) {
      return codec;
    }
  }
  return null;
}

/**
 * Extract audio information
 */
export function extractAudio(text) {
  // Match patterns like "DD+5.1 192Kbps", "AAC 2.0", "Atmos"
  const audioMatch = text.match(/(DD\+?[\d.]+|AAC[\s\d.]*|Atmos|DTS[\s\d.]*|AC3)(\s*\d+Kbps)?/i);
  return audioMatch ? audioMatch[0].trim() : null;
}

/**
 * Extract magnet link from text or HTML
 */
export function extractMagnetLink(text) {
  const magnetMatch = text.match(/magnet:\?xt=urn:btih:[a-zA-Z0-9]+[^\s"]*/);
  return magnetMatch ? magnetMatch[0] : null;
}

/**
 * Extract direct download link (cyberloom or similar)
 */
export function extractDirectLink(text) {
  const directMatch = text.match(/https?:\/\/(?:cyberloom\.best|[\w-]+\.[\w-]+)\/l\/[a-zA-Z0-9]+/);
  return directMatch ? directMatch[0] : null;
}

/**
 * Parse download section for a specific resolution
 * Extracts all relevant information for one quality option
 */
export function parseDownloadSection(sectionText, resolution) {
  const download = {
    resolution,
    fileSize: extractFileSize(sectionText),
    codec: extractCodec(sectionText),
    audio: extractAudio(sectionText),
    magnetLink: extractMagnetLink(sectionText),
    directLink: extractDirectLink(sectionText)
  };

  return download;
}

/**
 * Split content into sections by resolution headers
 * Returns array of {resolution, content} objects
 */
export function splitByResolution(content) {
  const sections = [];
  const resolutionHeaders = ['4K', '2160p', '1080p', '720p', '480p', '360p'];

  // Split by common resolution patterns
  const lines = content.split('\n');
  let currentResolution = null;
  let currentContent = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check if this line is a resolution header
    let foundResolution = null;
    for (const res of resolutionHeaders) {
      if (line.includes(res) && (line.includes('UHD') || line.includes('HD') || /^\s*\*?\s*\d+p/.test(line) || line.startsWith('4K'))) {
        foundResolution = res === '2160p' ? '4K' : res;
        break;
      }
    }

    if (foundResolution) {
      // Save previous section if exists
      if (currentResolution && currentContent.length > 0) {
        sections.push({
          resolution: currentResolution,
          content: currentContent.join('\n')
        });
      }

      // Start new section
      currentResolution = foundResolution;
      currentContent = [line];
    } else if (currentResolution) {
      currentContent.push(line);
    }
  }

  // Add final section
  if (currentResolution && currentContent.length > 0) {
    sections.push({
      resolution: currentResolution,
      content: currentContent.join('\n')
    });
  }

  return sections;
}

/**
 * Parse all download options from film content
 */
export function parseDownloads(content) {
  const downloads = [];

  // Debug: Log a sample of the content to understand its structure
  logger.debug(`Content sample (first 500 chars): ${content.substring(0, 500)}`);

  // New approach: Find all magnet and direct links, then extract associated metadata
  const magnetRegex = /magnet:\?xt=urn:btih:[a-zA-Z0-9&=%:/.?_+-]+/g;
  const directLinkRegex = /https?:\/\/(?:cyberloom\.best|[\w-]+\.[\w-]+)\/l\/[a-zA-Z0-9]+/g;

  // Find all magnet links
  const magnetMatches = [...content.matchAll(magnetRegex)];
  const directMatches = [...content.matchAll(directLinkRegex)];

  // Process magnet links
  for (const match of magnetMatches) {
    const magnetLink = match[0];
    const position = match.index;

    // Look backwards in content to find the file size and quality in the preceding 500 chars
    const precedingText = content.substring(Math.max(0, position - 500), position);

    // Extract file size from preceding text (look for patterns like "2.3GB", "700MB", etc.)
    const sizeMatch = precedingText.match(/(\d+(?:\.\d+)?)\s*(GB|MB|TB)/i);
    const fileSize = sizeMatch ? sizeMatch[0] : null;

    // Extract resolution/quality from preceding text
    const resolution = extractResolution(precedingText) || 'Unknown';

    downloads.push({
      resolution,
      fileSize,
      codec: extractCodec(precedingText),
      audio: extractAudio(precedingText),
      magnetLink,
      directLink: null
    });
  }

  // Process direct links
  for (const match of directMatches) {
    const directLink = match[0];
    const position = match.index;

    // Look backwards in content to find the file size and quality
    const precedingText = content.substring(Math.max(0, position - 500), position);

    const sizeMatch = precedingText.match(/(\d+(?:\.\d+)?)\s*(GB|MB|TB)/i);
    const fileSize = sizeMatch ? sizeMatch[0] : null;
    const resolution = extractResolution(precedingText) || 'Unknown';

    // Check if this direct link is associated with an existing magnet link
    const existingIndex = downloads.findIndex(d =>
      d.fileSize === fileSize && d.resolution === resolution && !d.directLink
    );

    if (existingIndex >= 0) {
      // Add direct link to existing download
      downloads[existingIndex].directLink = directLink;
    } else {
      // Create new download entry
      downloads.push({
        resolution,
        fileSize,
        codec: extractCodec(precedingText),
        audio: extractAudio(precedingText),
        magnetLink: null,
        directLink
      });
    }
  }

  logger.debug(`Parsed ${downloads.length} download options`);
  return downloads;
}

export default {
  extractFilmId,
  parseTitle,
  extractLanguage,
  extractSubtitles,
  extractResolution,
  extractFileSize,
  extractCodec,
  extractAudio,
  extractMagnetLink,
  extractDirectLink,
  parseDownloadSection,
  splitByResolution,
  parseDownloads
};
