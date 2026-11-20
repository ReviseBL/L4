import type { ServiceWaitDefinition } from '../../domain/challenges/service-wait-types';

export const serviceWaits: Readonly<Record<string, ServiceWaitDefinition>> = {
  kebab: {
    id: 'kebab',
    vendorName: 'PAN OD KEBABA',
    spot: { x: 1610, y: 1310 },
    radius: 110,
    bubbleAt: { x: 1610, y: 1168 },
    lines: [
      'Mieszany? Mieszany!',
      'Duży? Duży. Na grubym.',
      'Cebulka jest, ostre będzie?',
      'Mięsko się kręci, chwileczkę…',
      'Mieszany… mieszany… zawijam.',
    ],
    lineMs: 1_500,
    readyLine: 'Gotowe! Smacznego, szefie.',
    startMessage: 'Mieszany/mieszany się robi. Nie odchodź od budki.',
    leftMessage: 'Odszedłeś od budki. Kebab poczeka, ale się nie zrobi bez Ciebie.',
    backMessage: 'Wracasz pod budkę. Mięso dalej się kręci.',
    stillCookingMessage: 'Jeszcze chwila. Mieszany/mieszany się robi.',
    promptLabel: 'KEBAB SIĘ ROBI',
  },
};

export function getServiceWait(id: string): ServiceWaitDefinition | null {
  return serviceWaits[id] ?? null;
}
