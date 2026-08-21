import type { PrintJobDefinition } from '../../domain/printing/print-job-types';

export const printJobDefinitions = [
  {
    id: 'cable-holder',
    displayName: 'UCHWYT DO KABLA',
    filamentType: 'PETG',
    durationLabel: '7h 42m',
    description: 'Niezbędny uchwyt do kabla, którego bez drukarki 3D absolutnie nie dałoby się kupić.',
  },
  {
    id: 'l4-400',
    displayName: 'L4 — WERSJA 400%',
    filamentType: 'ZESTAW DO PROJEKTU L4',
    filamentUsage: '1,7 KG',
    durationLabel: '46h 13m',
    description: 'Ogromne przestrzenne L4, bo zwykła kartka nie oddaje skali zaangażowania.',
  },
] as const satisfies readonly PrintJobDefinition[];
