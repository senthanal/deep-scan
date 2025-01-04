export class ViolationsStore {
  private static instance: ViolationsStore;

  message: string = "";
  constructor(
    message: string
  ) {
    this.message = message;
  }
  public addMessage(message: string): void {
    this.message = message
  }
  public clearMessages(): void {
    this.message = "";
  }
  public isEmpty(): boolean {
    return this.message.trim() === "";
  }

  public toString(): string {
    return this.message;
  }

  public static getInstance(): ViolationsStore {
    if (!ViolationsStore.instance) {
      ViolationsStore.instance = new ViolationsStore("");
    }
    return ViolationsStore.instance;
  }
}
