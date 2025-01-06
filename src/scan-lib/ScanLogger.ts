import { Task, ScanLog, Violation } from './types';
import { updateTask } from './utils';

export class ScanLogger {
  scanLog: ScanLog = { messages: [], violations: [] };

  constructor(messages: Task[] = [], violations: Violation[] = []) {
    this.scanLog.messages = messages;
    this.scanLog.violations = violations;
  }
  public addLog<T extends object>(log: T): void {
    if (this.isTaskLog(log)) {
      this.scanLog.messages = updateTask(this.scanLog.messages, log as unknown as Task);
    }
    if (this.isViolationLog(log)) {
      this.scanLog.violations.push(log as unknown as Violation);
    }
  }
  public resetLog(): void {
    this.scanLog.messages = [];
    this.scanLog.violations = [];
  }
  public hasNoTaskLogs(): boolean {
    return this.scanLog.messages.length === 0;
  }
  public formatTaskLogAsString(separator = "<br>"): string {
    return this.scanLog.messages.map(m=>m.name).join(separator);
  }

  public formatViolationLogAsString(separator = "<br>"): string {
    return this.scanLog.violations.map(m=>`(${m.severity})${m.rule}: ${m.message}`).join(separator);
  }

  public isTaskLog<T extends object>(log: T): boolean {
    return "id" in log;
  }

  public isViolationLog<T extends object>(log: T): boolean {
    return "rule" in log;
  }
}
