import { Store } from "./Store";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { PackageJson } from "type-fest";
import Docker, { ContainerInfo } from "dockerode";
import { getChunks } from "./utils";

export class OrtScan {
  private readonly containerName = "deep-scan";
  private readonly packagePath = resolve(__dirname, "../", "project-scan");
  private readonly templatePath = resolve(__dirname, "templates");
  private readonly dockerInstance: Docker;

  public constructor() {
    this.dockerInstance = new Docker({ host: "localhost", port: 2375 });
  }

  public async scan(
    packageName: string,
    packageVersion: string
  ): Promise<void> {
    this.createPackagePath();
    const packageJson = this.getPackageJson(packageName, packageVersion);
    this.writePackageJson(packageJson);
    this.copyDockerfile();
    this.copyDockerEntry();
    await this.removeDockerContainer();
    await this.buildDockerImage();
    await this.runDockerContainer();
    await this.stopDockerContainer();
    await this.removeDockerContainer();
  }

  private createPackagePath(): void {
    if (existsSync(this.packagePath)) {
      Store.getInstance().addMessage(`Scan project directory already exists`);
      Store.getInstance().addMessage(`Cleaning scan project directory`);
      rmSync(this.packagePath, { recursive: true });
      Store.getInstance().addMessage(`done`);
    }
    Store.getInstance().addMessage(`Creating scan project directory`);
    mkdirSync(this.packagePath);
    Store.getInstance().addMessage(`done`);
  }

  private getPackageJson(
    packageName: string,
    packageVersion: string
  ): PackageJson {
    const msg = `Adding ${packageName}@${packageVersion} to the scan project dependencies`;
    Store.getInstance().addMessage(msg);
    const packageJson = JSON.parse(
      readFileSync(join(this.templatePath, "package.json"), "utf8")
    ) as PackageJson;
    packageJson.dependencies = {
      ...packageJson.dependencies,
      [packageName]: packageVersion,
    };
    Store.getInstance().addMessage(`done`);
    return packageJson;
  }

  private writePackageJson(packageJson: PackageJson): void {
    Store.getInstance().addMessage(`Writing package json to the scan project`);
    const content = JSON.stringify(packageJson, null, 2);
    const path = join(this.packagePath, "package.json");
    writeFileSync(path, content);
    Store.getInstance().addMessage(`done`);
  }

  private copyDockerfile(): void {
    Store.getInstance().addMessage(`Copying Dockerfile to the scan project`);
    const path = join(this.packagePath, "Dockerfile");
    writeFileSync(
      path,
      readFileSync(join(this.templatePath, "Dockerfile"), "utf8")
    );
    Store.getInstance().addMessage(`done`);
  }

  private copyDockerEntry(): void {
    Store.getInstance().addMessage(`Copying entrypoint.sh to the scan project`);
    const path = join(this.packagePath, "entrypoint.sh");
    writeFileSync(
      path,
      readFileSync(join(this.templatePath, "entrypoint.sh"), "utf8")
    );
    Store.getInstance().addMessage(`done`);
  }

  private async buildDockerImage(): Promise<void> {
    Store.getInstance().addMessage(`Building docker image`);
    const stream = await this.dockerInstance.buildImage(
      {
        context: this.packagePath,
        src: ["Dockerfile", "package.json", "entrypoint.sh"],
      },
      { t: this.containerName, rm: true, nocache: true }
    );
    const chunks = await getChunks(stream);
    const output = chunks.toString("utf8");
    Store.getInstance().addMessage(output, "verbose");
    Store.getInstance().addMessage(`done`);
  }

  private async runDockerContainer(): Promise<void> {
    Store.getInstance().addMessage(`Running docker container`);
    await this.dockerInstance.run(this.containerName, [], [], {
      name: this.containerName,
      HostConfig: {
        Binds: [
          `${this.packagePath}/results:/home/ort/results:rw`,
        ],
      },
    });
    Store.getInstance().addMessage(`done`);
  }

  private async stopDockerContainer(): Promise<void> {
    Store.getInstance().addMessage(`Stopping docker container`);
    const containerInfo = await this.getContainerInfo(this.containerName);
    if (containerInfo) {
      const container = this.dockerInstance.getContainer(containerInfo.Id);
      await container.stop();
    }
    Store.getInstance().addMessage(`done`);
  }

  private async removeDockerContainer(): Promise<void> {
    Store.getInstance().addMessage(`Removing docker container`);
    const containerInfo = await this.getContainerInfo(this.containerName);
    if (containerInfo) {
      const container = this.dockerInstance.getContainer(containerInfo.Id);
      await container.remove();
    }
    Store.getInstance().addMessage(`done`);
  }

  private async getContainerInfo(name: string): Promise<ContainerInfo | undefined> {
    const containers = await this.dockerInstance.listContainers();
    return containers.find((container) => container.Names.includes(name));
  }
}
