'use client';

/*
 * Error boundary for the signed-in admin panel routes (/admin/*).
 * Catches any unexpected Server Component or client render errors, preventing the
 * generic Next.js black screen (React error #441) and letting the admin retry or reload.
 */
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminPanelError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('[admin panel error]:', error);
	}, [error]);

	return (
		<div className="admin-error-card">
			<p className="admin-alert is-error" role="status">
				<i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Temporary connection or render issue
			</p>
			<h2 className="admin-empty_title">This admin section couldn&apos;t load</h2>
			<p className="admin-muted">
				A temporary database or network connection issue occurred while loading this view. Your session and content are safe.
			</p>
			{error.digest && (
				<span className="admin-error-digest">
					Error digest: <code>{error.digest}</code>
				</span>
			)}
			<div className="admin-error-actions">
				<button type="button" className="admin-btn is-primary" onClick={() => reset()}>
					<i className="fa-solid fa-rotate" aria-hidden="true"></i> Try again
				</button>
				<button type="button" className="admin-btn is-quiet" onClick={() => window.location.reload()}>
					<i className="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Reload page
				</button>
				<Link href="/admin" className="admin-btn is-quiet">
					<i className="fa-solid fa-table-columns" aria-hidden="true"></i> Back to Dashboard
				</Link>
			</div>
		</div>
	);
}

