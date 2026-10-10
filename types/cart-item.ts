export interface CartItem {
  id: string;
  name: string;
  title?: string;
  slug?: string;
  imageUrl?: string | null;
  quantity: number;
  priceInr: number | null;
  priceUsd: number | null;
}
