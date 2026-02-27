export function formatCurrency(amount: number | string, currency = "NGN"): string {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency,
  }).format(typeof amount === "string" ? parseFloat(amount) : amount);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** 500 → "50cl", 1500 → "1.5L", 19000 → "19L" */
export function formatVolume(ml: number): string {
  if (ml >= 1000) {
    const l = ml / 1000;
    return `${Number.isInteger(l) ? l : l.toFixed(1)}L`;
  }
  return `${ml / 10}cl`;
}

/** "50cl × 20", "19L", "1.5L × 12" */
export function formatPackSize(volumeMl: number, unitsPerPack: number): string {
  const vol = formatVolume(volumeMl);
  return unitsPerPack === 1 ? vol : `${vol} × ${unitsPerPack}`;
}

