'use client';

/*
 * Admin sign-in form (app/admin/login). Posts to the login server action in app/admin/actions.ts;
 * errors are announced to screen readers and linked to the fields.
 */
import { useActionState } from 'react';
import { login, type FormState } from '@/app/admin/actions';
import SubmitButton from './SubmitButton';

export default function LoginForm({ next }: { next: string }) {
	const [state, action] = useActionState<FormState, FormData>(login, undefined);
	const err = state?.error;

	return (
		<form className="admin-form" action={action} noValidate>
			<input type="hidden" name="next" value={next} />
			<div className="admin-field">
				<label htmlFor="login-email">Email address</label>
				<input
					id="login-email"
					name="email"
					type="email"
					autoComplete="username"
					required
					defaultValue={state?.fields?.email || ''}
					aria-invalid={err ? true : undefined}
					aria-describedby={err ? 'login-error' : undefined}
				/>
			</div>
			<div className="admin-field">
				<label htmlFor="login-password">Password</label>
				<input
					id="login-password"
					name="password"
					type="password"
					autoComplete="current-password"
					required
					aria-invalid={err ? true : undefined}
					aria-describedby={err ? 'login-error' : undefined}
				/>
			</div>
			<p id="login-error" className="admin-alert is-error" role="alert" hidden={!err}>
				<i className="fa-solid fa-circle-exclamation" aria-hidden="true"></i> {err}
			</p>
			<SubmitButton className="admin-btn is-primary is-wide" pending="Signing in…">Sign in</SubmitButton>
		</form>
	);
}
