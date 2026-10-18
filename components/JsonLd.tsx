/*
 * JSON-LD structured data (AGENTS.md section 7.2). Rendered in the server HTML, so crawlers that
 * don't run JavaScript read it too. Everything in it must also be visible on the page.
 */
export default function JsonLd({ data }: { data: object }) {
	return (
		<script
			type="application/ld+json"
			// "<" is escaped so page text can never close the script tag
			dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
		/>
	);
}
