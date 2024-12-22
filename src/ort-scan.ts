import { Store } from "./Store";
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { join, resolve } from "path";
import { PackageJson } from "type-fest";
import Docker from "dockerode";
import { buffer, text } from "stream/consumers";

export class OrtScan {
  private readonly packagePath = resolve(__dirname, "../", "project-scan");
  private readonly templatePath = resolve(__dirname, "templates");

  public async scan(packageName: string, packageVersion: string): Promise<void> {
    this.createPackagePath();
    const packageJson = this.getPackageJson(packageName, packageVersion);
    this.writePackageJson(packageJson);
    this.copyDockerfile();
    this.copyDockerEntry();
    await this.buildDockerImage();
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
    const dockerInstance = new Docker({host: "localhost", port: 2375});
    const stream = await dockerInstance.buildImage({context: this.packagePath, src: ['Dockerfile', 'package.json', 'entrypoint.sh']}, {t: "deep-scan", rm: true});
    const chunks = await this.getChunks(stream);
    const output = chunks.toString("utf8");
    Store.getInstance().addMessage(output, "verbose");
    Store.getInstance().addMessage(`done`);
  }

  private getChunks(stream: NodeJS.ReadableStream): Promise<Buffer> {
    const chunks: Uint8Array[]  = [];
    return new Promise((resolve, reject) => {
      stream.on("data", (chunk) => chunks.push(chunk));
      stream.on("end", () => resolve(Buffer.concat(chunks)));
      stream.on("error", (err) => reject(err));
    });
  }
}
