import type { D1Database } from "@cloudflare/workers-types";
import { drizzle } from "drizzle-orm/d1";
import { env } from "hono/adapter";
import { jstack } from "jstack";

interface Env {
	Bindings: {
		DB: D1Database;
	};
}

export const j = jstack.init<Env>();

/**
 * Type-safely injects database into all procedures
 * @see https://jstack.app/docs/backend/middleware
 *
 * For deployment to Cloudflare Workers with D1
 * @see https://developers.cloudflare.com/d1/
 */
const databaseMiddleware = j.middleware(async ({ c, next }) => {
	const { DB } = env(c);
	const db = drizzle(DB);
	return await next({ db });
});

/**
 * Public (unauthenticated) procedures
 *
 * This is the base piece you use to build new queries and mutations on your API.
 */
export const publicProcedure = j.procedure.use(databaseMiddleware);