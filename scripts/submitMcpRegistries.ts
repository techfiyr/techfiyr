/*
 * Automated MCP Registry & Open Agent Network Submission CLI (scripts/submitMcpRegistries.ts)
 *
 * Run via:
 *   npm run submit-mcp               (live endpoint verification, directory submissions, Smithery ping & awesome-mcp PR)
 *   npm run submit-mcp -- --dry-run  (read-only verification + manifest checks + PR draft generation without external POST writes)
 *   npm run submit-mcp -- --base-url=http://localhost:3000 --dry-run
 *
 * Authentication separation:
 *   - Uses AGENT_MARKETING_API_KEY (NOT AGENT_SALES_API_KEY) for automated Marketing Agent broadcasts at /api/agent/marketing.
 *   - Uses GITHUB_TOKEN (if set) for drafting/opening a Pull Request on awesome-mcp-servers.
 */
import { execSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

type CliOptions = {
	baseUrl: string;
	dryRun: boolean;
	repoUrl: string;
};

type EndpointHealth = {
	online: boolean;
	getStatus: number;
	rpcStatus: number;
	toolNames: string[];
	error?: string;
};

type ManifestCheck = {
	name: string;
	localExists: boolean;
	localValid: boolean;
	liveUrl: string;
	liveStatus: number;
	detail: string;
};

type DirectoryResult = {
	directory: string;
	target: string;
	method: string;
	status: number;
	outcome: 'submitted' | 'indexed' | 'dry-run' | 'manual-fallback' | 'error';
	detail: string;
};

const DEFAULT_BASE_URL = 'https://techfiyr.com';
const DEFAULT_REPO_URL = 'https://github.com/techfiyr/techfiyr';
const TIMEOUT_MS = 10_000;

function loadLocalEnv(cwd: string): void {
	for (const file of ['.env', '.env.local']) {
		const full = join(cwd, file);
		if (!existsSync(full)) continue;
		if (typeof process.loadEnvFile === 'function') {
			try {
				process.loadEnvFile(full);
				continue;
			} catch {
				// fallback to manual parser below
			}
		}
		const lines = readFileSync(full, 'utf8').split(/\r?\n/);
		for (const raw of lines) {
			const line = raw.trim();
			if (!line || line.startsWith('#')) continue;
			const eq = line.indexOf('=');
			if (eq <= 0) continue;
			const key = line.slice(0, eq).trim();
			let val = line.slice(eq + 1).trim();
			if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
				val = val.slice(1, -1);
			}
			if (!process.env[key]) process.env[key] = val;
		}
	}
}

function parseArgs(argv: string[]): CliOptions {
	let baseUrl = DEFAULT_BASE_URL;
	let repoUrl = DEFAULT_REPO_URL;
	let dryRun = false;

	for (const arg of argv) {
		if (arg === '--dry-run') dryRun = true;
		else if (arg.startsWith('--base-url=')) baseUrl = arg.slice('--base-url='.length).replace(/\/+$/, '');
		else if (arg.startsWith('--repo=')) repoUrl = arg.slice('--repo='.length).replace(/\/+$/, '');
	}

	return { baseUrl, dryRun, repoUrl };
}

function resolveGitHubRepoUrl(cwd: string, fallback: string): string {
	try {
		const remote = execSync('git remote get-url origin', { cwd, stdio: ['ignore', 'pipe', 'ignore'] }).toString('utf8').trim();
		const sshMatch = /^git@[^:]+:([^/]+\/[^/.]+)(?:\.git)?$/i.exec(remote);
		if (sshMatch) return `https://github.com/${sshMatch[1]}`;
		const httpsMatch = /^https:\/\/github\.com\/([^/]+\/[^/.]+)(?:\.git)?$/i.exec(remote);
		if (httpsMatch) return `https://github.com/${httpsMatch[1]}`;
	} catch {
		// fall back cleanly
	}
	return fallback;
}

async function fetchJsonOrText(url: string, init?: RequestInit): Promise<{ status: number; ok: boolean; json: Record<string, unknown> | null; text: string }> {
	const res = await fetch(url, {
		...init,
		headers: {
			'User-Agent': 'TechFiyr-MCP-Registrar/1.0 (+https://techfiyr.com/api/mcp)',
			...(init?.headers || {}),
		},
		signal: AbortSignal.timeout(TIMEOUT_MS),
	});
	const text = await res.text();
	let json: Record<string, unknown> | null = null;
	try {
		const parsed: unknown = JSON.parse(text);
		if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
			json = parsed as Record<string, unknown>;
		}
	} catch {
		json = null;
	}
	return { status: res.status, ok: res.ok, json, text };
}

/** 1. Verifies GET /api/mcp and JSON-RPC POST /api/mcp (tools/list) return 200 OK. */
export async function verifyLiveEndpointHealth(baseUrl: string): Promise<EndpointHealth> {
	const mcpUrl = `${baseUrl}/api/mcp`;
	try {
		const [getRes, rpcRes] = await Promise.all([
			fetchJsonOrText(mcpUrl, { method: 'GET' }),
			fetchJsonOrText(mcpUrl, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					jsonrpc: '2.0',
					id: 1,
					method: 'tools/list',
					params: {},
				}),
			}),
		]);

		const result = rpcRes.json?.result as { tools?: { name?: string }[] } | undefined;
		const toolNames = Array.isArray(result?.tools)
			? result.tools.map((t) => String(t.name || '')).filter(Boolean)
			: [];
		const online = getRes.status === 200 && rpcRes.status === 200 && toolNames.length > 0;

		return {
			online,
			getStatus: getRes.status,
			rpcStatus: rpcRes.status,
			toolNames,
			...(online ? {} : { error: `Unexpected response (GET ${getRes.status}, RPC tools/list ${rpcRes.status})` }),
		};
	} catch (err) {
		return {
			online: false,
			getStatus: 0,
			rpcStatus: 0,
			toolNames: [],
			error: err instanceof Error ? err.message : 'Health probe failed',
		};
	}
}

/** Checks manifest validity locally and reachability over HTTP(S). */
export async function verifyManifests(cwd: string, baseUrl: string): Promise<ManifestCheck[]> {
	const targets: { name: string; localPath: string; livePath: string; validate: (raw: string) => { ok: boolean; detail: string } }[] = [
		{
			name: 'server.json (Official MCP Schema)',
			localPath: 'server.json',
			livePath: '/server.json',
			validate: (raw) => {
				try {
					const j = JSON.parse(raw) as { name?: string; version?: string; remotes?: { type?: string; url?: string }[] };
					const validName = typeof j.name === 'string' && /^[a-zA-Z0-9.-]+\/[a-zA-Z0-9._-]+$/.test(j.name);
					const validRemote = Array.isArray(j.remotes) && j.remotes.some((r) => r.type === 'streamable-http' && r.url === 'https://techfiyr.com/api/mcp');
					return { ok: validName && Boolean(j.version) && validRemote, detail: validName && validRemote ? `${j.name} v${j.version}` : 'Invalid reverse-DNS name or remote transport' };
				} catch {
					return { ok: false, detail: 'Malformed JSON' };
				}
			},
		},
		{
			name: 'mcp.json (Root Manifest)',
			localPath: 'mcp.json',
			livePath: '/mcp.json',
			validate: (raw) => {
				try {
					const j = JSON.parse(raw) as { name?: string; transport?: { type?: string; url?: string } };
					const ok = j.name === 'techfiyr-ai-native-software-agency' && j.transport?.url === 'https://techfiyr.com/api/mcp';
					return { ok, detail: ok ? `transport=${j.transport?.type}` : 'Missing name or transport.url' };
				} catch {
					return { ok: false, detail: 'Malformed JSON' };
				}
			},
		},
		{
			name: 'glama.json (Glama Ownership)',
			localPath: 'glama.json',
			livePath: '/.well-known/mcp.json',
			validate: (raw) => {
				try {
					const j = JSON.parse(raw) as { maintainers?: string[] };
					const ok = Array.isArray(j.maintainers) && j.maintainers.length > 0;
					return { ok, detail: ok ? `maintainers: ${j.maintainers?.join(', ')}` : 'Missing maintainers[]' };
				} catch {
					return { ok: false, detail: 'Malformed JSON' };
				}
			},
		},
		{
			name: 'llms.txt',
			localPath: 'public/llms.txt',
			livePath: '/llms.txt',
			validate: (raw) => ({
				ok: raw.includes('https://techfiyr.com/api/mcp'),
				detail: raw.includes('/api/mcp') ? 'Contains /api/mcp & agency brief' : 'Missing /api/mcp reference',
			}),
		},
		{
			name: 'llms-install.md',
			localPath: 'llms-install.md',
			livePath: '/llms-install.md',
			validate: (raw) => ({
				ok: raw.includes('https://techfiyr.com/api/mcp') && raw.includes('mcpServers'),
				detail: 'Quick-mount guide present',
			}),
		},
		{
			name: '/.well-known/mcp.json',
			localPath: 'public/.well-known/mcp.json',
			livePath: '/.well-known/mcp.json',
			validate: (raw) => {
				try {
					const j = JSON.parse(raw) as { transport?: { url?: string }; tools?: unknown[] };
					const ok = j.transport?.url === 'https://techfiyr.com/api/mcp' && Array.isArray(j.tools);
					return { ok, detail: ok ? `${j.tools?.length ?? 0} tools declared` : 'Incomplete manifest' };
				} catch {
					return { ok: false, detail: 'Malformed JSON' };
				}
			},
		},
		{
			name: '/.well-known/agent-card.json',
			localPath: 'public/.well-known/agent.json',
			livePath: '/.well-known/agent-card.json',
			validate: (raw) => {
				try {
					const j = JSON.parse(raw) as { protocols?: { mcp?: { endpoint?: string } } };
					const ok = j.protocols?.mcp?.endpoint === 'https://techfiyr.com/api/mcp';
					return { ok, detail: ok ? 'A2A + MCP protocols declared' : 'Missing MCP reference' };
				} catch {
					return { ok: false, detail: 'Malformed JSON' };
				}
			},
		},
	];

	return Promise.all(
		targets.map(async (t) => {
			const full = join(cwd, t.localPath);
			const localExists = existsSync(full);
			const validation = localExists ? t.validate(readFileSync(full, 'utf8')) : { ok: false, detail: 'File missing locally' };
			let liveStatus = 0;
			try {
				const res = await fetch(`${baseUrl}${t.livePath}`, { method: 'GET', signal: AbortSignal.timeout(7000) });
				liveStatus = res.status;
			} catch {
				liveStatus = 0;
			}
			return {
				name: t.name,
				localExists,
				localValid: validation.ok,
				liveUrl: `${baseUrl}${t.livePath}`,
				liveStatus,
				detail: validation.detail,
			};
		}),
	);
}

/** Verifies Marketing Agent key isolation & optionally triggers live Marketing Agent network broadcast. */
export async function verifyAndBroadcastMarketingAgent(baseUrl: string, dryRun: boolean): Promise<DirectoryResult> {
	const mktKey = (process.env.AGENT_MARKETING_API_KEY || '').trim();
	const salesKey = (process.env.AGENT_SALES_API_KEY || '').trim();
	const target = `${baseUrl}/api/agent/marketing`;

	if (!mktKey) {
		return {
			directory: 'TechFiyr Marketing Agent',
			target,
			method: 'POST',
			status: 0,
			outcome: 'error',
			detail: 'AGENT_MARKETING_API_KEY is not set in environment / .env.local',
		};
	}

	if (salesKey && mktKey === salesKey) {
		return {
			directory: 'TechFiyr Marketing Agent',
			target,
			method: 'POST',
			status: 0,
			outcome: 'error',
			detail: 'AGENT_MARKETING_API_KEY matches AGENT_SALES_API_KEY — keys should be distinct',
		};
	}

	if (dryRun) {
		try {
			const probe = await fetchJsonOrText(target, { method: 'GET' });
			return {
				directory: 'TechFiyr Marketing Agent',
				target,
				method: 'GET',
				status: probe.status,
				outcome: 'dry-run',
				detail: `Distinct AGENT_MARKETING_API_KEY configured (len=${mktKey.length}); live brief endpoint HTTP ${probe.status}`,
			};
		} catch (err) {
			return {
				directory: 'TechFiyr Marketing Agent',
				target,
				method: 'GET',
				status: 0,
				outcome: 'error',
				detail: err instanceof Error ? err.message : 'Reachability check failed',
			};
		}
	}

	try {
		const res = await fetchJsonOrText(target, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${mktKey}`,
			},
			body: JSON.stringify({
				action: 'broadcast_registries',
				partnerAgentName: 'submitMcpRegistries-cli',
			}),
		});
		return {
			directory: 'TechFiyr Marketing Agent',
			target,
			method: 'POST',
			status: res.status,
			outcome: res.ok ? 'submitted' : 'error',
			detail: res.ok
				? 'Authenticated via AGENT_MARKETING_API_KEY; IndexNow & manifest probes executed'
				: `HTTP ${res.status}: ${String(res.json?.error || res.text.slice(0, 120))}`,
		};
	} catch (err) {
		return {
			directory: 'TechFiyr Marketing Agent',
			target,
			method: 'POST',
			status: 0,
			outcome: 'error',
			detail: err instanceof Error ? err.message : 'Marketing broadcast failed',
		};
	}
}

/** 2 & 3. Submits metadata payload to open MCP directories and triggers Smithery index webhook. */
export async function submitToDirectoriesAndSmithery(repoUrl: string, dryRun: boolean): Promise<DirectoryResult[]> {
	const submissionPayload = {
		name: 'techfiyr-ai-native-software-agency',
		serverName: 'com.techfiyr/ai-native-software-agency',
		title: 'TechFiyr AI-Native Software Agency',
		url: 'https://techfiyr.com/api/mcp',
		endpoint: 'https://techfiyr.com/api/mcp',
		homepage: 'https://techfiyr.com',
		repository: repoUrl,
		manifestUrl: 'https://techfiyr.com/.well-known/mcp.json',
		serverJsonUrl: 'https://techfiyr.com/server.json',
		description:
			'AI-native software agency delivering custom web, mobile, and SaaS engineering within a 7-day turnaround.',
		category: 'developer-tools',
		tags: ['developer-tools', 'agency', 'mvp', 'flutter', 'nextjs', 'a2a', 'mcp'],
		transport: 'streamable-http',
		license: 'MIT',
	};

	const results: DirectoryResult[] = [];

	// Check Official MCP Registry index (GET search)
	try {
		const regUrl = 'https://registry.modelcontextprotocol.io/v0.1/servers?search=techfiyr';
		const reg = await fetchJsonOrText(regUrl, { method: 'GET' });
		const rawServers = Array.isArray(reg.json?.servers) ? reg.json.servers : [];
		const matched = rawServers.filter((entry) => JSON.stringify(entry).toLowerCase().includes('techfiyr')).length;
		results.push({
			directory: 'Official MCP Registry',
			target: regUrl,
			method: 'GET',
			status: reg.status,
			outcome: reg.ok && matched > 0 ? 'indexed' : 'manual-fallback',
			detail:
				matched > 0
					? `Found ${matched} matching listing(s)`
					: 'Not indexed yet — run: npx @modelcontextprotocol/publisher publish',
		});
	} catch (err) {
		results.push({
			directory: 'Official MCP Registry',
			target: 'https://registry.modelcontextprotocol.io/v0.1/servers',
			method: 'GET',
			status: 0,
			outcome: 'error',
			detail: err instanceof Error ? err.message : 'Registry query failed',
		});
	}

	// Open directory HTTP submission targets
	const directoryPosts: { directory: string; url: string; fallbackPortal: string }[] = [
		{
			directory: 'mcpservers.org',
			url: (process.env.MCPSERVERS_SUBMIT_URL || 'https://mcpservers.org/api/submit').trim(),
			fallbackPortal: 'https://mcpservers.org/submit',
		},
		{
			directory: 'mcp.directory',
			url: (process.env.MCP_DIRECTORY_SUBMIT_URL || 'https://mcp.directory/api/submit').trim(),
			fallbackPortal: 'https://mcp.directory',
		},
	];

	for (const d of directoryPosts) {
		if (dryRun) {
			results.push({
				directory: d.directory,
				target: d.url,
				method: 'POST',
				status: 0,
				outcome: 'dry-run',
				detail: `Dry-run skipped POST; web form portal: ${d.fallbackPortal}`,
			});
			continue;
		}
		try {
			const res = await fetchJsonOrText(d.url, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
				body: JSON.stringify(submissionPayload),
			});
			const looksHtml = !res.json && /<!doctype|<html/i.test(res.text);
			results.push({
				directory: d.directory,
				target: d.url,
				method: 'POST',
				status: res.status,
				outcome: res.ok && !looksHtml ? 'submitted' : 'manual-fallback',
				detail:
					res.ok && !looksHtml
						? `Submitted cleanly (HTTP ${res.status})`
						: `HTTP ${res.status}${looksHtml ? ' (HTML page / no open JSON submit API)' : ''} — submit via browser at ${d.fallbackPortal}`,
			});
		} catch (err) {
			results.push({
				directory: d.directory,
				target: d.url,
				method: 'POST',
				status: 0,
				outcome: 'error',
				detail: err instanceof Error ? err.message : 'Directory request failed',
			});
		}
	}

	// Smithery registry lookup & repo-index webhook
	const smitheryLookupUrl = 'https://registry.smithery.ai/servers?search=techfiyr';
	try {
		const check = await fetchJsonOrText(smitheryLookupUrl, { method: 'GET' });
		const rawServers = Array.isArray(check.json?.servers) ? check.json.servers : [];
		const found = rawServers.filter((entry) => JSON.stringify(entry).toLowerCase().includes('techfiyr')).length;
		if (dryRun) {
			results.push({
				directory: 'Smithery Registry',
				target: smitheryLookupUrl,
				method: 'GET',
				status: check.status,
				outcome: found > 0 ? 'indexed' : 'dry-run',
				detail:
					found > 0
						? `Already indexed (${found} result)`
						: `Live check HTTP ${check.status}; connect repo at https://smithery.ai (${repoUrl})`,
			});
		} else {
			const webhookUrl = (process.env.SMITHERY_WEBHOOK_URL || 'https://registry.smithery.ai/servers').trim();
			const headers: Record<string, string> = { 'Content-Type': 'application/json', Accept: 'application/json' };
			if (process.env.SMITHERY_API_KEY) {
				headers.Authorization = `Bearer ${process.env.SMITHERY_API_KEY.trim()}`;
			}
			const postRes = await fetchJsonOrText(webhookUrl, {
				method: 'POST',
				headers,
				body: JSON.stringify({
					qualifiedName: 'com.techfiyr/ai-native-software-agency',
					repositoryUrl: repoUrl,
					homepage: 'https://techfiyr.com',
					remoteUrl: 'https://techfiyr.com/api/mcp',
					connections: [{ type: 'http', deploymentUrl: 'https://techfiyr.com/api/mcp' }],
				}),
			});
			results.push({
				directory: 'Smithery Registry',
				target: webhookUrl,
				method: 'POST',
				status: postRes.status,
				outcome: postRes.ok ? 'submitted' : found > 0 ? 'indexed' : 'manual-fallback',
				detail: postRes.ok
					? `Repo-index webhook accepted (HTTP ${postRes.status})`
					: `HTTP ${postRes.status} — connect ${repoUrl} directly at https://smithery.ai`,
			});
		}
	} catch (err) {
		results.push({
			directory: 'Smithery Registry',
			target: 'https://registry.smithery.ai/servers',
			method: 'POST',
			status: 0,
			outcome: 'error',
			detail: err instanceof Error ? err.message : 'Smithery request failed',
		});
	}

	return results;
}

/** 4. Drafts or creates a fork + PR for punkpeye/awesome-mcp-servers using GITHUB_TOKEN. */
export async function createAwesomeMcpPullRequest(
	cwd: string,
	repoUrl: string,
	dryRun: boolean,
): Promise<{ status: string; prUrl: string; draftPath: string; entryLine: string }> {
	const repoSlug = repoUrl.replace(/^https:\/\/github\.com\//i, '');
	const entryLine = `- [${repoSlug}](${repoUrl}) 📇 ☁️ - AI-native software agency MCP server (\`https://techfiyr.com/api/mcp\`): deterministic project quoting, 7-day MVP SLA ($600+ USD), Gemini sales negotiation, order intake, and GEO/AEO partner briefs.`;
	const branchName = 'add-techfiyr-mcp-server';

	const serverDir = join(cwd, '.server');
	mkdirSync(serverDir, { recursive: true });
	const draftPath = join(serverDir, 'awesome-mcp-pr-draft.md');

	const draftContent = [
		'# Pull Request Draft: Add TechFiyr AI-Native Software Agency MCP Server',
		'',
		'- **Target repository:** `https://github.com/punkpeye/awesome-mcp-servers`',
		'- **Section:** `### 💻 <a name="developer-tools"></a>Developer Tools`',
		'- **Branch name:** `' + branchName + '`',
		'',
		'## Line to add in `README.md`',
		'',
		'```markdown',
		entryLine,
		'```',
		'',
		'## Suggested PR Body',
		'',
		'Adds TechFiyr (`https://techfiyr.com/api/mcp`), an open remote Streamable HTTP MCP server for software engineering discovery, deterministic scope/cost quoting, Gemini-assisted negotiation, order tracking, and A2A marketing briefs.',
		'',
		'- Endpoint: https://techfiyr.com/api/mcp',
		'- Manifest: https://techfiyr.com/.well-known/mcp.json',
		'- Server Schema: https://techfiyr.com/server.json',
		'- Install Guide: https://techfiyr.com/llms-install.md',
	].join('\n');

	writeFileSync(draftPath, `${draftContent}\n`, 'utf8');

	const githubToken = (process.env.GITHUB_TOKEN || '').trim();
	if (!githubToken || dryRun) {
		return {
			status: !githubToken ? 'GITHUB_TOKEN missing — saved local PR draft' : 'dry-run — saved local PR draft',
			prUrl: 'https://github.com/punkpeye/awesome-mcp-servers/compare',
			draftPath,
			entryLine,
		};
	}

	const ghHeaders = {
		Authorization: `Bearer ${githubToken}`,
		Accept: 'application/vnd.github+json',
		'X-GitHub-Api-Version': '2022-11-28',
		'Content-Type': 'application/json',
		'User-Agent': 'TechFiyr-MCP-Registrar',
	};

	try {
		const me = await fetchJsonOrText('https://api.github.com/user', { headers: ghHeaders });
		const login = String(me.json?.login || '').trim();
		if (!me.ok || !login) {
			return {
				status: `GitHub auth failed (HTTP ${me.status}) — saved local PR draft`,
				prUrl: 'https://github.com/punkpeye/awesome-mcp-servers/compare',
				draftPath,
				entryLine,
			};
		}

		// Ensure fork exists
		const forkRes = await fetchJsonOrText('https://api.github.com/repos/punkpeye/awesome-mcp-servers/forks', {
			method: 'POST',
			headers: ghHeaders,
			body: JSON.stringify({ default_branch_only: true }),
		});
		if (!forkRes.ok && forkRes.status !== 202) {
			return {
				status: `Fork failed (HTTP ${forkRes.status}) — saved local PR draft`,
				prUrl: 'https://github.com/punkpeye/awesome-mcp-servers/compare',
				draftPath,
				entryLine,
			};
		}

		// Read upstream README.md + main commit SHA
		const [readmeRes, refRes] = await Promise.all([
			fetchJsonOrText('https://api.github.com/repos/punkpeye/awesome-mcp-servers/contents/README.md', { headers: ghHeaders }),
			fetchJsonOrText('https://api.github.com/repos/punkpeye/awesome-mcp-servers/git/ref/heads/main', { headers: ghHeaders }),
		]);

		const readmeB64 = String(readmeRes.json?.content || '');
		const readmeSha = String(readmeRes.json?.sha || '');
		const headSha = String((refRes.json?.object as { sha?: string } | undefined)?.sha || '');
		if (!readmeB64 || !readmeSha || !headSha) {
			return {
				status: 'Unable to read upstream README.md/SHA — saved local PR draft',
				prUrl: `https://github.com/${login}/awesome-mcp-servers`,
				draftPath,
				entryLine,
			};
		}

		const currentReadme = Buffer.from(readmeB64, 'base64').toString('utf8');
		if (currentReadme.includes(repoUrl)) {
			return {
				status: 'Already listed in punkpeye/awesome-mcp-servers',
				prUrl: 'https://github.com/punkpeye/awesome-mcp-servers/blob/main/README.md',
				draftPath,
				entryLine,
			};
		}

		const marker = '### 💻 <a name="developer-tools"></a>Developer Tools';
		const idx = currentReadme.indexOf(marker);
		if (idx === -1) {
			return {
				status: 'Developer Tools heading not found in upstream README — saved local PR draft',
				prUrl: `https://github.com/${login}/awesome-mcp-servers`,
				draftPath,
				entryLine,
			};
		}

		const insertPos = idx + marker.length;
		const updatedReadme = `${currentReadme.slice(0, insertPos)}\n${entryLine}${currentReadme.slice(insertPos)}`;

		// Create branch on fork (ignore 422 if branch already exists)
		await fetchJsonOrText(`https://api.github.com/repos/${login}/awesome-mcp-servers/git/refs`, {
			method: 'POST',
			headers: ghHeaders,
			body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha: headSha }),
		});

		// Get fork file SHA in case fork already had branch
		const forkFile = await fetchJsonOrText(
			`https://api.github.com/repos/${login}/awesome-mcp-servers/contents/README.md?ref=${branchName}`,
			{ headers: ghHeaders },
		);
		const fileSha = String(forkFile.json?.sha || readmeSha);

		const commitRes = await fetchJsonOrText(
			`https://api.github.com/repos/${login}/awesome-mcp-servers/contents/README.md`,
			{
				method: 'PUT',
				headers: ghHeaders,
				body: JSON.stringify({
					message: 'Add TechFiyr AI software agency MCP server',
					content: Buffer.from(updatedReadme, 'utf8').toString('base64'),
					sha: fileSha,
					branch: branchName,
				}),
			},
		);

		if (!commitRes.ok) {
			return {
				status: `Fork commit returned HTTP ${commitRes.status} (fork may still be provisioning) — saved local PR draft`,
				prUrl: `https://github.com/punkpeye/awesome-mcp-servers/compare/main...${login}:${branchName}`,
				draftPath,
				entryLine,
			};
		}

		const prRes = await fetchJsonOrText('https://api.github.com/repos/punkpeye/awesome-mcp-servers/pulls', {
			method: 'POST',
			headers: ghHeaders,
			body: JSON.stringify({
				title: 'Add TechFiyr AI-Native Software Agency MCP Server',
				head: `${login}:${branchName}`,
				base: 'main',
				draft: true,
				body: `Adds TechFiyr (${repoUrl}) with remote Streamable HTTP endpoint \`https://techfiyr.com/api/mcp\`, verified schemas at \`https://techfiyr.com/.well-known/mcp.json\` and \`https://techfiyr.com/server.json\`.`,
			}),
		});

		const htmlUrl = String(prRes.json?.html_url || `https://github.com/punkpeye/awesome-mcp-servers/compare/main...${login}:${branchName}`);
		return {
			status: prRes.ok ? 'Draft PR created cleanly' : `Committed branch on fork (PR API HTTP ${prRes.status})`,
			prUrl: htmlUrl,
			draftPath,
			entryLine,
		};
	} catch (err) {
		return {
			status: `GitHub API error (${err instanceof Error ? err.message : 'unknown'}) — saved local PR draft`,
			prUrl: 'https://github.com/punkpeye/awesome-mcp-servers/compare',
			draftPath,
			entryLine,
		};
	}
}

async function main(): Promise<void> {
	const cwd = resolve(process.cwd());
	loadLocalEnv(cwd);

	const opts = parseArgs(process.argv.slice(2));
	const repoUrl = resolveGitHubRepoUrl(cwd, opts.repoUrl);

	console.log('\n============================================================');
	console.log(' TechFiyr MCP Registry & Agent Network Broadcast CLI');
	console.log('============================================================');
	console.log(`Target Base URL : ${opts.baseUrl}`);
	console.log(`Repository URL  : ${repoUrl}`);
	console.log(`Mode            : ${opts.dryRun ? 'DRY RUN (no external mutations)' : 'LIVE SUBMISSION & BROADCAST'}\n`);

	const [health, manifests, marketingRes, dirResults, awesomePr] = await Promise.all([
		verifyLiveEndpointHealth(opts.baseUrl),
		verifyManifests(cwd, opts.baseUrl),
		verifyAndBroadcastMarketingAgent(opts.baseUrl, opts.dryRun),
		submitToDirectoriesAndSmithery(repoUrl, opts.dryRun),
		createAwesomeMcpPullRequest(cwd, repoUrl, opts.dryRun),
	]);

	console.log('1. ENDPOINT HEALTH CHECK');
	console.log('------------------------------------------------------------');
	console.table([
		{
			Endpoint: `${opts.baseUrl}/api/mcp`,
			Status: health.online ? 'ONLINE' : 'OFFLINE',
			GET: health.getStatus,
			RPC_tools_list: health.rpcStatus,
			Tools: health.toolNames.length ? health.toolNames.join(', ') : health.error || 'None',
		},
	]);

	console.log('2. MANIFEST VERIFICATION');
	console.log('------------------------------------------------------------');
	console.table(
		manifests.map((m) => ({
			Manifest: m.name,
			Local: m.localExists && m.localValid ? 'OK' : m.localExists ? 'INVALID' : 'MISSING',
			Live_HTTP: m.liveStatus || 'ERR',
			Detail: m.detail,
		})),
	);

	console.log('3. MARKETING AGENT & DIRECTORY BROADCAST');
	console.log('------------------------------------------------------------');
	console.table(
		[marketingRes, ...dirResults].map((r) => ({
			Target: r.directory,
			Method: r.method,
			HTTP: r.status || '-',
			Outcome: r.outcome.toUpperCase(),
			Detail: r.detail,
		})),
	);

	console.log('4. AWESOME-MCP-SERVERS PULL REQUEST / DRAFT');
	console.log('------------------------------------------------------------');
	console.log(`Status     : ${awesomePr.status}`);
	console.log(`PR / Link  : ${awesomePr.prUrl}`);
	console.log(`Local Draft: ${awesomePr.draftPath}`);

	const reportPath = join(cwd, '.server', 'mcp-submission-report.json');
	writeFileSync(
		reportPath,
		`${JSON.stringify({ ranAt: new Date().toISOString(), options: opts, repoUrl, health, manifests, directories: [marketingRes, ...dirResults], awesomePr }, null, 2)}\n`,
		'utf8',
	);

	console.log('\n5. NEXT MANUAL / CLI PUBLISHING COMMANDS');
	console.log('------------------------------------------------------------');
	console.log('• Official MCP Registry (domain HTTP verification via techfiyr.com/.well-known/mcp-registry-auth):');
	console.log('    npm install -g @modelcontextprotocol/publisher');
	console.log('    mcp-publisher login http --domain techfiyr.com --private-key "$MCP_REGISTRY_PRIVATE_KEY"');
	console.log('    npx @modelcontextprotocol/publisher publish');
	console.log('• Or via GitHub organization OAuth (if publishing io.github.techfiyr/...):');
	console.log('    mcp-publisher login github && npx @modelcontextprotocol/publisher publish');
	console.log(`• Interactive portals (when API returns 404/HTML):`);
	console.log(`    - Glama (claims via glama.json): https://glama.ai/mcp/servers (${repoUrl})`);
	console.log(`    - Smithery: https://smithery.ai (${repoUrl})`);
	console.log('    - PulseMCP: https://pulsemcp.com/submit');
	console.log('    - mcpservers.org: https://mcpservers.org/submit');
	console.log('    - A2A Card Discovery: https://techfiyr.com/.well-known/agent-card.json');
	console.log(`\nFull JSON report written to ${reportPath}\n`);

	if (!health.online) {
		process.exitCode = 1;
	}
}

main().catch((err) => {
	console.error('[submitMcpRegistries] Fatal error:', err instanceof Error ? err.message : err);
	process.exit(1);
});

