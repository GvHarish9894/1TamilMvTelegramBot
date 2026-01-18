/**
 * /help command handler
 */

export async function helpCommand(ctx) {
  const message = `
<b>📖 Help - 1TamilMV Bot</b>

<b>Commands:</b>
/start - Welcome message and bot info
/latest - Manually check for new films
/help - Show this help message

<b>How it works:</b>
1. I check 1TamilMV every 2 hours
2. When new Tamil movies are posted, I scrape their details
3. I send each film as a separate message with:
   • Movie poster
   • Title and year
   • Language and subtitles
   • Download options (all qualities)
   • Magnet and direct links

<b>Notes:</b>
• I never send duplicate films
• Each film is sent only once
• Use /latest to check immediately
• Automatic checks run in background

Need help? Check the bot's GitHub repository.
`;

  await ctx.reply(message.trim(), { parse_mode: 'HTML' });
}
