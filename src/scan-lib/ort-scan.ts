import { ScanLogger } from "./ScanLogger";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { PackageJson } from "type-fest";
import { checkCmdError, cmd, fileToYaml, getTask, getViolation, yamlToJson } from "./utils";

export class OrtScan {
  private readonly containerName = "deep-scan";
  private readonly packagePath = resolve(__dirname, "../../", "project-scan");
  private readonly templatePath = resolve(__dirname, "templates");
  private taskCounter = 0;
  private readonly logger: ScanLogger;

  public constructor(logger: ScanLogger) {
    this.logger = logger;
  }

  /**
   * Scans the given package and version with the ORT tool. This will create a
   * temporary directory with the given package and version as a dependency, and
   * then build a Docker image from it. The Docker image will then be run in a
   * container which will be stopped and removed after it has finished running.
   *
   * @param packageName - The name of the package to scan.
   * @param packageVersion - The version of the package to scan.
   */
  public async scan(
    packageName: string,
    packageVersion: string,
    ortConfigRepo = "https://github.com/senthanal/ort-config.git"
  ): Promise<void> {
    this.createPackagePath();
    const packageJson = this.getPackageJson(packageName, packageVersion);
    this.writePackageJson(packageJson);
    this.copyDockerfile();
    this.updateOrtConfigRepo(ortConfigRepo);
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
    this.checkViolations();
  }

  private getTaskId(): number {
    this.taskCounter += 1;
    return this.taskCounter;
  }

  /**
   * Creates the scan project directory if it does not exist, or
   * cleans the directory if it does exist. This is necessary because the
   * Docker image is built from the contents of the scan project directory.
   */
  private createPackagePath(): void {
    const taskId = this.getTaskId();
    if (existsSync(this.packagePath)) {
      this.logger.addLog(getTask(taskId, `Cleaning scan project directory`));
      rmSync(this.packagePath, { recursive: true });
      this.logger.addLog(getTask(taskId, `Scan project directory cleaned`, "Completed"));
    }
    const nextTaskId = this.getTaskId();
    this.logger.addLog(getTask(nextTaskId, `Creating scan project directory`));
    mkdirSync(this.packagePath);
    this.logger.addLog(getTask(nextTaskId, `Scan project directory created`, "Completed"));
  }

  /**
   * Creates a package.json file for the scan project that contains the
   * given package as a dependency.
   * @param packageName - The name of the package to add as a dependency.
   * @param packageVersion - The version of the package to add as a dependency.
   * @returns The package.json file for the scan project. Defaults to 3.
   */
  private getPackageJson(
    packageName: string,
    packageVersion: string
  ): PackageJson {
    const taskId = this.getTaskId();
    const msg = `Adding ${packageName}@${packageVersion} to the scan project dependencies`;
    this.logger.addLog(getTask(taskId, msg));
    const packageJson = JSON.parse(
      readFileSync(join(this.templatePath, "package.json"), "utf8")
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
  private writePackageJson(packageJson: PackageJson): void {
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
  private copyDockerfile(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Copying Dockerfile to the scan project`));
    const path = join(this.packagePath, "Dockerfile");
    writeFileSync(
      path,
      readFileSync(join(this.templatePath, "Dockerfile"), "utf8")
    );
    this.logger.addLog(getTask(taskId, `Copied Dockerfile to the scan project`, "Completed"));
  }

  /**
   * Updates the ORT config repo in the Dockerfile to the given url.
   * @param ortConfigRepo - The url of the ORT config repo to use.
   */
  private updateOrtConfigRepo(ortConfigRepo: string): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Updating ORT config repo to ${ortConfigRepo}`));
    const path = join(this.packagePath, "Dockerfile");
    const dockerfile = readFileSync(path, "utf8");
    const updatedDockerfile = dockerfile.replace(
      "${ort-config-repo}",
      "https://github.com/senthanal/ort-config.git"
    );
    writeFileSync(path, updatedDockerfile);
    this.logger.addLog(getTask(taskId, `Updated ORT config repo to ${ortConfigRepo}`, "Completed"));
  }

  /**
   * Copies the entrypoint.sh file from the template directory to the scan
   * project directory. This file is used as the entrypoint for the Docker
   * container.
   */
  private copyDockerEntry(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Copying entrypoint.sh to the scan project`));
    const path = join(this.packagePath, "entrypoint.sh");
    writeFileSync(
      path,
      readFileSync(join(this.templatePath, "entrypoint.sh"), "utf8")
    );
    this.logger.addLog(getTask(taskId, `Copied entrypoint.sh to the scan project`, "Completed"));
  }

  /**
   * Builds a Docker image using the Dockerfile in the scan project directory.
   * The image is tagged with the name of the container.
   */
  private buildDockerImage(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Building docker image`));
    const buildImageCommand = `docker image build --quiet --no-cache --tag ${
      this.containerName
    } ${resolve(this.packagePath)}`;
    const response = cmd(buildImageCommand);
    const error = checkCmdError(response);
    this.logger.addLog(getTask(taskId, error ?? `Docker image built`, error ? "Failed" : "Completed"));
  }

  /**
   * Creates a Docker container using the Docker image created by
   * {@link buildDockerImage}. The container is given the name of the
   * container, and a volume is mounted at /home/ort/results:rw using the
   * scan project directory as the source. Any errors encountered during the
   * creation of the container are logged to the store.
   */
  private createDockerContainer(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Creating docker container`));
    const createContainerCommand = `docker container create --volume ${join(
      this.packagePath
    )}:/home/ort/results:rw --name ${this.containerName} ${this.containerName}`;
    const response = cmd(createContainerCommand);
    const error = checkCmdError(response);
    this.logger.addLog(getTask(taskId, error ?? `Docker container created`, error ? "Failed" : "Completed"));
  }

  /**
   * Starts the Docker container with an interactive terminal using the
   * previously created Docker image. Logs the process and any errors
   * encountered to the ScanLogger.
   */
  private startDockerContainer(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Running docker container`));
    const startContainerCommand = `docker container start --interactive ${this.containerName}`;
    const response = cmd(startContainerCommand);
    const error = checkCmdError(response);
    this.logger.addLog(getTask(taskId, error ?? `Docker container started`, error ? "Failed" : "Completed"));
  }

  /**
   * Stops the Docker container with the given name if it exists. Logs the
   * process and any errors encountered to the ScanLogger.
   */
  private stopDockerContainer(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Stopping docker container`));
    const exists = this.existsDockerContainer();
    let error;
    if (exists) {
      const stopContainerCommand = `docker container stop ${this.containerName}`;
      const response = cmd(stopContainerCommand);
      error = checkCmdError(response);
    }
    this.logger.addLog(getTask(taskId, error ?? `Docker container stopped`, error ? "Failed" : "Completed"));
  }

  /**
   * Removes the Docker container with the given name if it exists. Logs the
   * process and any errors encountered to the ScanLogger.
   */
  private removeDockerContainer(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Removing docker container`));
    const exists = this.existsDockerContainer();
    let error;
    if (exists) {
      const removeContainerCommand = `docker container rm --volumes ${this.containerName}`;
      const response = cmd(removeContainerCommand);
      error = checkCmdError(response);
    }
    this.logger.addLog(getTask(taskId, error ?? `Docker container removed`, error ? "Failed" : "Completed"));
  }

  private existsDockerContainer(): boolean {
    const listContainerCommand = ` docker container ls --all --quiet --filter "name=${this.containerName}"`;
    const response = cmd(listContainerCommand);
    return response.stdout.trim() !== "";
  }

  /**
   * Checks for policy violations in the evaluation result YAML file.
   * Logs the process and any errors encountered to the ScanLogger.
   * If violations are found, adds a message to the ViolationsStore.
   */
  private checkViolations(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Checking for violations`));
    const evaluationFilePath = join(this.packagePath, "evaluation-result.yml");
    const evaluationYaml = fileToYaml(evaluationFilePath);
    if (!evaluationYaml) {
      this.logger.addLog(getTask(taskId, `No evaluation result found`, "Failed"));
      return;
    }
    this.logger.addLog(getTask(taskId, `Violations checked`, "Completed"));
    const nextTaskId = this.getTaskId();
    this.logger.addLog(getTask(nextTaskId, `Logging violations`));
    const evaluationJson = yamlToJson(evaluationYaml);
    const violations = evaluationJson.evaluator.violations;
    violations.forEach((violation: any) => {
      this.logger.addLog(getViolation(violation.rule, violation.pkg, violation.license, violation.licenseSource, violation.severity, violation.message));
    });
    this.logger.addLog(getTask(nextTaskId, `Violations logged`, "Completed"));
  }
}
