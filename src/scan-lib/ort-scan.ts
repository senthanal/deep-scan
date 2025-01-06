import { ScanLogger } from "./ScanLogger";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { PackageJson } from "type-fest";
import { checkCmdError, cmd, fileToYaml, yamlToJson } from "./utils";
import { ViolationsStore } from "./ViolationsStore";

export class OrtScan {
  private readonly containerName = "deep-scan";
  private readonly packagePath = resolve(__dirname, "../../", "project-scan");
  private readonly templatePath = resolve(__dirname, "templates");

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
    ortConfigRepo = 'https://github.com/senthanal/ort-config.git'
  ): Promise<void> {
    this.createPackagePath();
    const packageJson = this.getPackageJson(packageName, packageVersion);
    this.writePackageJson(packageJson);
    this.copyDockerfile();
    this.updateOrtConfigRepo(ortConfigRepo);
    this.copyDockerEntry();
    this.buildDockerImage();
    this.stopDockerContainer();
    this.removeDockerContainer();
    this.createDockerContainer();
    this.startDockerContainer();
    this.stopDockerContainer();
    this.removeDockerContainer();
    this.checkViolations();
  }

  /**
   * Creates the directory for the scan project if it does not already exist, or
   * cleans it if it does exist. This is necessary because the directory is used
   * to store the temporary files for the scan, and we don't want to leave any
   * files behind after the scan has finished running.
   */
  private createPackagePath(): void {
    if (existsSync(this.packagePath)) {
      ScanLogger.getInstance().addMessage(`Scan project directory already exists`);
      ScanLogger.getInstance().addMessage(`Cleaning scan project directory`);
      rmSync(this.packagePath, { recursive: true });
      ScanLogger.getInstance().addMessage(`done`);
    }
    ScanLogger.getInstance().addMessage(`Creating scan project directory`);
    mkdirSync(this.packagePath);
    ScanLogger.getInstance().addMessage(`done`);
  }

  /**
   * Reads the package.json file from the template directory, adds the given
   * package and version to the dependencies, and returns the package.json
   * object.
   *
   * @param packageName - The name of the package to add to the dependencies.
   * @param packageVersion - The version of the package to add to the
   *                         dependencies.
   * @returns The package.json object with the added package and version.
   */
  private getPackageJson(
    packageName: string,
    packageVersion: string
  ): PackageJson {
    const msg = `Adding ${packageName}@${packageVersion} to the scan project dependencies`;
    ScanLogger.getInstance().addMessage(msg);
    const packageJson = JSON.parse(
      readFileSync(join(this.templatePath, "package.json"), "utf8")
    ) as PackageJson;
    packageJson.dependencies = {
      ...packageJson.dependencies,
      [packageName]: packageVersion,
    };
    ScanLogger.getInstance().addMessage(`done`);
    return packageJson;
  }

  /**
   * Writes the given package json to the scan project directory.
   * @param packageJson - The package json to write.
   */
  private writePackageJson(packageJson: PackageJson): void {
    ScanLogger.getInstance().addMessage(`Writing package json to the scan project`);
    const content = JSON.stringify(packageJson, null, 2);
    const path = join(this.packagePath, "package.json");
    writeFileSync(path, content);
    ScanLogger.getInstance().addMessage(`done`);
  }

  /**
   * Copies the Dockerfile from the template directory to the scan project
   * directory. This is necessary because the Dockerfile is used to build the
   * Docker image, and the Dockerfile must be in the same directory as the
   * package.json file.
   */
  private copyDockerfile(): void {
    ScanLogger.getInstance().addMessage(`Copying Dockerfile to the scan project`);
    const path = join(this.packagePath, "Dockerfile");
    writeFileSync(
      path,
      readFileSync(join(this.templatePath, "Dockerfile"), "utf8")
    );
    ScanLogger.getInstance().addMessage(`done`);
  }

  private updateOrtConfigRepo(ortConfigRepo: string): void {
    ScanLogger.getInstance().addMessage(`Updating ORT config repo to ${ortConfigRepo}`);
    const path = join(this.packagePath, "Dockerfile");
    const dockerfile = readFileSync(path, "utf8");
    const updatedDockerfile = dockerfile.replace( "${ort-config-repo}",
      "https://github.com/senthanal/ort-config.git"
    );
    writeFileSync(path, updatedDockerfile);
    ScanLogger.getInstance().addMessage(`done`);
  }

  /**
   * Copies the entrypoint.sh file from the template directory to the scan project
   * directory. This is necessary because the entrypoint.sh file is used to run the
   * Docker container, and the entrypoint.sh file must be in the same directory as
   * the package.json file.
   */
  private copyDockerEntry(): void {
    ScanLogger.getInstance().addMessage(`Copying entrypoint.sh to the scan project`);
    const path = join(this.packagePath, "entrypoint.sh");
    writeFileSync(
      path,
      readFileSync(join(this.templatePath, "entrypoint.sh"), "utf8")
    );
    ScanLogger.getInstance().addMessage(`done`);
  }

  /**
   * Builds a Docker image using the Dockerfile in the scan project directory.
   * This image is tagged with the container's name. The build process does not
   * use cache to ensure a fresh image is created. Any errors encountered during
   * the build are logged to the store.
   */
  private buildDockerImage(): void {
    ScanLogger.getInstance().addMessage(`Building docker image`);
    const buildImageCommand = `docker image build --quiet --no-cache --tag ${
      this.containerName
    } ${resolve(this.packagePath)}`;
    const response = cmd(buildImageCommand);
    checkCmdError(response);
    ScanLogger.getInstance().addMessage(`done`);
  }

  /**
   * Creates a Docker container using the image created in {@link buildDockerImage}.
   * The container is created with a volume mount to the results directory of the
   * scan project, and the container is given the same name as the image. The
   * container is not started automatically, but the container is stopped and
   * removed after the scan is finished. Any errors encountered during the
   * creation of the container are logged to the store.
   */
  private createDockerContainer(): void {
    ScanLogger.getInstance().addMessage(`Creating docker container`);
    const createContainerCommand = `docker container create --volume ${join(
      this.packagePath,
    )}:/home/ort/results:rw --name ${this.containerName} ${this.containerName}`;
    const response = cmd(createContainerCommand);
    checkCmdError(response);
    ScanLogger.getInstance().addMessage(`done`);
  }

  /**
   * Starts the Docker container created by {@link createDockerContainer}.
   * The container is started in interactive mode. Any errors encountered
   * during the start of the container are logged to the store.
   */
  private startDockerContainer(): void {
    ScanLogger.getInstance().addMessage(`Running docker container`);
    const startContainerCommand = `docker container start --interactive ${this.containerName}`;
    const response = cmd(startContainerCommand);
    checkCmdError(response);
    ScanLogger.getInstance().addMessage(`done`);
  }

  private stopDockerContainer(): void {
    ScanLogger.getInstance().addMessage(`Stopping docker container`);
    const exists = this.existsDockerContainer();
    if (exists) {
      ScanLogger.getInstance().addMessage(`Docker container exists`);
      const stopContainerCommand = `docker container stop ${this.containerName}`;
      const response = cmd(stopContainerCommand);
      checkCmdError(response);
    }
    else {
      ScanLogger.getInstance().addMessage(`Docker container does not exist`);
    }
    ScanLogger.getInstance().addMessage(`done`);
  }

  private removeDockerContainer(): void {
    ScanLogger.getInstance().addMessage(`Removing docker container`);
    const exists = this.existsDockerContainer();
    if (exists) {
      ScanLogger.getInstance().addMessage(`Docker container exists`);
      const removeContainerCommand = `docker container rm --volumes ${this.containerName}`;
      const response = cmd(removeContainerCommand);
      checkCmdError(response);
    } else {
      ScanLogger.getInstance().addMessage(`Docker container does not exist`);
    }
    ScanLogger.getInstance().addMessage(`done`);
  }

  private existsDockerContainer(): boolean {
    const listContainerCommand = ` docker container ls --all --quiet --filter "name=${this.containerName}"`;
    const response = cmd(listContainerCommand);
    return response.stdout.trim() !== "";
  }

  private checkViolations(): void {
    ScanLogger.getInstance().addMessage(`Checking for violations`);
    const evaluationFilePath = join(this.packagePath, "evaluation-result.yml");
    const evaluationYaml = fileToYaml(evaluationFilePath);
    if(!evaluationYaml) {
      ScanLogger.getInstance().addMessage(`No evaluation result found`);
      return;
    }
    const evaluationJson = yamlToJson(evaluationYaml);
    const violations = evaluationJson.evaluator.violations;
    if (violations.length > 0) {
      ScanLogger.getInstance().addMessage(`Violations found`);
      ViolationsStore.getInstance().addMessage(`Violations found`);
    } else {
      ScanLogger.getInstance().addMessage(`No violations found`);
      ViolationsStore.getInstance().addMessage(`No violations found`);
    }
    ScanLogger.getInstance().addMessage(`done`);
  }
}
