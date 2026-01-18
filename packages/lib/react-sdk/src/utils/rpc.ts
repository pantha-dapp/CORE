import type { ApiType } from "@pantha/server";
import { hc } from "hono/client";

type HonoClient = ReturnType<typeof hc<ApiType>>;

export default class ApiClient {
	private _client: HonoClient;
	private _authHeader: { Authorization: `Bearer ${string}` };
	private _baseUrl: string;

	constructor(baseUrl: string) {
		this._baseUrl = baseUrl;
		this._authHeader = { Authorization: "Bearer null" };
		this._client = this.createClient();
	}

	private createClient() {
		const instance = hc<ApiType>(this._baseUrl, {
			headers: {
				Authorization: this._authHeader.Authorization,
			},
		});
		return instance;
	}

	public ensureJwt() {
		if (!this.jwtExists) {
			throw new Error("JWT token is missing - user is not logged in");
		}
	}

	get jwtExists() {
		return this._authHeader.Authorization !== "Bearer null";
	}

	get rpc() {
		return this._client.api;
	}

	setJwt(authToken: string | null) {
		this._authHeader = { Authorization: `Bearer ${authToken}` };
		this._client = this.createClient();
	}
}
