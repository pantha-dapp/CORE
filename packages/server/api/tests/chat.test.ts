import { beforeAll, describe, expect, it } from "bun:test";
import { eq } from "drizzle-orm";
import { zeroAddress } from "viem";
import { testGlobals } from "./helpers/globals";
import { userWallet1, userWallet2 } from "./helpers/setup";
import { drainSseStream, expectSseEvent } from "./helpers/sse";
import { testBecomeFriends } from "./helpers/testHelpers";

const CIPHERTEXT = "0xdeadbeef";

describe("Direct Messages", () => {
	beforeAll(async () => {
		const { api1, api2, appState } = testGlobals;
		// Reset friendship state
		await api1.users.unfollow.$post({
			json: { walletToUnfollow: userWallet2.account.address },
		});
		await api2.users.unfollow.$post({
			json: { walletToUnfollow: userWallet1.account.address },
		});
		// Reset user2's messagePolicy to default
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "friends" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);
	});

	it("unauthenticated user cannot send DM", async () => {
		const { api0 } = testGlobals;
		const res = await api0.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(res.status).toBe(401);
	});

	it("cannot DM non-existent user", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.dm.$post({
			json: { ciphertext: CIPHERTEXT, recipientWallet: zeroAddress },
		});
		expect(res.status).toBe(404);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("cannot DM self", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet1.account.address,
			},
		});
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("cannot DM user whose messagePolicy is 'noone'", async () => {
		const { api1, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "noone" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		const res = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("cannot DM user whose messagePolicy is 'friends' when not friends", async () => {
		const { api1, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "friends" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		const res = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(res.status).toBe(401);
		const data = await res.json();
		expect(data.success).toBe(false);
	});

	it("can DM user whose messagePolicy is 'anyone'", async () => {
		const { api1, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "anyone" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		const postRes = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(postRes.status).toBe(201);

		const getRes = await api1.users.social.dm.$get({
			query: { participantWallet: userWallet2.account.address },
		});
		expect(getRes.status).toBe(200);
		const data = await getRes.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const match = data.data.messages.find((m) => m.ciphertext === CIPHERTEXT);
		expect(match).toBeDefined();
		if (!match) throw new Error("Expected message not found");
		expect(match.senderWallet).toBe(userWallet1.account.address);
		expect(match.recipientWallet).toBe(userWallet2.account.address);
	});

	it("can DM a friend when messagePolicy is 'friends'", async () => {
		const { api1, api2, appState } = testGlobals;
		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "friends" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);
		await testBecomeFriends(api1, api2);

		const postRes = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(postRes.status).toBe(201);

		const getRes = await api1.users.social.dm.$get({
			query: { participantWallet: userWallet2.account.address },
		});
		expect(getRes.status).toBe(200);
		const data = await getRes.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const match = data.data.messages.find((m) => m.ciphertext === CIPHERTEXT);
		expect(match).toBeDefined();
		if (!match) throw new Error("Expected message not found");
		expect(match.senderWallet).toBe(userWallet1.account.address);
		expect(match.recipientWallet).toBe(userWallet2.account.address);
	});

	it("emits dm:new SSE event to recipient when DM is sent", async () => {
		const { api1, appState } = testGlobals;
		const redis = appState.db.redis;

		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "anyone" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		// Drain existing events so we only see the new one
		const lastId = await drainSseStream(redis, userWallet2.account.address);

		const postRes = await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});
		expect(postRes.status).toBe(201);

		const evt = await expectSseEvent(redis, {
			userWallet: userWallet2.account.address,
			type: "dm:new",
			lastId,
		});

		expect(evt.type).toBe("dm:new");
		expect(evt.payload).toEqual({ from: userWallet1.account.address });
	});

	it("does not emit dm:new SSE event to sender", async () => {
		const { api1, appState } = testGlobals;
		const redis = appState.db.redis;

		await appState.db
			.update(appState.db.schema.users)
			.set({ messagePolicy: "anyone" })
			.where(
				eq(appState.db.schema.users.walletAddress, userWallet2.account.address),
			);

		const lastId = await drainSseStream(redis, userWallet1.account.address);

		await api1.users.social.dm.$post({
			json: {
				ciphertext: CIPHERTEXT,
				recipientWallet: userWallet2.account.address,
			},
		});

		// Short wait — should find no dm:new event for the sender
		const events = await appState.db.redis.send("XREAD", [
			"COUNT",
			"50",
			"BLOCK",
			"500",
			"STREAMS",
			`sse:${userWallet1.account.address}`,
			lastId,
		]);

		const dmEvents = events
			? (events as [string, [string, string[]][]][])
					.flatMap(([, msgs]) => msgs)
					.filter(([, fields]) => {
						for (let i = 0; i < fields.length; i += 2) {
							if (fields[i] === "type" && fields[i + 1] === "dm:new")
								return true;
						}
						return false;
					})
			: [];

		expect(dmEvents).toHaveLength(0);
	});
});

describe("Learning Group Chats", () => {
	let programmingGroupId: number;
	let artGroupId: number;
	let course1Id: string;
	let course2Id: string;
	let course3Id: string;

	beforeAll(async () => {
		const { appState } = testGlobals;
		const db = appState.db;

		const icon = { url: null, prompt: "test icon" };

		course1Id = crypto.randomUUID();
		course2Id = crypto.randomUUID();
		course3Id = crypto.randomUUID();

		// Insert 2 "similar" courses (Programming) and 1 "different" course (Art)
		await db.insert(db.schema.courses).values([
			{
				id: course1Id,
				title: "Intro to JavaScript",
				description: "Learn JS basics",
				icon,
			},
			{
				id: course2Id,
				title: "Advanced TypeScript",
				description: "Master TypeScript",
				icon,
			},
			{
				id: course3Id,
				title: "Oil Painting Fundamentals",
				description: "Learn oil painting",
				icon,
			},
		]);

		// Create two learning group chats representing different categories
		const [progGroup] = await db
			.insert(db.schema.learningGroupChats)
			.values({ category: "Programming" })
			.returning();
		const [artGroup] = await db
			.insert(db.schema.learningGroupChats)
			.values({ category: "Art" })
			.returning();

		if (!progGroup || !artGroup)
			throw new Error("Failed to create test groups");

		programmingGroupId = progGroup.id;
		artGroupId = artGroup.id;

		// Map courses to groups: course1 & course2 (similar) → Programming, course3 → Art
		await db.insert(db.schema.learningGroupCourses).values([
			{ learningGroupChatId: programmingGroupId, courseId: course1Id },
			{ learningGroupChatId: programmingGroupId, courseId: course2Id },
			{ learningGroupChatId: artGroupId, courseId: course3Id },
		]);

		// Enroll user1 in a Programming course AND the Art course via API
		// Enroll user2 ONLY in a Programming course via API
		const { api1, api2 } = testGlobals;
		await api1.courses.enroll.$post({ json: { courseId: course1Id } });
		await api1.courses.enroll.$post({ json: { courseId: course3Id } });
		await api2.courses.enroll.$post({ json: { courseId: course2Id } });
	});

	it("similar courses are placed in the same learning group", async () => {
		const { appState } = testGlobals;
		const db = appState.db;

		const [entry1] = await db
			.select()
			.from(db.schema.learningGroupCourses)
			.where(eq(db.schema.learningGroupCourses.courseId, course1Id));

		const [entry2] = await db
			.select()
			.from(db.schema.learningGroupCourses)
			.where(eq(db.schema.learningGroupCourses.courseId, course2Id));

		expect(entry1).toBeDefined();
		expect(entry2).toBeDefined();
		expect(entry1?.learningGroupChatId).toBe(entry2?.learningGroupChatId);
	});

	it("a different course is placed in a separate learning group", async () => {
		const { appState } = testGlobals;
		const db = appState.db;

		const [programmingEntry] = await db
			.select()
			.from(db.schema.learningGroupCourses)
			.where(eq(db.schema.learningGroupCourses.courseId, course1Id));

		const [artEntry] = await db
			.select()
			.from(db.schema.learningGroupCourses)
			.where(eq(db.schema.learningGroupCourses.courseId, course3Id));

		expect(programmingEntry?.learningGroupChatId).not.toBe(
			artEntry?.learningGroupChatId,
		);
	});

	it("user can list their learning group memberships", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.groups.$get();
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const groupIds = data.data.groups.map((g) => g.learningGroupChatId);
		expect(groupIds).toContain(programmingGroupId);
		expect(groupIds).toContain(artGroupId);
	});

	it("user only sees groups from their enrolled courses", async () => {
		const { api2 } = testGlobals;
		const res = await api2.users.social.groups.$get();
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const groupIds = data.data.groups.map((g) => g.learningGroupChatId);
		expect(groupIds).toContain(programmingGroupId);
		expect(groupIds).not.toContain(artGroupId);
	});

	it("unauthenticated user cannot list groups", async () => {
		const { api0 } = testGlobals;
		const res = await api0.users.social.groups.$get();
		expect(res.status).toBe(401);
	});

	it("can get members of a learning group", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.groups[":chatId"].members.$get({
			param: { chatId: String(programmingGroupId) },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const wallets = data.data.members.map((m) => m.walletAddress);
		expect(wallets).toContain(userWallet1.account.address);
		expect(wallets).toContain(userWallet2.account.address);
	});

	it("art group members only include users enrolled in art courses", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.groups[":chatId"].members.$get({
			param: { chatId: String(artGroupId) },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		const wallets = data.data.members.map((m) => m.walletAddress);
		// user1 is enrolled in course3 (Art), user2 is not
		expect(wallets).toContain(userWallet1.account.address);
		expect(wallets).not.toContain(userWallet2.account.address);
	});

	it("can send a message to a learning group", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.groups[":chatId"].messages.$post({
			param: { chatId: String(programmingGroupId) },
			json: { content: "Hello group!" },
		});
		expect(res.status).toBe(201);
		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		expect(data.data.message?.content).toBe("Hello group!");
		expect(data.data.message?.senderWallet).toBe(userWallet1.account.address);
		expect(data.data.message?.learningGroupChatId).toBe(programmingGroupId);
	});

	it("unauthenticated user cannot send a message to a learning group", async () => {
		const { api0 } = testGlobals;
		const res = await api0.users.social.groups[":chatId"].messages.$post({
			param: { chatId: String(programmingGroupId) },
			json: { content: "Unauthenticated message" },
		});
		expect(res.status).toBe(401);
	});

	it("can retrieve messages from a learning group", async () => {
		const { api1 } = testGlobals;
		const res = await api1.users.social.groups[":chatId"].messages.$get({
			param: { chatId: String(programmingGroupId) },
			query: { offset: "0" },
		});
		expect(res.status).toBe(200);
		const data = await res.json();
		expect(data.success).toBe(true);
		if (!data.success) throw new Error("Expected success");
		expect(data.data.messages.length).toBeGreaterThan(0);
		const msg = data.data.messages.find((m) => m.content === "Hello group!");
		expect(msg).toBeDefined();
	});

	it("emits learning-group:message SSE event to group members when a message is sent", async () => {
		const { api1, appState } = testGlobals;
		const redis = appState.db.redis;

		const lastId = await drainSseStream(redis, userWallet2.account.address);

		await api1.users.social.groups[":chatId"].messages.$post({
			param: { chatId: String(programmingGroupId) },
			json: { content: "SSE test message" },
		});

		const evt = await expectSseEvent(redis, {
			userWallet: userWallet2.account.address,
			type: "learning-group:message",
			lastId,
		});

		expect(evt.type).toBe("learning-group:message");
		expect(evt.payload).toEqual({
			learningGroupChatId: programmingGroupId,
			from: userWallet1.account.address,
		});
	});

	it("does not emit learning-group:message SSE event to the sender", async () => {
		const { api1, appState } = testGlobals;
		const redis = appState.db.redis;

		const lastId = await drainSseStream(redis, userWallet1.account.address);

		await api1.users.social.groups[":chatId"].messages.$post({
			param: { chatId: String(programmingGroupId) },
			json: { content: "No SSE for sender" },
		});

		const events = await appState.db.redis.send("XREAD", [
			"COUNT",
			"50",
			"BLOCK",
			"500",
			"STREAMS",
			`sse:${userWallet1.account.address}`,
			lastId,
		]);

		const groupEvents = events
			? (events as [string, [string, string[]][]][])
					.flatMap(([, msgs]) => msgs)
					.filter(([, fields]) => {
						for (let i = 0; i < fields.length; i += 2) {
							if (
								fields[i] === "type" &&
								fields[i + 1] === "learning-group:message"
							)
								return true;
						}
						return false;
					})
			: [];

		expect(groupEvents).toHaveLength(0);
	});
});
