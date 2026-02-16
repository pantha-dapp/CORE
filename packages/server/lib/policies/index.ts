/** biome-ignore-all lint/complexity/noBannedTypes: {} **/
import type { Address } from "viem";
import type { Db } from "../db";
import { ForbiddenError, NotImplementedError } from "../errors";

import userEnforcers from "./user";

type PolicyManagerConfig = {
	db: Db;
};

export interface PolicyManager {
	_config: PolicyManagerConfig;
	_enforcers: Partial<{
		[K in PolicyType]: (
			user: Address,
			resource: PolicyResourceDefs[K],
			config: PolicyManagerConfig,
		) => boolean | Promise<boolean>;
	}>;

	can(
		user: Address,
		action: PolicyType,
		resource: PolicyResourceDefs[PolicyType],
	): Promise<boolean>;

	assertCan: (...args: Parameters<PolicyManager["can"]>) => Promise<void>;

	registerPolicyEnforcer<T extends PolicyType>(
		policyType: T,
		enforcer: PolicyManager["_enforcers"][T],
	): void;
}

type PolicyBaseDefs = {
	chapter: {
		chapterId: string;
	};
	user: {
		userWallet: Address;
	};
};
type PolicyResource<
	T extends keyof PolicyBaseDefs,
	R extends Record<string, unknown> = {},
> = PolicyBaseDefs[T] & R;
export interface PolicyResourceDefs {
	"chapter.view": PolicyResource<"chapter">;
	"course.generate": {};

	"user.view": PolicyResource<"user">;
	"user.follow": PolicyResource<"user">;
	"user.unfollow": PolicyResource<"user">;
}
type Domain = keyof PolicyResourceDefs extends infer K
	? K extends `${infer Prefix}.${string}`
		? Prefix
		: never
	: never;
export type PolicyType = keyof PolicyResourceDefs;

type EnforcersAll = PolicyManager["_enforcers"];
export type Enforcers<T extends Domain> = {
	[K in keyof EnforcersAll as K extends `${T}.${string}`
		? K
		: never]: EnforcersAll[K];
};

export class DefaultPolicyManager implements PolicyManager {
	_config: PolicyManagerConfig;
	_enforcers: EnforcersAll;

	constructor(config: PolicyManagerConfig) {
		this._config = config;
		this._enforcers = {
			...userEnforcers,
		};
	}

	async can<T extends PolicyType>(
		user: Address,
		action: T,
		resource: PolicyResourceDefs[T],
	): Promise<boolean> {
		const enforcer = this._enforcers[action];
		if (!enforcer) {
			throw new NotImplementedError(
				`No enforcer registered for policy type: ${action}`,
			);
		}
		return (await enforcer(user, resource, this._config)) ?? false;
	}

	async assertCan(
		user: Address,
		action: PolicyType,
		resource: PolicyResourceDefs[PolicyType],
	) {
		if (!(await this.can(user, action, resource))) {
			throw new ForbiddenError();
		}
	}

	registerPolicyEnforcer() {
		throw new NotImplementedError(
			"registerPolicyEnforcer is intended to be used with HonoPolicyManager",
		);
	}
}
