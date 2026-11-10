/*
 * Strict AI Developer-Ready Software Requirements Specification (SRS) schema
 * and deterministic Markdown / Coding-Agent prompt formatters.
 */

export type SrsColumn = {
	name: string;
	data_type: string;
	nullable: boolean;
	primary_key?: boolean;
	unique?: boolean;
	default_value?: string;
};

export type SrsForeignKey = {
	column: string;
	references_table: string;
	references_column: string;
	on_delete: 'CASCADE' | 'SET NULL' | 'RESTRICT';
};

export type SrsDatabaseModel = {
	table_name: string;
	description: string;
	columns: SrsColumn[];
	foreign_keys: SrsForeignKey[];
};

export type SrsApiEndpoint = {
	method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
	route: string;
	auth_required: boolean;
	description: string;
	request_payload: Record<string, unknown>;
	response_schema: Record<string, unknown>;
};

export type SrsUiScreen = {
	screen_id: string;
	route: string;
	title: string;
	components: string[];
	user_interactions: string[];
	child_routes?: string[];
};

export type SrsMilestoneStep = {
	day: number;
	phase: string;
	payment_percent: number;
	deliverables: string[];
};

export type SrsAcceptanceCriterion = {
	id: string;
	category: 'api' | 'database' | 'ui' | 'security' | 'ci_cd';
	assertion: string;
	verification_command?: string;
};

export type AiDeveloperSrs = {
	project_id: string;
	project_title: string;
	executive_overview: string;
	tech_stack: {
		frontend: string[];
		backend: string[];
		database: string[];
		mobile?: string[];
		devops: string[];
	};
	architecture_pattern: string;
	database_models: SrsDatabaseModel[];
	api_endpoints: SrsApiEndpoint[];
	ui_screens: SrsUiScreen[];
	milestone_breakdown: SrsMilestoneStep[];
	acceptance_criteria: SrsAcceptanceCriterion[];
};

/** Classifies a flat tech stack list into structured SRS layers. */
export function classifyTechStack(stack: string[]): AiDeveloperSrs['tech_stack'] {
	const frontend: string[] = [];
	const backend: string[] = [];
	const database: string[] = [];
	const mobile: string[] = [];
	const devops: string[] = [];

	for (const item of stack) {
		const lower = item.toLowerCase();
		if (/(flutter|react native|ios|android|dart)/.test(lower)) mobile.push(item);
		else if (/(postgres|supabase|firebase|firestore|mysql|mongo|redis)/.test(lower)) database.push(item);
		else if (/(docker|codemagic|aws|netlify|vercel|github actions)/.test(lower)) devops.push(item);
		else if (/(node|express|fastify|fastapi|python|java|spring|laravel|graphql|rest)/.test(lower)) backend.push(item);
		else frontend.push(item);
	}

	if (!frontend.length && !mobile.length) frontend.push('Next.js', 'React', 'TypeScript');
	if (!backend.length) backend.push('Node.js');
	if (!database.length) database.push('PostgreSQL');
	if (!devops.length) devops.push('Docker', 'GitHub Actions');

	return {
		frontend,
		backend,
		database,
		...(mobile.length ? { mobile } : {}),
		devops,
	};
}

export function buildMilestoneBreakdown(deliveryDays = 7): SrsMilestoneStep[] {
	const midDay = deliveryDays <= 7 ? 4 : Math.round(deliveryDays * 0.55);
	return [
		{
			day: 1,
			phase: 'Day 1: Schema + Boilerplate & Architecture Lock',
			payment_percent: 25,
			deliverables: [
				'Modular monorepo scaffold + Docker configuration',
				'Database migrations, core entities, and auth middleware',
				'Environment template and CI lint/typecheck pipeline',
			],
		},
		{
			day: midDay,
			phase: `Day ${midDay}: Staging MVP Delivery`,
			payment_percent: 50,
			deliverables: [
				'Core CRUD API endpoints and frontend/mobile screens wired end-to-end',
				'Live staging URL / TestFlight or APK preview build',
				'Automated integration test suite passing in Docker',
			],
		},
		{
			day: deliveryDays,
			phase: `Day ${deliveryDays}: Final Release & Repository Handover`,
			payment_percent: 25,
			deliverables: [
				'Security audit, performance check, and production build verification',
				'GitHub repository transfer / org invite and deployment runbook',
				'Final handover report and escrow/milestone release',
			],
		},
	];
}

export function buildFallbackSrs(params: {
	projectId: string;
	projectTitle: string;
	scopeSummary: string;
	techStack: string[];
	deliveryDays?: number;
}): AiDeveloperSrs {
	const days = params.deliveryDays || 7;
	const stack = classifyTechStack(params.techStack);
	const isMobile = Boolean(stack.mobile?.length);

	return {
		project_id: params.projectId,
		project_title: params.projectTitle,
		executive_overview: params.scopeSummary,
		tech_stack: stack,
		architecture_pattern: isMobile ? 'clean-architecture-mobile-monorepo' : 'modular-monorepo',
		database_models: [
			{
				table_name: 'users',
				description: 'Authenticated application principals and roles.',
				columns: [
					{ name: 'id', data_type: 'uuid', nullable: false, primary_key: true },
					{ name: 'email', data_type: 'varchar(255)', nullable: false, unique: true },
					{ name: 'role', data_type: 'varchar(32)', nullable: false, default_value: "'member'" },
					{ name: 'created_at', data_type: 'timestamptz', nullable: false, default_value: 'now()' },
				],
				foreign_keys: [],
			},
			{
				table_name: 'records',
				description: 'Primary domain entity mapped from client specification.',
				columns: [
					{ name: 'id', data_type: 'uuid', nullable: false, primary_key: true },
					{ name: 'owner_id', data_type: 'uuid', nullable: false },
					{ name: 'title', data_type: 'varchar(160)', nullable: false },
					{ name: 'status', data_type: 'varchar(32)', nullable: false, default_value: "'active'" },
					{ name: 'payload', data_type: 'jsonb', nullable: false, default_value: "'{}'::jsonb" },
					{ name: 'updated_at', data_type: 'timestamptz', nullable: false, default_value: 'now()' },
				],
				foreign_keys: [
					{
						column: 'owner_id',
						references_table: 'users',
						references_column: 'id',
						on_delete: 'CASCADE',
					},
				],
			},
		],
		api_endpoints: [
			{
				method: 'GET',
				route: '/api/health',
				auth_required: false,
				description: 'Container readiness and database health probe.',
				request_payload: {},
				response_schema: { ok: 'boolean', uptime_sec: 'number' },
			},
			{
				method: 'GET',
				route: '/api/records',
				auth_required: true,
				description: 'List paginated domain records owned by the authenticated principal.',
				request_payload: { page: 'number?', limit: 'number?' },
				response_schema: { items: 'Record[]', total: 'number' },
			},
			{
				method: 'POST',
				route: '/api/records',
				auth_required: true,
				description: 'Validate and persist a new domain record.',
				request_payload: { title: 'string', payload: 'object' },
				response_schema: { id: 'string', status: 'string', created_at: 'string' },
			},
		],
		ui_screens: isMobile
			? [
					{
						screen_id: 'auth_gate',
						route: '/auth',
						title: 'Sign In & Onboarding',
						components: ['AuthForm', 'ValidationBanner', 'PrimaryButton'],
						user_interactions: ['Sign in with email/password', 'Recover session token'],
					},
					{
						screen_id: 'home_dashboard',
						route: '/home',
						title: 'Primary Workspace',
						components: ['SummaryMetrics', 'RecordsList', 'CreateActionSheet'],
						user_interactions: ['Pull to refresh', 'Filter records', 'Create or update item'],
						child_routes: ['/home/detail/:id'],
					},
				]
			: [
					{
						screen_id: 'auth_login',
						route: '/login',
						title: 'Authentication Gate',
						components: ['CredentialsForm', 'SessionGuard'],
						user_interactions: ['Authenticate user', 'Redirect to workspace'],
					},
					{
						screen_id: 'app_dashboard',
						route: '/dashboard',
						title: `${params.projectTitle} Workspace`,
						components: ['SidebarNav', 'DataTable', 'RecordModal', 'StatusBadge'],
						user_interactions: ['Create/edit/delete domain records', 'Filter and export records'],
						child_routes: ['/dashboard/settings'],
					},
				],
		milestone_breakdown: buildMilestoneBreakdown(days),
		acceptance_criteria: [
			{
				id: 'AC-01',
				category: 'database',
				assertion: 'Migrations apply cleanly on an empty database with foreign-key constraints enforced.',
				verification_command: 'docker compose up -d db && npm run db:migrate',
			},
			{
				id: 'AC-02',
				category: 'api',
				assertion: 'Unauthenticated calls to protected /api/* routes return HTTP 401; valid payloads return HTTP 200/201.',
				verification_command: 'npm test',
			},
			{
				id: 'AC-03',
				category: 'ui',
				assertion: 'Primary screens render without runtime console errors and complete core create/read flows.',
				verification_command: 'npm run build',
			},
			{
				id: 'AC-04',
				category: 'ci_cd',
				assertion: 'Production Docker image builds cleanly and passes /api/health smoke check.',
				verification_command: 'docker build -t app:verify .',
			},
		],
	};
}

/** Merges partial LLM SRS output with strict schema defaults so every required key is guaranteed present. */
export function normalizeSrs(
	raw: Partial<AiDeveloperSrs> | undefined,
	fallbackParams: {
		projectId: string;
		projectTitle: string;
		scopeSummary: string;
		techStack: string[];
		deliveryDays?: number;
	},
): AiDeveloperSrs {
	const base = buildFallbackSrs(fallbackParams);
	if (!raw || typeof raw !== 'object') return base;

	return {
		project_id: fallbackParams.projectId,
		project_title: typeof raw.project_title === 'string' && raw.project_title.trim() ? raw.project_title.trim() : base.project_title,
		executive_overview:
			typeof raw.executive_overview === 'string' && raw.executive_overview.trim()
				? raw.executive_overview.trim()
				: base.executive_overview,
		tech_stack:
			raw.tech_stack && typeof raw.tech_stack === 'object'
				? {
						frontend: Array.isArray(raw.tech_stack.frontend) && raw.tech_stack.frontend.length ? raw.tech_stack.frontend : base.tech_stack.frontend,
						backend: Array.isArray(raw.tech_stack.backend) && raw.tech_stack.backend.length ? raw.tech_stack.backend : base.tech_stack.backend,
						database: Array.isArray(raw.tech_stack.database) && raw.tech_stack.database.length ? raw.tech_stack.database : base.tech_stack.database,
						...(Array.isArray(raw.tech_stack.mobile) && raw.tech_stack.mobile.length
							? { mobile: raw.tech_stack.mobile }
							: base.tech_stack.mobile
								? { mobile: base.tech_stack.mobile }
								: {}),
						devops: Array.isArray(raw.tech_stack.devops) && raw.tech_stack.devops.length ? raw.tech_stack.devops : base.tech_stack.devops,
					}
				: base.tech_stack,
		architecture_pattern:
			typeof raw.architecture_pattern === 'string' && raw.architecture_pattern.trim()
				? raw.architecture_pattern.trim()
				: base.architecture_pattern,
		database_models:
			Array.isArray(raw.database_models) && raw.database_models.length ? raw.database_models : base.database_models,
		api_endpoints: Array.isArray(raw.api_endpoints) && raw.api_endpoints.length ? raw.api_endpoints : base.api_endpoints,
		ui_screens: Array.isArray(raw.ui_screens) && raw.ui_screens.length ? raw.ui_screens : base.ui_screens,
		milestone_breakdown:
			Array.isArray(raw.milestone_breakdown) && raw.milestone_breakdown.length
				? raw.milestone_breakdown
				: base.milestone_breakdown,
		acceptance_criteria:
			Array.isArray(raw.acceptance_criteria) && raw.acceptance_criteria.length
				? raw.acceptance_criteria
				: base.acceptance_criteria,
	};
}

export function srsToMarkdown(srs: AiDeveloperSrs): string {
	const stackLines = [
		`- **Frontend:** ${srs.tech_stack.frontend.join(', ') || 'N/A'}`,
		`- **Backend:** ${srs.tech_stack.backend.join(', ') || 'N/A'}`,
		`- **Database:** ${srs.tech_stack.database.join(', ') || 'N/A'}`,
		...(srs.tech_stack.mobile?.length ? [`- **Mobile:** ${srs.tech_stack.mobile.join(', ')}`] : []),
		`- **DevOps:** ${srs.tech_stack.devops.join(', ') || 'Docker'}`,
	];

	const modelSections = srs.database_models.map((m) => {
		const cols = m.columns
			.map((c) => `  - \`${c.name}\`: \`${c.data_type}\`${c.primary_key ? ' (PK)' : ''}${c.unique ? ' (UNIQUE)' : ''}${c.nullable ? ' NULL' : ' NOT NULL'}`)
			.join('\n');
		const fks = m.foreign_keys.length
			? m.foreign_keys.map((fk) => `  - FK \`${fk.column}\` -> \`${fk.references_table}.${fk.references_column}\` (ON DELETE ${fk.on_delete})`).join('\n')
			: '  - None';
		return `### Table: \`${m.table_name}\`\n${m.description}\n${cols}\n${fks}`;
	});

	const apiRows = srs.api_endpoints
		.map((e) => `| \`${e.method}\` | \`${e.route}\` | ${e.auth_required ? 'Required' : 'Public'} | ${e.description} |`)
		.join('\n');

	const screenList = srs.ui_screens
		.map(
			(s) =>
				`### ${s.title} (\`${s.route}\`)\n- **Components:** ${s.components.join(', ')}\n- **Interactions:** ${s.user_interactions.join('; ')}`,
		)
		.join('\n\n');

	const milestoneList = srs.milestone_breakdown
		.map((m) => `- **${m.phase}** (${m.payment_percent}% milestone): ${m.deliverables.join('; ')}`)
		.join('\n');

	const criteriaList = srs.acceptance_criteria
		.map((c) => `- **[${c.id}] (${c.category})**: ${c.assertion}${c.verification_command ? ` (\`${c.verification_command}\`)` : ''}`)
		.join('\n');

	return [
		`# AI-Developer-Ready SRS: ${srs.project_title} (\`${srs.project_id}\`)`,
		'',
		'## 1. Executive Overview',
		srs.executive_overview,
		'',
		`## 2. Architecture Pattern: \`${srs.architecture_pattern}\``,
		...stackLines,
		'',
		'## 3. Database Models',
		...modelSections,
		'',
		'## 4. API Endpoints',
		'| Method | Route | Auth | Description |',
		'|---|---|---|---|',
		apiRows,
		'',
		'## 5. UI Screens & Routing',
		screenList,
		'',
		'## 6. Milestone Breakdown (25% / 50% / 25%)',
		milestoneList,
		'',
		'## 7. Automated Acceptance Criteria',
		criteriaList,
	].join('\n');
}

export function srsToDevAgentPrompt(srs: AiDeveloperSrs): string {
	return [
		`You are an autonomous Principal Software Engineer scaffolding project "${srs.project_title}" (${srs.project_id}) using architecture pattern "${srs.architecture_pattern}".`,
		'',
		'INSTRUCTIONS:',
		'1. Scaffold the modular repository directory structure, Dockerfiles, and typed database migrations matching every model and foreign key below.',
		'2. Implement every API endpoint with strict input validation, authentication checks, and typed response payloads.',
		'3. Build all UI screens, routing hierarchy, and interactive components.',
		'4. Write automated tests satisfying every Acceptance Criterion and verify all verification commands pass cleanly.',
		'',
		'MACHINE-READABLE SRS JSON:',
		'```json',
		JSON.stringify(srs, null, 2),
		'```',
	].join('\n');
}

