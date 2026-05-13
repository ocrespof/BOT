/**
 * Extract a URL from the current message text or a quoted/replied message.
 * Used by all download commands to support "quote a message with a link" workflow.
 * 
 * Priority:
 * 1. URL in command arguments (args text)
 * 2. URL in quoted message text/body
 * 
 * @param {object} m - Message object from smsg()
 * @param {string} text - args.join(' ')
 * @returns {string|null} The extracted URL or null
 */
const URL_REGEX = /https?:\/\/[^\s]+/i;

export function extractUrl(m, text) {
  // 1. Check args text first
  if (text) {
    const match = text.match(URL_REGEX);
    if (match) return match[0];
  }
  // 2. Check quoted message
  if (m.quoted) {
    const quotedText = m.quoted.text || m.quoted.body || '';
    const match = quotedText.match(URL_REGEX);
    if (match) return match[0];
  }
  return null;
}
