import { ScanLogger } from "./ScanLogger";
import { Task, Violation } from "./types";

export class TerminalLogger extends ScanLogger {
  constructor() {
    super([], []);
  }

  public addLog<T extends object>(log: T): void {
      super.addLog(log);
      if (this.isTaskLog(log)) {
        console.log(this.formatTaskLog(log as Task));
      }
      if (this.isViolationLog(log)) {
        console.log(this.formatViolationLog(log as Violation));
      }
  }

  public formatTaskLog(taskLog: Task): string {
    return `${taskLog.id}( ${taskLog.status} ) -> ${taskLog.name}`;
  }

  private formatViolationLog(violationLog: Violation): string {
    return `( ${violationLog.severity} )${violationLog.rule}: ${violationLog.message}`;
  }
}


