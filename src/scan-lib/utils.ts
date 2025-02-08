import { spawnSync } from "node:child_process";
import { CmdResponse, Task, TaskStatus, Violation } from "./types";
import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";
import {existsSync, rmSync} from "fs";
import {join} from "node:path";

/**
 * Checks if there is an error from running a command, and if there is, adds a message
 * to the store with the error
 * @param response the response from running the command
 */
export function checkCmdError(response: CmdResponse): string | undefined {
  if (response.status !== 0) {
    return response.stderr.split("\n").join("<br>");
  }
  return undefined;
}

/**
 * Runs a command and logs the output to the store
 * @param command the command to run
 * @returns the response from running the command
 */
export function cmd(command: string): CmdResponse {
  return spawnSync(command, {
    shell: true,
    stdio: "pipe",
    cwd: process.cwd(),
    encoding: "utf-8",
    env: process.env,
    windowsHide: true,
  });
}

export function fileToYaml(filePath: string): string | undefined {
  let yamlString: string | undefined;
  try {
    yamlString = readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Error reading file: ${filePath}`);
  }
  return yamlString;
}

export function yamlToJson(fileContent: string): any {
  const yamlContent = parseDocument(fileContent);
  return yamlContent.toJSON();
}

export function updateTask(tasks: Task[], task: Task): Task[] {
  let foundTask = tasks.find((t) => t.id === task.id);
  if (foundTask) {
    return tasks.map((t) => {
      if (t.id === task.id) {
        const updatedTask: Task = {
          id: task.id,
          name: task.name,
          status: task.status,
        };
        return updatedTask;
      }
      return t;
    });
  }
  tasks.push(task);
  return tasks;
}

export function getTask(id: number, name: string, status: TaskStatus = 'In Progress'): Task {
  return { id, name, status };
}

export function getViolation(rule: string, packageName: string, license: string, licenseSource: string, severity: string, message: string): Violation {
  return { rule, packageName, license, licenseSource, severity, message };
}

export function isWindowsLongPathsEnabled(skipLog = false): boolean {
  // Check Windows long path support
  const command: string = 'reg query "HKLM\\SYSTEM\\CurrentControlSet\\Control\\FileSystem" /v LongPathsEnabled';
  const registryOutput = cmd(command);
  const enabled = registryOutput.stdout.includes('0x1');
  !skipLog && !enabled && console.error('Windows long paths are not enabled. Rerun the command with -l argument to enable long path support.');
  return enabled;
}

export function isGitLongPathsEnabled(skipLog = false): boolean {
  const command: string = 'git config  --get core.longpaths';
  const gitOutput = cmd(command);
  const enabled = gitOutput.stdout.includes('true');
  !skipLog && !enabled && console.error('Git long paths are not enabled. Rerun the command with -l argument to enable long path support.');
  return enabled;
}

export function isGitInstalled(): boolean {
  const responseGit = cmd("git --version");
  responseGit.stderr && console.error("Git is not installed or not available in the command line");
  return responseGit.status === 0;
}

export function isDockerInstalled(): boolean {
  const responseDocker = cmd("docker --version");
  responseDocker.stderr && console.error("Docker is not installed or not available in the command line");
  return responseDocker.status === 0;
}

export function isDockerRunning(): boolean {
  const response = cmd("docker info");
  response.status !== 0 && console.error("Docker is not running");
  return response.status === 0;
}

export function enableGitLongPaths(): void {
  const response = cmd("git config --global core.longpaths true");
  if(response.stderr) {
    console.error("Error enabling git long paths");
    process.exit(1);
  }
}

export function enableWindowsLongPaths(): void {
  const response = cmd("reg add HKEY_LOCAL_MACHINE\\SYSTEM\\CurrentControlSet\\Control\\FileSystem /v LongPathsEnabled /t REG_DWORD /d 1 /f");
  if(response.stderr) {
    console.error("Error enabling windows long paths");
    process.exit(1);
  }
}

export function removeGitFolder(repositoryPath: string): void {
  const gitPath = join(repositoryPath, "/.git");
  if(existsSync(gitPath)) {
    rmSync(gitPath, {recursive: true});
  }
}
