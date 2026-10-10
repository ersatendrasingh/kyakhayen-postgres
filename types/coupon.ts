export type CouponType = {
  id: string;
  code: string;
  description?: string | null;
  discountType: "FIXED_PRODUCT" | "CART_PERCENTAGE";
  discountValue?: number | null;
  expiryDate?: Date | null;
  isActive: boolean;
  createdAt: Date;
};
