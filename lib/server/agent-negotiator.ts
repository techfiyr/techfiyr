/*
 * Thin adapter keeping legacy imports working via the unified Gemini Sales Agent (lib/server/salesAgent.ts).
 */
export {
	runSalesAgent as negotiateWithAgent,
	type SalesAgentInput as NegotiateInput,
	type SalesAgentResult as NegotiateResult,
} from './salesAgent';
