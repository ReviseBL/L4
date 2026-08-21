import { describe, expect, it } from 'vitest';
import { printJobDefinitions } from '../src/data/printing/print-jobs';
import { Printer3DSystem } from '../src/systems/printer-3d-system';

describe('Printer3DSystem', () => {
  it('starts a data-defined cable holder print', () => {
    const printer = new Printer3DSystem(printJobDefinitions);
    const job = printer.startPrint('cable-holder');

    expect(job.displayName).toBe('UCHWYT DO KABLA');
    expect(job.filamentType).toBe('PETG');
    expect(job.durationLabel).toBe('7h 42m');
    expect(printer.getCurrentJob()).toBe(job);
  });

  it('restores and completes a persisted print job', () => {
    const printer = new Printer3DSystem(printJobDefinitions, 'cable-holder');

    expect(printer.getCurrentJob()?.id).toBe('cable-holder');
    expect(printer.completePrint('cable-holder').displayName).toBe('UCHWYT DO KABLA');
    expect(printer.getCurrentJob()).toBeNull();
  });
});
