import { Task, ScanLog, Violation, TaskStatus } from './types';
import { updateTask } from './utils';

export class ScanLogger {
  private static instance: ScanLogger;

  scanLog: ScanLog = { messages: [], violations: [] };

  constructor(messages: Task[] = [], violations: Violation[] = []) {
    this.scanLog.messages = messages;
    this.scanLog.violations = violations;
  }
  public addMessage(id: number, name: string, status: TaskStatus = 'In Progress'): void {
    const task = { id, name, status } as Task;
    this.scanLog.messages = updateTask(this.scanLog.messages, task);
  }
  public clearMessages(): void {
    this.scanLog.messages = [];
  }
  public hasNoMessages(): boolean {
    return this.scanLog.messages.length === 0;
  }
  public formatMessageAsString(separator = "<br>"): string {
    return this.scanLog.messages.map(m=>m.name).join(separator);
  }

  public static getInstance(): ScanLogger {
    if (!ScanLogger.instance) {
      ScanLogger.instance = new ScanLogger();
    }
    return ScanLogger.instance;
  }
}
