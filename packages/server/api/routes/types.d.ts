import type { Ai } from "../../lib/ai";
import type { Db } from "../../lib/db";
import type { EventBus } from "../../lib/events/bus";

export type RouterEnv = {
	Variables: {
		appState: AppState;
	};
};

export interface AppState {
	eventBus: EventBus;
	db: Db;
	ai: Ai;
}
