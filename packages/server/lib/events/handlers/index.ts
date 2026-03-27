import type { AppState } from "../../../api/routes/types";
import registerChapterEventHandlers from "./chapter";
import registerChatEventHandlers from "./chat";
import registerCourseEventHandlers from "./course";
import registerUserEventHandlers from "./user";

export function registerEventHandlers(appState: AppState) {
	registerUserEventHandlers(appState);
	registerChapterEventHandlers(appState);
	registerCourseEventHandlers(appState);
	registerChatEventHandlers(appState);
}
