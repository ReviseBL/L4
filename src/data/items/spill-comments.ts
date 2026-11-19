/** Hubi's verdict on the delivered coffee, best first. */
export const coffeeDeliveryComments = [
  { minFullness: 1, line: 'Ani kropli. Barista byłby dumny.' },
  { minFullness: 0.6, line: 'Trochę się rozlało. Da się pić.' },
  { minFullness: 0.01, line: 'Zostało na dnie. Smakuje porażką.' },
  { minFullness: 0, line: 'Pusty kubek. Kupiłem sobie spacer.' },
] as const;

export function getCoffeeDeliveryComment(fullness: number): string {
  const match = coffeeDeliveryComments.find((comment) => fullness >= comment.minFullness);
  return (match ?? coffeeDeliveryComments[coffeeDeliveryComments.length - 1]!).line;
}
