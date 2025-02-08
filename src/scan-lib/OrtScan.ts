import {ScanLogger} from "./ScanLogger";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "fs";
import {join, resolve} from "path";
import {
  checkCmdError,
  cmd,
  fileToYaml,
  getTask,
  getViolation, isDockerInstalled, isDockerRunning, isGitInstalled,
  yamlToJson
} from "./utils";

export class OrtScan<T> {
  private readonly containerName = "deep-scan";
  protected readonly templatePath = resolve(__dirname, "templates");
  protected readonly packagePath = resolve(__dirname, "../../", "project-scan");
  protected taskCounter = 0;
  protected readonly logger: ScanLogger;
  protected readonly scanOptions: T;

  public constructor(logger: ScanLogger, scanOptions: T) {
    this.logger = logger;
    this.scanOptions = scanOptions;
  }

  /**
   * Returns a unique task id for the scan process.
   * @private
   */
  protected getTaskId(): number {
    this.taskCounter += 1;
    return this.taskCounter;
  }

  /**
   * Checks if the dependencies required for the scan are installed. If they are
   * not installed, logs an error message and exits the process.
   */
  protected checkDependencies() {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Checking dependencies needed for the scan`));
    let conditions = [];
    // Check if git is installed and available in the command line
    conditions.push(isGitInstalled());
    // Check if docker is installed and available in the command line
    conditions.push(isDockerInstalled());
    // Check if docker is running
    conditions.push(isDockerRunning());

    const failed = conditions.some(condition => !condition);
    this.logger.addLog(getTask(taskId, `Dependencies checked`, failed ? "Failed" : "Completed"));
    failed && process.exit(1);
  }

  /**
   * Creates the scan project directory if it does not exist, or
   * cleans the directory if it does exist. This is necessary because the
   * Docker image is built from the contents of the scan project directory.
   */
  protected createPackagePath(): void {
    this.cleanUp();
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Creating scan project directory`));
    mkdirSync(this.packagePath);
    this.logger.addLog(getTask(taskId, `Scan project directory created`, "Completed"));
  }

  /**
   * Copies the entrypoint.sh file from the template directory to the scan
   * project directory. This file is used as the entrypoint for the Docker
   * container.
   */
  protected copyDockerEntry(): void {
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
  protected buildDockerImage(): void {
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
  protected createDockerContainer(): void {
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
  protected startDockerContainer(): void {
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
  protected stopDockerContainer(): void {
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
  protected removeDockerContainer(): void {
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

  /**
   * Checks if a Docker container with the given name exists. Returns true if
   * the container exists, and false otherwise.
   * @private
   */
  protected existsDockerContainer(): boolean {
    const listContainerCommand = ` docker container ls --all --quiet --filter "name=${this.containerName}"`;
    const response = cmd(listContainerCommand);
    return response.stdout.trim() !== "";
  }

  /**
   * Checks if the scan result YAML file contains an evaluation. If it does not,
   * logs a message to the ScanLogger and returns true. Otherwise, logs a message
   * to the ScanLogger and returns false.
   * @private
   */
  protected noEvaluationInScanResult(): boolean {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Checking for evaluation in scan result`));
    const scanFilePath = join(this.packagePath, "scan-result.yml");
    if (!existsSync(scanFilePath)) {
      this.logger.addLog(getTask(taskId, `No scan result found`, "Failed"));
      return false;
    }
    const scanYaml = fileToYaml(scanFilePath);
    if (!scanYaml) {
      this.logger.addLog(getTask(taskId, `No scan result found`, "Failed"));
      return false;
    }
    const scanJson = yamlToJson(scanYaml);
    if (!scanJson.evaluator) {
      this.logger.addLog(getTask(taskId, `No evaluation found in scan result`, "Completed"));
      return true;
    }
    this.logger.addLog(getTask(taskId, `Evaluation found in scan result`, "Completed"));
    return false;
  }

  /**
   * Checks for policy violations in the evaluation result YAML file.
   * Logs the process and any errors encountered to the ScanLogger.
   * If violations are found, adds a message to the ViolationsStore.
   */
  protected checkViolations(): void {
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

  protected cleanUp(): void {
    const taskId = this.getTaskId();
    if (existsSync(this.packagePath)) {
      this.logger.addLog(getTask(taskId, `Cleaning scan project directory`));
      rmSync(this.packagePath, {recursive: true});
      this.logger.addLog(getTask(taskId, `Scan project directory cleaned`, "Completed"));
    }
  }
}
