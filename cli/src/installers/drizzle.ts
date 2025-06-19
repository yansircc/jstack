import path from "node:path";
import fs from "fs-extra";
import type { PackageJson } from "type-fest";

import { PKG_ROOT } from "@/constants.js";
import type { Installer } from "@/installers/index.js";
import { addPackageDependency } from "@/utils/add-package-dep.js";

export const drizzleInstaller: Installer = ({
	projectDir,
	databaseProvider,
	projectName,
}) => {
	addPackageDependency({
		projectDir,
		dependencies: ["drizzle-kit", "eslint-plugin-drizzle"],
		devDependencies: true,
	});
	addPackageDependency({
		projectDir,
		dependencies: ["drizzle-orm"],
		devDependencies: false,
	});

	// Add D1-specific dependencies
	if (databaseProvider === "cloudflare-d1") {
		addPackageDependency({
			projectDir,
			dependencies: ["wrangler", "@cloudflare/workers-types", "@biomejs/biome"],
			devDependencies: true,
		});
		addPackageDependency({
			projectDir,
			dependencies: ["hono"],
			devDependencies: false,
		});
	}

	const extrasDir = path.join(PKG_ROOT, "template/extras");

	const routerSrc = path.join(
		extrasDir,
		databaseProvider === "cloudflare-d1" 
			? `src/server/routers/post/with-drizzle-d1.ts`
			: `src/server/routers/post/with-drizzle.ts`,
	);
	const routerDest = path.join(projectDir, `src/server/routers/post-router.ts`);

	const envSrc = path.join(extrasDir, `config/_env-drizzle`);
	const vercelPostgresEnvSrc = path.join(
		extrasDir,
		`config/_env-drizzle-vercel-postgres`,
	);
	const d1EnvSrc = path.join(
		extrasDir,
		`config/_env-drizzle-cloudflare-d1`,
	);

	const envDest = path.join(projectDir, ".env");

	// add db:* scripts to package.json
	const packageJsonPath = path.join(projectDir, "package.json");

	const packageJsonContent = fs.readJSONSync(packageJsonPath) as PackageJson;
	packageJsonContent.scripts = {
		...packageJsonContent.scripts,
		"db:push": "drizzle-kit push",
		"db:studio": "drizzle-kit studio",
		"db:generate": "drizzle-kit generate",
		"db:migrate": "drizzle-kit migrate",
	};

	fs.copySync(routerSrc, routerDest);
	
	// Copy appropriate env file
	if (databaseProvider === "vercel-postgres") {
		fs.copySync(vercelPostgresEnvSrc, envDest);
	} else if (databaseProvider === "cloudflare-d1") {
		fs.copySync(d1EnvSrc, envDest);
		// Copy D1-specific wrangler.jsonc
		const wranglerSrc = path.join(extrasDir, `config/wrangler-d1.jsonc`);
		const wranglerDest = path.join(projectDir, "wrangler.jsonc");
		fs.copySync(wranglerSrc, wranglerDest);
		// Copy biome config
		const biomeSrc = path.join(extrasDir, `config/biome.json`);
		const biomeDest = path.join(projectDir, "biome.json");
		fs.copySync(biomeSrc, biomeDest);
		
		// Use the D1-specific package.json template
		const d1PackageSrc = path.join(extrasDir, `config/package-cloudflare-d1.json`);
		const d1PackageContent = fs.readJSONSync(d1PackageSrc) as PackageJson;
		
		// Update project name
		d1PackageContent.name = projectName;
		
		// Replace the entire package.json with the D1 version
		fs.writeJSONSync(packageJsonPath, d1PackageContent, {
			spaces: 2,
		});
		
		return; // Skip the normal package.json update
	} else {
		fs.copySync(envSrc, envDest);
	}

	fs.writeJSONSync(packageJsonPath, packageJsonContent, {
		spaces: 2,
	});
};
