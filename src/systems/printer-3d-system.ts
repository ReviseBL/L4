import type { PrintJobDefinition } from '../domain/printing/print-job-types';

export class Printer3DSystem {
  private readonly definitions = new Map<string, PrintJobDefinition>();
  private currentJob: PrintJobDefinition | null = null;

  public constructor(
    definitions: readonly PrintJobDefinition[],
    currentPrintId: string | null = null,
  ) {
    for (const definition of definitions) {
      this.definitions.set(definition.id, definition);
    }

    if (currentPrintId !== null) {
      this.currentJob = this.requireDefinition(currentPrintId);
    }
  }

  public startPrint(printJobId: string): PrintJobDefinition {
    const job = this.requireDefinition(printJobId);
    this.currentJob = job;
    return job;
  }

  public completePrint(printJobId: string): PrintJobDefinition {
    const job = this.requireDefinition(printJobId);
    this.currentJob = null;
    return job;
  }

  public reset(): void {
    this.currentJob = null;
  }

  public getCurrentJob(): PrintJobDefinition | null {
    return this.currentJob;
  }

  private requireDefinition(printJobId: string): PrintJobDefinition {
    const job = this.definitions.get(printJobId);

    if (!job) {
      throw new Error(`Unknown print job: ${printJobId}`);
    }
    return job;
  }
}
