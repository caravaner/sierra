export interface DeliveryConfig {
  deliveryFee: number;
  freeDeliveryFrom: number;
}

export function calculateDeliveryFee(orderSubtotal: number, config: DeliveryConfig): number {
  if (orderSubtotal >= config.freeDeliveryFrom) return 0;
  return config.deliveryFee;
}
