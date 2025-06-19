import { getUserPkgManager } from "@/utils/get-user-pkg-manager.js";
import { intro, isCancel, outro, select, text } from "@clack/prompts";
import color from "picocolors";

export interface CliResults {
	projectName: string;
	orm: "none" | "drizzle" | undefined;
	dialect?: "postgres" | undefined;
	provider?:
		| "neon"
		| "postgres"
		| "vercel-postgres"
		| "planetscale"
		| undefined;
	noInstall?: boolean;
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
		dialect = "postgres" as const; // Only offering postgres

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
	}

	let noInstall = noInstallFlag;
	if (!noInstall) {
		const pkgManager = getUserPkgManager();
		const shouldInstall = await select({
			message: `Should we run '${pkgManager}${pkgManager === "yarn" ? "" : " install"}' for you?`,
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
	};
}
