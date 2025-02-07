import {OrtScan} from "./OrtScan";
import {ScanProjectOptions} from "./types";
import {getTask} from "./utils";
import {join, normalize, resolve} from "path";
import {copyFileSync, cpSync} from "node:fs";
import {existsSync, mkdirSync, readFileSync, rmSync, writeFileSync} from "fs";

export class ScanProject extends OrtScan<ScanProjectOptions> {
  constructor(logger: any, scanOptions: ScanProjectOptions) {
    super(logger, scanOptions);
  }

  public scan(): void {
    this.checkDependencies();
    this.createPackagePath();
    this.copyDockerfile();
    this.copyProjectFiles(this.scanOptions.projectPath);
    this.copyOrtConfigFiles(this.scanOptions.projectConfigPath);
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

  /**
   * Copies the project files from the given project folder to the scan project.
   * @param projectFolder
   * @private
   */
  private copyProjectFiles(projectFolder: string): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Copying project files to the scan project`));
    const sourcePath = normalize(resolve(projectFolder));
    const destPath = normalize(resolve(this.packagePath));

    // Add Windows long path prefix if needed
    const sourceWithPrefix = process.platform === 'win32' ? `\\\\?\\${sourcePath}` : sourcePath;
    const destWithPrefix = process.platform === 'win32' ? `\\\\?\\${destPath}` : destPath;

    cpSync(sourceWithPrefix, destWithPrefix, {recursive: true});
    this.logger.addLog(getTask(taskId, `Copied project files to the scan project`, "Completed"));
  }

  /**
   * Copies the ORT config files from the given folder to the scan project.
   * @param ortConfigFolder
   * @private
   */
  private copyOrtConfigFiles(ortConfigFolder: string): void {
    const taskId = this.getTaskId();
    this.logger.addLog(getTask(taskId, `Copying ORT config files to the scan project`));
    const path = join(this.packagePath, ".ort/config");
    cpSync(ortConfigFolder, path, {recursive: true});
    this.logger.addLog(getTask(taskId, `Copied ORT config files to the scan project`, "Completed"));
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




