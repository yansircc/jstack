import path from "node:path";
import fs from "fs-extra";

import { PKG_ROOT } from "@/constants.js";
import { addPackageDependency } from "@/utils/add-package-dep.js";
import type { Installer } from "./index.js";

export const planetscaleInstaller: Installer = ({ projectDir }) => {
	const extrasDir = path.join(PKG_ROOT, "template/extras");

	addPackageDependency({
		projectDir,
		dependencies: ["@planetscale/database"],
		devDependencies: false,
	});

	const configFile = path.join(
		extrasDir,
		`config/drizzle-config-planetscale.ts`,
	);
	const configDest = path.join(projectDir, "drizzle.config.ts");

	const schemaSrc = path.join(
		extrasDir,
		"src/server/db/drizzle",
		`with-mysql.ts`,
	);
	const schemaDest = path.join(projectDir, "src/server/db/schema.ts");

	const jstackSrc = path.join(
		extrasDir,
		"src/server/jstack",
		`drizzle-with-planetscale.ts`,
	);
	const jstackDest = path.join(projectDir, "src/server/jstack.ts");

	fs.ensureDirSync(path.dirname(configDest));
	fs.ensureDirSync(path.dirname(schemaDest));
	fs.ensureDirSync(path.dirname(jstackDest));

	fs.copySync(configFile, configDest);
	fs.copySync(schemaSrc, schemaDest);
	fs.copySync(jstackSrc, jstackDest);
};
