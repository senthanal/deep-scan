import ora from "ora";
import { ScanLogger } from "./ScanLogger";
import { Task, Violation } from './types';
import { bgRed, green, white } from "yoctocolors";

export class TerminalLogger extends ScanLogger {
  private readonly spinner: Map<number, any> = new Map();
  constructor() {
    super([], []);
  }

  public addLog<T extends object>(log: T): void {
      super.addLog(log);
      if (this.isTaskLog(log) && !this.isTaskHasSpinner(log as Task)) {
        const spinner = ora((log as Task).name).start();
        this.spinner.set((log as Task).id, spinner);
      }
      if (this.isTaskLog(log) && this.isTaskHasSpinner(log as Task) && (log as Task).status === "Completed") {
        const spinner = this.spinner.get((log as Task).id);
        spinner.succeed((log as Task).name);
        this.spinner.delete((log as Task).id);
      }
      if (this.isTaskLog(log) && this.isTaskHasSpinner(log as Task) && (log as Task).status === "Failed") {
        const spinner = this.spinner.get((log as Task).id);
        spinner.fail((log as Task).name);
        this.spinner.delete((log as Task).id);
      }
      if (this.isViolationLog(log)) {
        const violation = log as Violation;
        const logMessage = `${bgRed(white(violation.severity))} ${green(violation.packageName)} -> ${violation.message}`;
        ora({text: logMessage, spinner: undefined}).start().stopAndPersist();
      }
  }

  private isTaskHasSpinner(task: Task): boolean {
    return this.spinner.has(task.id);
  }


  public formatTaskLog(taskLog: Task): string {
    return `${taskLog.id}( ${taskLog.status} ) -> ${taskLog.name}`;
  }

  private formatViolationLog(violationLog: Violation): string {
    return `( ${violationLog.severity} )${violationLog.rule}: ${violationLog.message}`;
  }
}


