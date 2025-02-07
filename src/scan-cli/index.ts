import {program} from "commander";
import {
  ScanPackage,
  ScanPackageOptions,
  ScanProject,
  ScanProjectOptions,
  TerminalLogger
} from "@senthanal/deep-scan-lib";

program
  .command("package")
  .description("Deep scan an npm package")
  .requiredOption("-p, --packageName <package name>", "Name of the npm package")
  .requiredOption(
    "-v, --packageVersion <package version>",
    "Version of the npm package"
  )
  .requiredOption(
    "-c, --ortConfigRepoUrl <ORT config repo url>",
    "ORT configuration repository URL"
  )
  .action((options) => {
    const logger = new TerminalLogger();
    const ortScan = new ScanPackage(logger, options as ScanPackageOptions);
    ortScan.scan();
  });

program
  .command("project")
  .description("Deep scan an npm project")
  .requiredOption("-p, --projectPath <project path>", "Path to the root of the project directory to be scanned")
  .requiredOption("-c, --projectConfigPath <project ort config path>", "Path to the ort config directory for the project to be scanned")
  .requiredOption("-r, --projectResultsPath <project ort results path>", "Path to the ort results directory for the project to be scanned")
  .action((options) => {
    const logger = new TerminalLogger();
    const ortScan = new ScanProject(logger, options as ScanProjectOptions);
    ortScan.scan();
  });

program.parse(process.argv);
