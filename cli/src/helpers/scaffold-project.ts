import path from "path";
import type { Dialect, Orm } from "@/cli/index.js";
import {
	type InstallerMap,
	type Provider,
	buildInstallerMap,
} from "@/installers/index.js";
import { getUserPkgManager } from "@/utils/get-user-pkg-manager.js";
import { installBaseTemplate } from "./install-base-template.js";
import { installPackages } from "./install-packages.js";

interface ScaffoldProjectOptions {
	projectName: string;
	orm: Orm;
	dialect: Dialect;
	installers: InstallerMap;
	databaseProvider: Provider;
}

export const scaffoldProject = async ({
	databaseProvider,
	projectName,
	installers,
	orm,
}: ScaffoldProjectOptions) => {
	const projectDir = path.resolve(process.cwd(), projectName);
	const pkgManager = getUserPkgManager();

	await installBaseTemplate({
		projectDir,
		pkgManager,
		noInstall: false,
		installers,
		projectName,
		databaseProvider,
	});

	installPackages({
		projectDir,
		pkgManager,
		noInstall: false,
		installers,
		projectName,
		databaseProvider,
	});

	return projectDir;
};
