import jwt from "jsonwebtoken";
import { z } from "zod";
import { JWTalgorithm, JWTexpiration, JWTKeypair } from "../../constants";

export const zJwtPayload = () =>
	z.object({
		iss: z.string(), // issuer
		sub: z.string(), // subject (sesion id)
		iat: z.number(), // issued at
		exp: z.number(), // expires at
		nbf: z.number(), // not before
	});

export type JwtPayload = z.infer<ReturnType<typeof zJwtPayload>>;

export function createJwtPayload(sessionId: string): JwtPayload {
	const now = Math.floor(Date.now() / 1000);

	return {
		iss: JWTKeypair.public,
		sub: sessionId,
		iat: now - 2,
		exp: now + JWTexpiration,
		nbf: now - 1,
	};
}

export function signJwt(payload: JwtPayload): string {
	return jwt.sign(payload, JWTKeypair.private, {
		algorithm: JWTalgorithm,
	});
}

export function verifyJwt(token: string): JwtPayload {
	const decoded = jwt.verify(token, JWTKeypair.private, {
		algorithms: [JWTalgorithm],
	});

	return zJwtPayload().parse(decoded);
}

export function issueJwtToken(sessionId: string): string {
	const payload = createJwtPayload(sessionId);
	return signJwt(payload);
}
