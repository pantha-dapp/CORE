import type { AppState } from "../../../../api/routes/types";
import registerGroupChatHandlers from "./group";

export default function (appState: AppState) {
	registerGroupChatHandlers(appState);
}
