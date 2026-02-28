import type { ApiType } from "@pantha/server";
import { tryCatch } from "@pantha/shared";
import { hc } from "hono/client";

type HonoClient = ReturnType<typeof hc<ApiType>>;

export default class ApiClient {
	private _client: HonoClient;
	private _authHeader: { Authorization: `Bearer ${string}` };
	private _baseUrl: string;
	private _onResponse: (response: Response) => void = () => {};
	private _onError: (error: unknown) => void = () => {};

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
			fetch: async (...args: Parameters<typeof fetch>) => {
				const response = await tryCatch(fetch(...args));
				if (response.error) {
					this._onError?.(response.error);
					throw response.error;
				}
				this._onResponse?.(response.data);

				return response.data;
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

	onError(callback: (error: unknown) => void) {
		this._onError = callback;
	}

	onResponse(callback: (response: Response) => void) {
		this._onResponse = callback;
	}
}
