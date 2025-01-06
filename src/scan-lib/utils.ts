import { spawnSync } from "node:child_process";
import { CmdResponse } from "./types";
import { ScanLogger } from "./ScanLogger";
import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";

/**
 * Checks if there is an error from running a command, and if there is, adds a message
 * to the store with the error
 * @param response the response from running the command
 */
export function checkCmdError(response: CmdResponse): void {
  if (response.stderr) {
    ScanLogger.getInstance().addMessage(response.stderr.split("\n").join("<br>"));
  }
}

/**
 * Runs a command and logs the output to the store
 * @param command the command to run
 * @returns the response from running the command
 */
export function cmd(command: string): CmdResponse {
  ScanLogger.getInstance().addMessage(`Running command: ${command}`);
  return spawnSync(command,{
    shell: true,
    stdio: "pipe",
    cwd: process.cwd(),
    encoding: "utf-8",
    env: process.env
  });
}

export function fileToYaml(filePath: string): string | undefined {
  ScanLogger.getInstance().addMessage(`Reading file: ${filePath}`);
  let yamlString: string | undefined;
  try {
    yamlString = readFileSync(filePath, "utf8");
  } catch (error) {
    ScanLogger.getInstance().addMessage(`Error reading file: ${filePath}`);
  }
  return yamlString;
}

export function yamlToJson(fileContent: string): any {
  const yamlContent = parseDocument(fileContent);
  return yamlContent.toJSON();
}

