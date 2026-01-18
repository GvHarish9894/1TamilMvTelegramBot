/**
 * /latest command handler
 * Manually triggers film checking
 */

import { createLogger } from '../../utils/logger.js';

const logger = createLogger('LatestCommand');

export async function latestCommand(ctx, checkAndSendUpdates) {
  try {
    logger.info('Manual check triggered via /latest command');

    // Send initial message
    const statusMessage = await ctx.reply('🔍 Checking for new films...', { parse_mode: 'HTML' });

    // Run the update check
    const result = await checkAndSendUpdates();

    // Delete the status message
    try {
      await ctx.api.deleteMessage(ctx.chat.id, statusMessage.message_id);
    } catch (error) {
      // Ignore if message can't be deleted
    }

    // Send result message
    if (result.success) {
      if (result.newFilmsCount > 0) {
        await ctx.reply(
          `✅ Found and sent ${result.newFilmsCount} new film${result.newFilmsCount === 1 ? '' : 's'}!`,
          { parse_mode: 'HTML' }
        );
      } else {
        await ctx.reply('ℹ️ No new films found. All caught up!', { parse_mode: 'HTML' });
      }
    } else {
      await ctx.reply(
        `❌ Error checking for updates: ${result.error || 'Unknown error'}`,
        { parse_mode: 'HTML' }
      );
    }
  } catch (error) {
    logger.error('Error in /latest command:', error.message);
    await ctx.reply('❌ An error occurred while checking for updates.', { parse_mode: 'HTML' });
  }
}
