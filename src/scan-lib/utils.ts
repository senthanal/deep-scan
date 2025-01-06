import { spawnSync } from "node:child_process";
import { CmdResponse, Task, TaskStatus, Violation } from "./types";
import { readFileSync } from "node:fs";
import { parseDocument } from "yaml";

/**
 * Checks if there is an error from running a command, and if there is, adds a message
 * to the store with the error
 * @param response the response from running the command
 */
export function checkCmdError(response: CmdResponse): string | undefined {
  if (response.stderr) {
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
          name: `${t.name}...${task.name}`,
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

