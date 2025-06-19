import { intro, isCancel, outro, select, text } from "@clack/prompts";
import color from "picocolors";

export interface CliResults {
	projectName: string;
	orm: "none" | "drizzle" | undefined;
	dialect?: "postgres" | "sqlite" | undefined;
	provider?:
		| "neon"
		| "postgres"
		| "vercel-postgres"
		| "planetscale"
		| "cloudflare-d1"
		| undefined;
	noInstall?: boolean;
	packageManager?: "npm" | "pnpm" | "yarn" | "bun";
}

export type Dialect = CliResults["dialect"];
export type Orm = CliResults["orm"];

export async function runCli(): Promise<CliResults | undefined> {
	console.clear();

	// Parse command line arguments manually
	const args = process.argv.slice(2);
	const cliProvidedName = args[0]?.startsWith("--") ? undefined : args[0];
	const noInstallFlag = args.includes("--noInstall");

	intro(color.bgCyan(" jStack CLI "));

	const projectName =
		cliProvidedName ||
		(await text({
			message: "What will your project be called?",
			placeholder: "my-ystack-app",
			validate: (value) => {
				if (!value) return "Please enter a project name";
				if (value.length > 50)
					return "Project name must be less than 50 characters";
				return;
			},
		}));

	if (isCancel(projectName)) {
		outro("Setup cancelled.");
		return undefined;
	}

	const orm = await select<"none" | "drizzle">({
		message: "Which database ORM would you like to use?",
		options: [
			{ value: "none", label: "None" },
			{ value: "drizzle", label: "Drizzle ORM" },
		],
	});

	if (isCancel(orm)) {
		outro("Setup cancelled.");
		return undefined;
	}

	let dialect = undefined;
	let provider = undefined;
	if (orm === "drizzle") {
		const databaseType = await select<"postgres" | "sqlite">({
			message: "Which database type would you like to use?",
			options: [
				{ value: "postgres", label: "PostgreSQL" },
				{ value: "sqlite", label: "SQLite (Cloudflare D1)" },
			],
		});

		if (isCancel(databaseType)) {
			outro("Setup cancelled.");
			return undefined;
		}

		if (databaseType === "postgres") {
			dialect = "postgres" as const;
			provider = await select({
				message: "Which Postgres provider would you like to use?",
				options: [
					{ value: "postgres", label: "PostgreSQL" },
					{ value: "neon", label: "Neon" },
					{ value: "vercel-postgres", label: "Vercel Postgres" },
				],
			});

			if (isCancel(provider)) {
				outro("Setup cancelled.");
				return undefined;
			}
		} else {
			dialect = "sqlite" as const;
			provider = "cloudflare-d1" as const;
		}
	}

	let noInstall = noInstallFlag;
	let packageManager: "npm" | "pnpm" | "yarn" | "bun" | undefined;

	if (!noInstall) {
		const selectedPackageManager = await select<"npm" | "pnpm" | "yarn" | "bun">({
			message: "Which package manager would you like to use?",
			options: [
				{ value: "npm", label: "npm" },
				{ value: "pnpm", label: "pnpm" },
				{ value: "yarn", label: "yarn" },
				{ value: "bun", label: "bun" },
			],
		});

		if (isCancel(selectedPackageManager)) {
			outro("Setup cancelled.");
			return undefined;
		}
		
		packageManager = selectedPackageManager;

		const shouldInstall = await select({
			message: `Should we run '${packageManager}${packageManager === "yarn" ? "" : " install"}' for you?`,
			options: [
				{ value: false, label: "Yes" },
				{ value: true, label: "No" },
			],
		});

		if (isCancel(shouldInstall)) {
			outro("Setup cancelled.");
			return undefined;
		}

		noInstall = shouldInstall;
	}

	return {
		projectName: projectName as string,
		orm,
		dialect,
		provider,
		noInstall,
		packageManager,
	};
}
