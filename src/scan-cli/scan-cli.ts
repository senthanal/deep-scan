import { OrtScan } from "@senthanal/deep-scan-lib";
import { TerminalLogger } from "@senthanal/deep-scan-lib";
import { ScanCliOptions } from "./types";

export class ScanCli {
  private readonly options: ScanCliOptions;
  constructor(options: ScanCliOptions) {
    this.options = options;
    this.startScan();
  }

  startScan() {
    const logger = new TerminalLogger();
    const ortScan = new OrtScan(logger);
    ortScan.scan(this.options.packageName, this.options.packageVersion, this.options.ortConfigRepoUrl);
  }

  toString(): string {
    return JSON.stringify(this.options);
  }
}


