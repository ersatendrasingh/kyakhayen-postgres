export const formatCurrency = (value: number, currency: string) => {
  const formattedValue = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency,
  }).format(value);
  const trimmedValue = formattedValue.replace(/\.00$/, "");

  return trimmedValue;
};
