/*
 * Small building blocks for admin pages (server components): page heading, panels, status chips,
 * a bar chart with a data table for screen readers, and the "not connected" note.
 */
import type { ReactNode } from 'react';

export function PageHead({ title, intro, actions }: { title: string; intro?: ReactNode; actions?: ReactNode }) {
	return (
		<div className="admin-head">
			<div>
				<h1>{title}</h1>
				{intro && <p className="admin-head_intro">{intro}</p>}
			</div>
			{actions && <div className="admin-head_actions">{actions}</div>}
		</div>
	);
}

export function Panel({ title, meta, children, wide, id }: { title: string; meta?: ReactNode; children: ReactNode; wide?: boolean; id?: string }) {
	return (
		<section className={wide ? 'admin-panel is-wide' : 'admin-panel'} aria-labelledby={id ? `${id}-title` : undefined}>
			<div className="admin-panel_head">
				<h2 id={id ? `${id}-title` : undefined}>{title}</h2>
				{meta && <div className="admin-panel_meta">{meta}</div>}
			</div>
			{children}
		</section>
	);
}

export function Chip({ tone = 'neutral', children }: { tone?: 'good' | 'warn' | 'neutral' | 'draft'; children: ReactNode }) {
	return <span className={`admin-chip is-${tone}`}>{children}</span>;
}

export function Stat({ label, value, note }: { label: string; value: ReactNode; note?: ReactNode }) {
	return (
		<div className="admin-stat">
			<dt>{label}</dt>
			<dd>
				<span className="admin-stat_value">{value}</span>
				{note && <span className="admin-stat_note">{note}</span>}
			</dd>
		</div>
	);
}

export function NotConnected({ what, reason, steps }: { what: string; reason: string; steps: ReactNode }) {
	return (
		<div className="admin-empty is-compact">
			<p className="admin-empty_title">
				<i className="fa-solid fa-circle-info" aria-hidden="true"></i> {what} is not connected
			</p>
			<p className="admin-muted">{reason}.</p>
			<div className="admin-empty_steps">{steps}</div>
		</div>
	);
}

export function SourceError({ what, reason }: { what: string; reason: string }) {
	return (
		<p className="admin-alert is-error">
			<i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> {what} could not be loaded: {reason}
		</p>
	);
}

/** Vertical bars, one per day. The table underneath carries the same numbers for screen readers. */
export function BarChart({ data, label, unit }: { data: { label: string; short: string; value: number }[]; label: string; unit: string }) {
	const max = Math.max(1, ...data.map((d) => d.value));
	const empty = data.every((d) => !d.value);
	return (
		<figure className={empty ? 'admin-chart admin-chart_empty' : 'admin-chart'}>
			{empty && <p aria-hidden="true">No {unit} recorded in this period yet</p>}
			<div className="admin-chart_bars" aria-hidden="true">
				{data.map((d) => (
					<div key={d.label} className="admin-chart_col" title={`${d.label}: ${d.value.toLocaleString('en-US')} ${unit}`}>
						<span className="admin-chart_bar" style={{ height: `${Math.max(d.value ? 3 : 0, (d.value / max) * 100)}%` }}></span>
					</div>
				))}
			</div>
			<div className="admin-chart_axis" aria-hidden="true">
				<span>{data[0]?.short}</span>
				<span>{data[Math.floor(data.length / 2)]?.short}</span>
				<span>{data[data.length - 1]?.short}</span>
			</div>
			<figcaption className="sr-only">{label}</figcaption>
			<table className="sr-only">
				<caption>{label}</caption>
				<thead>
					<tr>
						<th scope="col">Day</th>
						<th scope="col">{unit}</th>
					</tr>
				</thead>
				<tbody>
					{data.map((d) => (
						<tr key={d.label}>
							<td>{d.label}</td>
							<td>{d.value}</td>
						</tr>
					))}
				</tbody>
			</table>
		</figure>
	);
}

export const fmt = (n: number) => n.toLocaleString('en-US');
export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;

export function dayLabel(iso: string, style: 'short' | 'long' = 'short') {
	const d = new Date(`${iso}T12:00:00Z`);
	return d.toLocaleDateString('en-GB', style === 'short' ? { day: 'numeric', month: 'short', timeZone: 'UTC' } : { weekday: 'short', day: 'numeric', month: 'long', timeZone: 'UTC' });
}

export function timeAgo(iso: string): string {
	if (!iso) return 'never';
	const s = Math.round((Date.now() - new Date(iso).getTime()) / 1000);
	if (s < 60) return 'just now';
	if (s < 3600) return `${Math.round(s / 60)} min ago`;
	if (s < 86400) return `${Math.round(s / 3600)} h ago`;
	return `${Math.round(s / 86400)} days ago`;
}
