const formatter = new Intl.NumberFormat("da-DK", {
  style: "currency",
  currency: "DKK",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export function formatDKK(amount: number): string {
  return formatter.format(amount);
}
