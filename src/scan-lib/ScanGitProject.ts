import {OrtScan} from "./OrtScan";
import {ScanGitProjectOptions} from "./types";
import {
  checkCmdError,
  cmd,
  enableGitLongPaths,
  enableWindowsLongPaths,
  getTask,
  isDockerInstalled, isDockerRunning,
  isGitInstalled,
  isGitLongPathsEnabled,
  isWindowsLongPathsEnabled, removeGitFolder
} from "./utils";
import {join, resolve} from "path";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "fs";
import {copyFileSync, cpSync} from "node:fs";
import {platform} from "node:os";

export class ScanGitProject extends OrtScan<ScanGitProjectOptions>{
  constructor(logger: any, scanOptions: ScanGitProjectOptions) {
    super(logger, scanOptions);
  }

  public scan(): void {
    this.checkDependencies();
    this.createPackagePath();
    this.checkoutProject();
    this.checkoutProjectConfig();
    this.copyDockerfile();
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
    if (this.scanOptions.projectResultsPath) {
      this.copyResultsToOutputDir(this.scanOptions.projectResultsPath);
    }
    this.cleanUp();
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
    // Check if Windows long path support is enabled, if the platform is win32 and long path support is not enabled
    if (platform() === "win32" && !this.scanOptions.enableLongPath) {
      conditions.concat([isWindowsLongPathsEnabled(), isGitLongPathsEnabled()]);
    }
    // Check if Windows long path support is enabled, if the platform is win32 and long path support is enabled
    if(platform() === "win32" && this.scanOptions.enableLongPath) {
      const nextTaskId = this.getTaskId();
      this.logger.addLog(getTask(nextTaskId, `Enabling Windows long path support`));
      !isWindowsLongPathsEnabled(true) && enableWindowsLongPaths();
      !isGitLongPathsEnabled(true) && enableGitLongPaths();
      this.logger.addLog(getTask(nextTaskId, `Enabled Windows long path support`, "Completed"));
    }
    // Check if all conditions are met and is true
    const failed = conditions.some(condition => !condition);
    this.logger.addLog(getTask(taskId, `Dependencies checked`, failed ? "Failed" : "Completed"));
    failed && process.exit(1);
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
      readFileSync(join(this.templatePath, "scan-project", "Dockerfile"), "utf8")
    );
    this.logger.addLog(getTask(taskId, `Copied Dockerfile to the scan project`, "Completed"));
  }

  private checkoutProject(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Checking out project from git repository`));
    const checkoutCommand = `git clone --depth 1 --branch ${this.scanOptions.projectBranch} ${this.scanOptions.projectUrl} ${this.packagePath}`;
    const response = cmd(checkoutCommand);
    const error = checkCmdError(response);
    removeGitFolder(this.packagePath);
    this.logger.addLog(getTask(taskId, error ?? `Project checked out`, error ? "Failed" : "Completed"));
  }

  private checkoutProjectConfig(): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Checking out project ORT config from git repository`));
    // Create ort config folder in the package path
    const ortConfigPath = join(this.packagePath, ".ort/config");
    mkdirSync(ortConfigPath, {recursive: true});
    const checkoutCommand = `git clone --depth 1 --branch ${this.scanOptions.projectConfigBranch} ${this.scanOptions.projectConfigUrl}`;
    let error;
    if(this.scanOptions.projectConfigFolder) {
      const tempPath = join(this.packagePath, ".ort/temp");
      mkdirSync(tempPath, {recursive: true});
      const response = cmd(`${checkoutCommand} ${tempPath}`);
      error = checkCmdError(response);
      if(!error) {
        const configPath = join(tempPath, this.scanOptions.projectConfigFolder);
        cpSync(configPath, ortConfigPath, {recursive: true});
        rmSync(tempPath, {recursive: true});
      }
    }
    else{
      const response = cmd(`${checkoutCommand} ${ortConfigPath}`);
      error = checkCmdError(response);
    }
    removeGitFolder(ortConfigPath);
    this.logger.addLog(getTask(taskId, error ?? `Project ORT config checked out`, error ? "Failed" : "Completed"));
  }

  /**
   * Copies the scan results to the output directory.
   * @param outputDir
   * @private
   */
  protected copyResultsToOutputDir(outputDir: string): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Copying scan results to output directory`));
    const outputPath = resolve(outputDir);
    if (!existsSync(outputPath)) {
      mkdirSync(outputPath);
    }
    rmSync(outputPath, {recursive: true});
    mkdirSync(outputPath);
    const filesToCopy = ["analyzer-result.yml", "scan-result.yml", "evaluation-result.yml", "bom.cyclonedx.json", "scan-report-web-app.html"];
    filesToCopy.forEach((file) => {
      const source = join(this.packagePath, file);
      const destination = join(outputPath, file);
      if(existsSync(source)) {
        copyFileSync(source, destination);
      }
    });
    this.logger.addLog(getTask(taskId, `Copied scan results to output directory`, "Completed"));
  }
}



