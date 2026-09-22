/** Convert AI-drafted markdown-ish text to clean plain text for display and email. */
export function toPlainText(input: string): string {
  let text = input;
  // Images: ![alt](url) → alt
  text = text.replace(/!\[([^\]]*)\]\([^)]*\)/g, "$1");
  // Links: [text](url) → text (url) — bare [REQUIRED: ...] placeholders are untouched
  text = text.replace(/\[([^\]]+)\]\((https?:[^)\s]+)\)/g, "$1 ($2)");
  // Headings: ### Foo → Foo
  text = text.replace(/^#{1,6}\s*/gm, "");
  // List markers first so emphasis rules can't touch them
  text = text.replace(/^(\s*)[-*+]\s+/gm, "$1• ");
  // Bold / italic markers
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  text = text.replace(/__([^_]+)__/g, "$1");
  text = text.replace(/\*([^*\n]+)\*/g, "$1");
  text = text.replace(/(^|\s)_([^_\n]+)_(?=\s|$|[.,;:!?])/g, "$1$2");
  // Horizontal rules
  text = text.replace(/^\s*(?:---+|===+|\*\*\*+)\s*$/gm, "");
  // Markdown hard-break: trailing whitespace before newline
  text = text.replace(/[ \t]+\n/g, "\n");
  // Collapse 3+ blank lines
  text = text.replace(/\n{3,}/g, "\n\n");
  return text.trim();
}
