const getDayWithSuffix = (day: number) => {
  if (day > 3 && day < 21) return `${day}th`;
  switch (day % 10) {
    case 1:
      return `${day}st`;
    case 2:
      return `${day}nd`;
    case 3:
      return `${day}rd`;
    default:
      return `${day}th`;
  }
};

export const formatDateTime = (date: Date, locale: string) => {
  const day = getDayWithSuffix(date.getDate());
  const month = date.toLocaleString(locale, { month: "short" });
  const year = date.getFullYear();
  const time = date
    .toLocaleString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .toUpperCase();

  return `${month} ${day}, ${year} at ${time}`;
};
