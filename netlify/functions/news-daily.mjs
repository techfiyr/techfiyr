/*
 * Scheduled function: every day at 00:30 UTC (06:30 in Dhaka) it asks the site to fetch the day's
 * top 10 AI stories (POST /api/news/refresh, app/api/news/refresh/route.ts). Scheduled functions
 * run only on the published production deploy, never on previews or locally.
 *
 * Environment variable (Functions scope, secret): CRON_SECRET, the same value the site checks.
 */
const env = (k) => ((globalThis.Netlify ? Netlify.env.get(k) : process.env[k]) || '').trim();

export default async () => {
	const site = env('URL') || 'https://techfiyr.com';
	const secret = env('CRON_SECRET');
	if (!secret) {
		console.error('news-daily: CRON_SECRET is not set');
		return;
	}
	const res = await fetch(site + '/api/news/refresh', { method: 'POST', headers: { Authorization: 'Bearer ' + secret } });
	console.log('news-daily:', res.status, (await res.text()).slice(0, 500));
};

export const config = { schedule: '30 0 * * *' };
