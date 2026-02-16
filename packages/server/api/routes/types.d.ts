import type { Ai } from "../../lib/ai";
import type { Db } from "../../lib/db";
import type { EventBus } from "../../lib/events/bus";
import type { DefaultPolicyManager } from "../../lib/policies";

export type RouterEnv = {
	Variables: {
		appState: AppState;
	};
};

export interface AppState {
	eventBus: EventBus;
	policyManager: DefaultPolicyManager;
	db: Db;
	ai: Ai;
}
