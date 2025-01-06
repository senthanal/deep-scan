import { Task, ScanLog, Violation, TaskStatus } from './types';
import { updateTask } from './utils';

export class ScanLogger {
  scanLog: ScanLog = { messages: [], violations: [] };

  constructor(messages: Task[] = [], violations: Violation[] = []) {
    this.scanLog.messages = messages;
    this.scanLog.violations = violations;
  }
  public addLog(id: number, name: string, status: TaskStatus = 'In Progress'): void {
    const task = { id, name, status } as Task;
    this.scanLog.messages = updateTask(this.scanLog.messages, task);
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
