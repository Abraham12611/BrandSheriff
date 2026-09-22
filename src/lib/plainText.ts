/** Convert AI-drafted markdown-ish text to clean plain text for display and email. */
export function toPlainText(input: string): string {
  let text = input
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
  text = text.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, '$1 ($2)')
  text = text.replace(/^#{1,6}\s*/gm, '')
  text = text.replace(/^(\s*)[-*+]\s+/gm, '$1• ')
  text = text.replace(/\*\*([^*]+)\*\*/g, '$1')
  text = text.replace(/__([^_]+)__/g, '$1')
  text = text.replace(/\*([^*\n]+)\*/g, '$1')
  text = text.replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,;:!?])/g, '$1$2')
  text = text.replace(/^\s*(?:---+|===+|\*\*\*+)\s*$/gm, '')
  text = text.replace(/[ \t]+\n/g, '\n')
  text = text.replace(/\n{3,}/g, '\n\n')
  return text.trim()
}
