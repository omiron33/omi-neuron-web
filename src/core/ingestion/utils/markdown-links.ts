/**
 * Extract wiki-links and markdown links from a markdown string.
 *
 * Returns raw link targets (connector decides how to resolve them).
 */
export const extractMarkdownLinks = (markdown: string): string[] => {
  const links: string[] = [];

  // Wiki links: [[Target]] or [[Target|Label]]
  const wiki = /\[\[([^[\]]+)\]\]/g;
  for (const match of markdown.matchAll(wiki)) {
    const raw = (match[1] ?? '').split('|')[0]?.trim();
    if (raw) links.push(raw);
  }

  // Markdown links: [label](target)
  const md = /\[[^\]]*\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g;
  for (const match of markdown.matchAll(md)) {
    const target = (match[1] ?? '').trim();
    if (target) links.push(target);
  }

  return [...new Set(links)];
};
