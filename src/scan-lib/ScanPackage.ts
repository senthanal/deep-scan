import {OrtScan} from "./OrtScan";
import {ScanPackageOptions} from "./types";
import {ScanLogger} from "./ScanLogger";
import {PackageJson} from "type-fest";
import {getTask} from "./utils";
import {readFileSync, writeFileSync} from "fs";
import {join} from "path";

export class ScanPackage extends OrtScan<ScanPackageOptions> {
  constructor(logger: ScanLogger, scanOptions: ScanPackageOptions) {
    super(logger, scanOptions);
  }

  public scan(): void {
    this.checkDependencies();
    this.createPackagePath();
    const packageJson = this.getPackageJson(this.scanOptions.packageName, this.scanOptions.packageVersion);
    this.writePackageJson(packageJson);
    this.copyDockerfile();
    this.updateDockerfile(this.scanOptions.ortConfigRepoUrl);
    this.copyDockerEntry();
    this.buildDockerImage();
    const exists = this.existsDockerContainer();
    if (exists) {
      this.stopDockerContainer();
      this.removeDockerContainer();
    }
    this.createDockerContainer();
    this.startDockerContainer();
    this.stopDockerContainer();
    this.removeDockerContainer();
    if (!this.noEvaluationInScanResult()) {
      this.checkViolations();
    }
    this.cleanUp();
  }

  /**
   * Creates a package.json file for the scan project that contains the
   * given package as a dependency.
   * @param packageName - The name of the package to add as a dependency.
   * @param packageVersion - The version of the package to add as a dependency.
   * @returns The package.json file for the scan project. Defaults to 3.
   */
  protected getPackageJson(
    packageName: string,
    packageVersion: string
  ): PackageJson {
    const taskId = this.getTaskId();
    const msg = `Adding ${packageName}@${packageVersion} to the scan project dependencies`;
    this.logger.addLog(getTask(taskId, msg));
    const packageJson = JSON.parse(
      readFileSync(join(this.templatePath, "scan-package", "package.json"), "utf8")
    ) as PackageJson;
    packageJson.dependencies = {
      ...packageJson.dependencies,
      [packageName]: packageVersion,
    };
    this.logger.addLog(getTask(taskId, `Added ${packageName}@${packageVersion} to the scan project dependencies`, "Completed"));
    return packageJson;
  }

  /**
   * Writes the given package.json file to the scan project directory. This is
   * necessary because the package.json file is used to install the package
   * dependencies, and the package.json file must be in the same directory as the
   * package source code.
   * @param packageJson - The package.json file to write to the scan project
   *   directory.
   */
  protected writePackageJson(packageJson: PackageJson): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Writing package json to the scan project`));
    const content = JSON.stringify(packageJson, null, 2);
    const path = join(this.packagePath, "package.json");
    writeFileSync(path, content);
    this.logger.addLog(getTask(taskId, `Written package json to the scan project`, "Completed"));
  }

  /**
   * Copies the Dockerfile from the template directory to the scan project
   * directory. This is necessary because the Dockerfile is used to build the
   * Docker image, and the Dockerfile must be in the same directory as the
   * package source code.
   */
  protected copyDockerfile(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Copying Dockerfile to the scan project`));
    const path = join(this.packagePath, "Dockerfile");
    writeFileSync(
      path,
      readFileSync(join(this.templatePath, "scan-package", "Dockerfile"), "utf8")
    );
    this.logger.addLog(getTask(taskId, `Copied Dockerfile to the scan project`, "Completed"));
  }

  /**
   * Updates the ORT config repo in the Dockerfile to the given url.
   * @param ortConfigRepo - The url of the ORT config repo to use.
   */
  protected updateDockerfile(ortConfigRepo: string): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Updating ORT config repo to ${ortConfigRepo}`));
    const path = join(this.packagePath, "Dockerfile");
    const dockerfile = readFileSync(path, "utf8");
    const updatedDockerfile = dockerfile.replace(
      "${ort-config-repo}",
      ortConfigRepo
    );
    writeFileSync(path, updatedDockerfile);
    this.logger.addLog(getTask(taskId, `Updated ORT config repo to ${ortConfigRepo}`, "Completed"));
  }

}


