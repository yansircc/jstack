import path from "node:path";
import { execa } from "execa";
import fs from "fs-extra";
import ora from "ora";

import { PKG_ROOT } from "@/constants.js";
import type { Installer } from "@/installers/index.js";
import { logger } from "@/utils/logger.js";

export const cloudflareD1Installer: Installer = async ({
	projectDir,
	projectName,
}) => {
	const srcPath = path.join(
		PKG_ROOT,
		"template/extras/src/server/jstack/drizzle-with-cloudflare-d1.ts",
	);
	const destPath = path.join(projectDir, "src/server/jstack.ts");

	const configSrcPath = path.join(
		PKG_ROOT,
		"template/extras/config/drizzle-config-cloudflare-d1.ts",
	);

	const configDestPath = path.join(projectDir, "drizzle.config.ts");

	const schemaSrcPath = path.join(
		PKG_ROOT,
		"template/extras/src/server/db/schema/with-sqlite.ts",
	);
	const schemaDestPath = path.join(projectDir, "src/server/db/schema.ts");

	// Copy files
	fs.copySync(srcPath, destPath);
	fs.copySync(configSrcPath, configDestPath);
	fs.copySync(schemaSrcPath, schemaDestPath);

	// Create D1 database
	const dbName = `${projectName}-db`;
	logger.info(`Creating Cloudflare D1 database: ${dbName}`);

	const spinner = ora("Creating D1 database...").start();

	try {
		// Check if wrangler is logged in
		try {
			const { stdout: whoamiOutput } = await execa("wrangler", ["whoami"], {
				cwd: projectDir,
			});

			if (whoamiOutput.includes("You are not authenticated")) {
				spinner.warn(
					"Please login to Cloudflare first by running: wrangler login",
				);
				logger.info("After logging in, run: wrangler d1 create " + dbName);
				return;
			}
		} catch (error) {
			// Wrangler not installed yet or not logged in
			spinner.warn("Wrangler not found or not authenticated");
			logger.info("After installing dependencies:");
			logger.info("1. Run: npx wrangler login");
			logger.info(`2. Run: npx wrangler d1 create ${dbName}`);
			logger.info("3. Update the database_id in wrangler.jsonc");
			return;
		}
		// Create D1 database
		const { stdout } = await execa("wrangler", ["d1", "create", dbName], {
			cwd: projectDir,
		});

		// Extract database ID from output
		const match = stdout.match(/database_id = "([^"]+)"/);
		if (match && match[1]) {
			const databaseId = match[1];

			// Update wrangler.jsonc with the database ID
			const wranglerPath = path.join(projectDir, "wrangler.jsonc");
			const wranglerContent = fs.readJSONSync(wranglerPath);

			// Update the D1 database configuration
			if (wranglerContent.d1_databases && wranglerContent.d1_databases[0]) {
				wranglerContent.d1_databases[0].database_id = databaseId;
				wranglerContent.d1_databases[0].database_name = dbName;
			}

			fs.writeJSONSync(wranglerPath, wranglerContent, { spaces: "\t" });

			spinner.succeed(`Created D1 database: ${dbName} (${databaseId})`);
			logger.info("Updated wrangler.jsonc with database configuration");
		} else {
			spinner.warn(
				"Created database but couldn't extract ID. Please update wrangler.jsonc manually.",
			);
		}
	} catch (error) {
		spinner.fail("Failed to create D1 database");
		logger.warn("Please create the database manually:");
		logger.info(`1. Run: wrangler d1 create ${dbName}`);
		logger.info("2. Update the database_id in wrangler.jsonc");
	}
};
