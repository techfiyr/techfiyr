/*
 * Scheduled Netlify Function: every 5 minutes polls Zoho Mail IMAP via POST /api/agent/email/sync.
 * Uses CRON_SECRET in Functions scope (same pattern as netlify/functions/news-daily.mjs).
 */
const env = (k) => ((globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || '').trim();

export default async () => {
	const site = env('URL') || 'https://techfiyr.com';
	const secret = env('CRON_SECRET');
	if (!secret) {
		console.error('email-sync: CRON_SECRET is not set');
		return;
	}
	const res = await fetch(site + '/api/agent/email/sync', {
		method: 'POST',
		headers: { Authorization: 'Bearer ' + secret },
	});
	console.log('email-sync:', res.status, (await res.text()).slice(0, 400));
};

export const config = { schedule: '*/5 * * * *' };

