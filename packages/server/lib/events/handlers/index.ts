import type { AppState } from "../../../api/routes/types";
import registerChapterEventHandlers from "./chapter";
import registerUserEventHandlers from "./user";

export function registerEventHandlers(appState: AppState) {
	registerUserEventHandlers(appState);
	registerChapterEventHandlers(appState);
}
