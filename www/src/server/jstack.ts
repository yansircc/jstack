import { Client } from "@upstash/qstash";
import { Redis } from "@upstash/redis";
import { Index } from "@upstash/vector";
import { env } from "hono/adapter";
import { jstack } from "jstack";

interface Env {
	Bindings: {
		GITHUB_TOKEN: string;
		QSTASH_TOKEN: string;
		AMPLIFY_URL: string;
		QSTASH_NEXT_SIGNING_KEY: string;
		QSTASH_CURRENT_SIGNING_KEY: string;
		UPSTASH_REDIS_REST_URL: string;
		UPSTASH_REDIS_REST_TOKEN: string;
		UPSTASH_VECTOR_REST_URL: string;
		UPSTASH_VECTOR_REST_TOKEN: string;
	};
}

export const j = jstack.init<Env>();

const redisMiddleware = j.middleware(async ({ c, next }) => {
	const { QSTASH_TOKEN, UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } =
		env(c);

	const redis = new Redis({
		url: UPSTASH_REDIS_REST_URL,
		token: UPSTASH_REDIS_REST_TOKEN,
	});

	const qstash = new Client({ token: QSTASH_TOKEN });

	return await next({ redis, qstash });
});

export const vectorMiddleware = j.middleware(async ({ c, next }) => {
	const { UPSTASH_VECTOR_REST_URL, UPSTASH_VECTOR_REST_TOKEN } = env(c);

	const index = new Index({
		url: UPSTASH_VECTOR_REST_URL,
		token: UPSTASH_VECTOR_REST_TOKEN,
	});

	return await next({ index });
});

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const baseProcedure = j.procedure;
export const publicProcedure = baseProcedure.use(redisMiddleware);
