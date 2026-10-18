/*
 * Company facts and shared SEO data. Keep these identical to llms.txt and the page copy
 * (AGENTS.md section 7.2): search engines and AI assistants cross-check them.
 */
export const SITE_URL = 'https://techfiyr.com';
export const SITE_NAME = 'TechFiyr';
export const OG_IMAGE = {
	url: `${SITE_URL}/assets/images/og/techfiyr-og.jpg`,
	width: 1200,
	height: 630,
	alt: 'TechFiyr mobile app screens built with Flutter and React Native',
};
export const LLMS_URL = `${SITE_URL}/llms.txt`;

export const CONTACT = {
	email: 'info@techfiyr.com',
	telephone: '+8801540659530',
	phoneDisplay: '+880 1540659530',
	whatsapp: 'https://wa.me/8801540659530',
	fiverr: 'https://www.fiverr.com/wahidsaurav',
	upwork: 'https://www.upwork.com/freelancers/sauravwahid',
	github: 'https://github.com/techfiyr',
};

export const ORG_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;

/** Absolute URL for a site path ("/contact" -> "https://techfiyr.com/contact"). */
export function absUrl(path: string): string {
	if (/^https?:/.test(path)) return path;
	return SITE_URL + (path.startsWith('/') ? path : `/${path}`);
}

/** The ProfessionalService node shared by every inner page's JSON-LD graph. */
export const orgNode = {
	'@type': 'ProfessionalService',
	'@id': ORG_ID,
	name: SITE_NAME,
	url: `${SITE_URL}/`,
	logo: `${SITE_URL}/assets/images/brand/logo.svg`,
	email: CONTACT.email,
	telephone: CONTACT.telephone,
	address: {
		'@type': 'PostalAddress',
		streetAddress: '325, Mirpur DOHS',
		addressLocality: 'Dhaka',
		postalCode: '1216',
		addressCountry: 'BD',
	},
	sameAs: [CONTACT.github, CONTACT.fiverr, CONTACT.upwork],
};

export function breadcrumbNode(items: { name: string; path: string }[]) {
	return {
		'@type': 'BreadcrumbList',
		itemListElement: items.map((item, i) => ({
			'@type': 'ListItem',
			position: i + 1,
			name: item.name,
			item: item.path === '/' ? `${SITE_URL}/` : absUrl(item.path),
		})),
	};
}

/** Main navigation (header and mobile menu). `match` decides which item gets class="current". */
export const NAV = [
	{ label: 'Home', href: '/', match: (p: string) => p === '/' },
	{ label: 'Services', href: '/#services' },
	{ label: 'About us', href: '/#about' },
	{ label: 'Projects', href: '/projects', match: (p: string) => p === '/projects' || p.startsWith('/projects/') },
	{ label: 'Products', href: '/products', match: (p: string) => p === '/products' || p.startsWith('/products/') },
	{ label: 'Blog', href: '/blog', match: (p: string) => p === '/blog' || p.startsWith('/blog/') },
	{ label: 'AI News', href: '/news', match: (p: string) => p === '/news' },
	{ label: 'Reviews', href: '/#testimonial' },
	{ label: 'Process', href: '/#process' },
	{ label: 'Team', href: '/#team' },
	{ label: 'Contact', href: '/contact', match: (p: string) => p === '/contact' },
];

/*
 * Stylesheet and script versions. /assets/* is cached for a year (netlify.toml), so bump the
 * ?v= value here whenever the file changes; every page picks it up from this one place.
 */
export const ASSET_VERSION = {
	bootstrap: '20261003',
	style: '20261018.6',
	meanmenu: '20261003',
	responsive: '20261003',
	vendor: '20261003',
	script: '20261018.2',
	consent: '20261018',
	analytics: '20261014',
	visitors: '20261018',
	booking: '20261018',
	admin: '20261018.2',
};
