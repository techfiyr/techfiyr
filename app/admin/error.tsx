'use client';

/*
 * Root error boundary for /admin.
 * Catches any top-level layout or session errors before the admin shell mounts.
 */
import Link from 'next/link';
import { useEffect } from 'react';

export default function AdminRootError({
	error,
	reset,
}: {
	error: Error & { digest?: string };
	reset: () => void;
}) {
	useEffect(() => {
		console.error('[admin root error]:', error);
	}, [error]);

	return (
		<div style={{ maxWidth: '640px', margin: '60px auto', padding: '0 20px' }}>
			<div className="admin-error-card">
				<p className="admin-alert is-error" role="status">
					<i className="fa-solid fa-triangle-exclamation" aria-hidden="true"></i> Admin session or system error
				</p>
				<h2 className="admin-empty_title">The admin panel encountered an error</h2>
				<p className="admin-muted">
					A temporary error occurred while rendering the administration interface.
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
						<i className="fa-solid fa-arrows-rotate" aria-hidden="true"></i> Reload
					</button>
					<Link href="/admin/login" className="admin-btn is-quiet">
						<i className="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Admin login
					</Link>
				</div>
			</div>
		</div>
	);
}

