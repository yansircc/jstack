import chalk from "chalk";
import ora from "ora";

import type { InstallerMap, InstallerOptions } from "@/installers/index.js";
import { logger } from "@/utils/logger.js";

type InstallPackagesOptions = InstallerOptions;

// This runs the installer for all the packages that the user has selected
export const installPackages = async (options: InstallPackagesOptions) => {
	const { installers } = options;
	logger.info("Adding boilerplate...");

	// Handle ORM installers
	for (const [name, pkgOpts] of Object.entries(installers.orm)) {
		if (pkgOpts.inUse) {
			const spinner = ora(`Boilerplating ORM: ${name}...`).start();
			await pkgOpts.installer(options);
			spinner.succeed(
				chalk.green(
					`Successfully setup boilerplate for ORM: ${chalk.green.bold(name)}`,
				),
			);
		}
	}

	// Handle provider installers
	for (const [name, pkgOpts] of Object.entries(installers.provider)) {
		if (pkgOpts.inUse) {
			const spinner = ora(`Boilerplating provider: ${name}...`).start();
			await pkgOpts.installer(options);
			spinner.succeed(
				chalk.green(
					`Successfully setup boilerplate for provider: ${chalk.green.bold(name)}`,
				),
			);
		}
	}

	logger.info("");
};
