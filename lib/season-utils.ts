export type SeasonMonthRange = {
  startMonth: number;
  endMonth: number;
};

export function seasonMonthRange(title: string): SeasonMonthRange {
  const normalized = title.trim().toLowerCase();

  if (normalized.includes("summer")) {
    return { startMonth: 3, endMonth: 6 };
  }

  if (
    normalized.includes("rain") ||
    normalized.includes("monsoon")
  ) {
    return { startMonth: 7, endMonth: 10 };
  }

  if (normalized.includes("winter")) {
    return { startMonth: 11, endMonth: 2 };
  }

  if (normalized.includes("spring")) {
    return { startMonth: 3, endMonth: 4 };
  }

  if (normalized.includes("fall") || normalized.includes("autumn")) {
    return { startMonth: 9, endMonth: 11 };
  }

  return { startMonth: 1, endMonth: 12 };
}

export function monthIsInRange(month: number, range: SeasonMonthRange) {
  if (range.startMonth <= range.endMonth) {
    return month >= range.startMonth && month <= range.endMonth;
  }

  return month >= range.startMonth || month <= range.endMonth;
}
