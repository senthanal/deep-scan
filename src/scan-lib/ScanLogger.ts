import { Message, ScanLog, Violation } from "./types";

export class ScanLogger {
  private static instance: ScanLogger;

  scanLog: ScanLog = { messages: [], violations: [] };

  message: string[] = [];
  messageType: "info" | "error" | "verbose" = "info";
  constructor(messages: Message[] = [], violations: Violation[] = []) {
    this.scanLog.messages = messages;
    this.scanLog.violations = violations;
  }
  public addMessage(message: string, type = "info"): void {
    const messageObj = { message, type } as Message;
    this.scanLog.messages.push(messageObj);
  }
  public clearMessages(): void {
    this.scanLog.messages = [];
  }
  public hasNoMessages(): boolean {
    return this.scanLog.messages.length === 0;
  }
  public formatMessageAsString(separator = "<br>"): string {
    return this.scanLog.messages.map(m=>m.message).join(separator);
  }

  public static getInstance(): ScanLogger {
    if (!ScanLogger.instance) {
      ScanLogger.instance = new ScanLogger();
    }
    return ScanLogger.instance;
  }
}
