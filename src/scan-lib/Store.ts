export class Store {
  private static instance: Store;

  message: string[] = [];
  messageType: "info" | "error" | "verbose" = "info";
  constructor(
    message: string[],
    messageType: "info" | "error" | "verbose" = "info"
  ) {
    this.messageType = messageType;
    this.message = message;
  }
  public addMessage(message: string, type = "info"): void {
    if (type === this.messageType) {
      this.message.push(message);
    }
    if (this.messageType === "verbose") {
      this.message.push(message);
    }
  }
  public clearMessages(): void {
    this.message = [];
  }
  public isEmpty(): boolean {
    return this.message.length === 0;
  }
  public toString(): string {
    return this.message.join("<br>");
  }

  public static getInstance(): Store {
    if (!Store.instance) {
      Store.instance = new Store([]);
    }
    return Store.instance;
  }
}
