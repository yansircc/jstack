// #!/usr/bin/env node

import path from "node:path";
import fs from "fs-extra";

import { runCli } from "./cli/index.js";
import { installDependencies } from "./helpers/install-deps.js";
import { scaffoldProject } from "./helpers/scaffold-project.js";
import { buildInstallerMap } from "./installers/index.js";
import { logger } from "./utils/logger.js";

const main = async () => {
	const results = await runCli();

	if (!results) {
		return;
	}

	const { projectName, orm, dialect, provider, packageManager } = results;

	const installers = buildInstallerMap(orm, provider);

	const projectDir = await scaffoldProject({
		orm,
		dialect,
		databaseProvider: provider ?? "neon",
		installers,
		projectName,
	});

	const pkgJson = fs.readJSONSync(path.join(projectDir, "package.json"));
	pkgJson.name = projectName;

	fs.writeJSONSync(path.join(projectDir, "package.json"), pkgJson, {
		spaces: 2,
	});

	if (!results.noInstall && packageManager) {
		await installDependencies({ projectDir, packageManager });
	}

	process.exit(0);
};

main().catch((err) => {
	logger.error("Aborting installation...");
	if (err instanceof Error) {
		logger.error(err);
	} else {
		logger.error(
			"An unknown error has occurred. Please open an issue on github with the below:",
		);
		console.log(err);
	}
	process.exit(1);
});
