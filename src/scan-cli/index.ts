import {program} from "commander";
import {
  ScanGitProject,
  ScanGitProjectOptions,
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
  .requiredOption("-c, --projectConfigPath <project ort config path>", "Path to the ORT config directory for the project to be scanned")
  .option("-r, --projectResultsPath <project ort results path>", "Path to the ort results directory for the project to be scanned")
  .action((options) => {
    const logger = new TerminalLogger();
    const ortScan = new ScanProject(logger, options as ScanProjectOptions);
    ortScan.scan();
  });

program
  .command("gitProject")
  .description("Deep scan an npm project from a git repository")
  .requiredOption("-p, --projectUrl <project git url>", "Project git repository URL")
  .requiredOption("-c, --projectConfigUrl <project ort config url>", "Project ort config repository URL")
  .option("-q, --projectBranch <project git branch>", "Project git repository branch", "main")
  .option("-d, --projectConfigBranch <project git ort config branch>", "Project ORT configuration git repository branch", "main")
  .option("-e, --projectConfigFolder <project git ort config folder>", "Path to the ORT config directory for the project to be scanned")
  .option("-r, --projectResultsPath <project ort results path>", "Path to the ort results directory for the project to be scanned")
  .option("-l, --enableLongPath <enable long path>", "Enable windows long path to avoid errors", false)
  .action((options) => {
    const logger = new TerminalLogger();
    const ortScan = new ScanGitProject(logger, options as ScanGitProjectOptions);
    ortScan.scan();
  });

program.parse(process.argv);
