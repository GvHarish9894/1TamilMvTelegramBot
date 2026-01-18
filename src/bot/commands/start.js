/**
 * /start command handler
 */

import { formatTextMessage } from '../../formatters/messageFormatter.js';

export async function startCommand(ctx) {
  const message = `
<b>🎬 Welcome to 1TamilMV Bot!</b>

I monitor <b>1TamilMV</b> for new Tamil movie releases and send you detailed updates with download links.

<b>Features:</b>
• Automatic checks every 2 hours
• Movie poster and details
• Multiple quality options (4K, 1080p, 720p, etc.)
• Magnet links and direct downloads
• No duplicate notifications

<b>Available Commands:</b>
/start - Show this message
/latest - Check for new films now
/help - Get help

<b>Status:</b> ✅ Active and monitoring
`;

  await ctx.reply(message.trim(), { parse_mode: 'HTML' });
}
