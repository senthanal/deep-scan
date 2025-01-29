import { program } from "commander";
import { ScanCliOptions } from "./types";
import { ScanCli } from "./scan-cli";

program
  .requiredOption("-p, --packageName <package name>", "Name of the npm package")
  .requiredOption(
    "-v, --packageVersion <package version>",
    "Version of the npm package"
  )
  .requiredOption(
    "-c, --ortConfigRepoUrl <ORT config repo url>",
    "ORT configuration repository URL"
  );

program.parse(process.argv);
const options = program.opts();

const scanCli = new ScanCli(options as ScanCliOptions);
console.log(scanCli.toString());
