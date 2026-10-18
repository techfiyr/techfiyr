/*
 * Small Markdown renderer for CMS content (blog posts, product descriptions). It returns React
 * elements, never an HTML string, so everything a writer types is escaped by React.
 *
 * Supported: ## to #### headings (# also becomes h2: the page title is the only h1), paragraphs,
 * - / * and 1. lists, > quotes, ``` code blocks, --- rules, | tables |, images on their own line
 * ![alt](url "caption"), and inline **bold**, *italic*, `code` and [links](url).
 * Links to the site itself use next/link; other sites open in a new tab.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { slugify } from './content';

const SAFE_HREF = /^(https?:\/\/|mailto:|tel:|\/(?!\/)|#)/i;
const SAFE_SRC = /^(https?:\/\/|\/(?!\/))/i;

// ---------- Inline ----------
const INLINE = /(`[^`]+`)|(\*\*[^*]+\*\*)|(__[^_]+__)|(\*[^*\s][^*]*\*)|(_[^_\s][^_]*_)|(!?\[[^\]]*\]\([^)\s]+(?:\s+"[^"]*")?\))/;

function inline(text: string, key = 'i'): ReactNode[] {
	const out: ReactNode[] = [];
	let rest = text;
	let n = 0;
	while (rest) {
		const m = INLINE.exec(rest);
		if (!m) {
			out.push(rest);
			break;
		}
		if (m.index > 0) out.push(rest.slice(0, m.index));
		const tok = m[0];
		const k = `${key}-${n++}`;
		if (tok.startsWith('`')) out.push(<code key={k}>{tok.slice(1, -1)}</code>);
		else if (tok.startsWith('**') || tok.startsWith('__')) out.push(<strong key={k}>{inline(tok.slice(2, -2), k)}</strong>);
		else if (tok.startsWith('*') || tok.startsWith('_')) out.push(<em key={k}>{inline(tok.slice(1, -1), k)}</em>);
		else {
			const link = /^(!?)\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)$/.exec(tok);
			if (link && !link[1] && SAFE_HREF.test(link[3])) out.push(mdLink(link[3], inline(link[2], k), k));
			else if (link && link[1] && SAFE_SRC.test(link[3])) out.push(<img key={k} src={link[3]} alt={link[2]} loading="lazy" decoding="async" />);
			else out.push(link ? link[2] : tok);
		}
		rest = rest.slice(m.index + tok.length);
	}
	return out;
}

function mdLink(href: string, children: ReactNode, key: string) {
	if (href.startsWith('/') || href.startsWith('#')) return <Link key={key} href={href}>{children}</Link>;
	if (/^(mailto|tel):/i.test(href)) return <a key={key} href={href}>{children}</a>;
	return (
		<a key={key} href={href} target="_blank" rel="noopener">
			{children}
			<span className="sr-only">{' '}(opens in a new tab)</span>
		</a>
	);
}

// ---------- Blocks ----------
const isTableRow = (l: string) => /^\s*\|.*\|\s*$/.test(l);
const cells = (l: string) => l.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());

export function Markdown({ source }: { source: string }) {
	const lines = source.replace(/\r\n?/g, '\n').split('\n');
	const blocks: ReactNode[] = [];
	const usedIds = new Set<string>();
	let i = 0;

	const headingId = (text: string) => {
		const base = slugify(text) || 'section';
		let id = base;
		for (let n = 2; usedIds.has(id); n++) id = `${base}-${n}`;
		usedIds.add(id);
		return id;
	};

	while (i < lines.length) {
		const line = lines[i];
		const k = `b${i}`;

		if (!line.trim()) {
			i++;
			continue;
		}

		// fenced code
		if (/^```/.test(line)) {
			const code: string[] = [];
			i++;
			while (i < lines.length && !/^```/.test(lines[i])) code.push(lines[i++]);
			i++;
			blocks.push(<pre key={k}><code>{code.join('\n')}</code></pre>);
			continue;
		}

		const h = /^(#{1,4})\s+(.+?)\s*#*$/.exec(line);
		if (h) {
			const level = Math.max(2, h[1].length);
			const text = h[2];
			const Tag = `h${level}` as 'h2' | 'h3' | 'h4';
			blocks.push(<Tag key={k} id={headingId(text)}>{inline(text, k)}</Tag>);
			i++;
			continue;
		}

		if (/^(-{3,}|\*{3,})\s*$/.test(line)) {
			blocks.push(<hr key={k} />);
			i++;
			continue;
		}

		// image on its own line, with an optional "caption"
		const img = /^!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)\s*$/.exec(line);
		if (img && SAFE_SRC.test(img[2])) {
			blocks.push(
				<figure key={k}>
					<img src={img[2]} alt={img[1]} loading="lazy" decoding="async" />
					{img[3] && <figcaption>{img[3]}</figcaption>}
				</figure>,
			);
			i++;
			continue;
		}

		if (/^>\s?/.test(line)) {
			const quote: string[] = [];
			while (i < lines.length && /^>\s?/.test(lines[i])) quote.push(lines[i++].replace(/^>\s?/, ''));
			blocks.push(<blockquote key={k}><p>{inline(quote.join(' '), k)}</p></blockquote>);
			continue;
		}

		if (/^\s*[-*]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*]\s+/, ''));
			blocks.push(<ul key={k}>{items.map((t, n) => <li key={n}>{inline(t, `${k}-${n}`)}</li>)}</ul>);
			continue;
		}

		if (/^\s*\d+[.)]\s+/.test(line)) {
			const items: string[] = [];
			while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+[.)]\s+/, ''));
			blocks.push(<ol key={k}>{items.map((t, n) => <li key={n}>{inline(t, `${k}-${n}`)}</li>)}</ol>);
			continue;
		}

		// | a | b |  followed by  | --- | --- |
		if (isTableRow(line) && i + 1 < lines.length && /^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) {
			const head = cells(line);
			i += 2;
			const rows: string[][] = [];
			while (i < lines.length && isTableRow(lines[i])) rows.push(cells(lines[i++]));
			blocks.push(
				<div key={k} className="article-table">
					<table>
						<thead><tr>{head.map((c, n) => <th key={n} scope="col">{inline(c, `${k}-h${n}`)}</th>)}</tr></thead>
						<tbody>{rows.map((r, rn) => <tr key={rn}>{head.map((_, n) => <td key={n}>{inline(r[n] || '', `${k}-${rn}-${n}`)}</td>)}</tr>)}</tbody>
					</table>
				</div>,
			);
			continue;
		}

		// paragraph: until a blank line or another block starts
		const para: string[] = [];
		while (
			i < lines.length &&
			lines[i].trim() &&
			!/^(```|#{1,4}\s|>\s?|\s*[-*]\s+|\s*\d+[.)]\s+|-{3,}\s*$)/.test(lines[i]) &&
			!(isTableRow(lines[i]) && para.length === 0)
		) {
			para.push(lines[i++].trim());
		}
		if (!para.length) para.push(lines[i++].trim());
		blocks.push(<p key={k}>{inline(para.join(' '), k)}</p>);
	}

	return <>{blocks}</>;
}

/** The ## headings of a Markdown body, for the article's table of contents. */
export function outline(source: string): { id: string; text: string }[] {
	const used = new Set<string>();
	const out: { id: string; text: string }[] = [];
	let inCode = false;
	for (const line of source.split(/\r?\n/)) {
		if (/^```/.test(line)) inCode = !inCode;
		const h = !inCode && /^(#{1,4})\s+(.+?)\s*#*$/.exec(line);
		if (!h) continue;
		const base = slugify(h[2]) || 'section';
		let id = base;
		for (let n = 2; used.has(id); n++) id = `${base}-${n}`;
		used.add(id);
		if (h[1].length <= 2) out.push({ id, text: h[2].replace(/[*_`]/g, '') });
	}
	return out;
}

/** Markdown to plain text (for meta descriptions and JSON-LD). */
export function plainText(source: string): string {
	return source
		.replace(/```[\s\S]*?```/g, ' ')
		.replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
		.replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
		.replace(/^[#>\-*\d.)\s|]+/gm, '')
		.replace(/[*_`|]/g, '')
		.replace(/\s+/g, ' ')
		.trim();
}
