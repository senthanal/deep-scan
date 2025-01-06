import { Task, ScanLog, Violation } from './types';
import { updateTask } from './utils';

export class ScanLogger {
  scanLog: ScanLog = { messages: [], violations: [] };

  constructor(messages: Task[] = [], violations: Violation[] = []) {
    this.scanLog.messages = messages;
    this.scanLog.violations = violations;
  }
  public addLog<T extends object>(log: T): void {
    if ("id" in log) {
      this.scanLog.messages = updateTask(this.scanLog.messages, log as unknown as Task);
    }
  }
  public resetLog(): void {
    this.scanLog.messages = [];
  }
  public hasNoLogs(): boolean {
    return this.scanLog.messages.length === 0;
  }
  public formatLogAsString(separator = "<br>"): string {
    return this.scanLog.messages.map(m=>m.name).join(separator);
  }
}
