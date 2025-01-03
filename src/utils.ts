import { spawnSync } from "node:child_process";
import { CmdResponse } from "./types";
import { Store } from "./Store";

/**
 * Checks if there is an error from running a command, and if there is, adds a message
 * to the store with the error
 * @param response the response from running the command
 * @param dockerCmdOutput the output of the docker command
 */
export function checkCmdError(response: CmdResponse, dockerCmdOutput: string): void {
  if (response.stderr) {
    Store.getInstance().addMessage(response.stderr.split("\n").join("<br>"));
  }
}

/**
 * Runs a command and logs the output to the store
 * @param command the command to run
 * @returns the response from running the command
 */
export function cmd(command: string): CmdResponse {
  Store.getInstance().addMessage(`Running command: ${command}`);
  return spawnSync(command,{
    shell: true,
    stdio: "pipe",
    cwd: process.cwd(),
    encoding: "utf-8",
    env: process.env
  });
}
