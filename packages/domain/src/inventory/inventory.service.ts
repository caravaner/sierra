import type { InventoryRepository } from "./inventory.repository";

export class InventoryService {
  constructor(private inventoryRepo: InventoryRepository) {}

  async checkAvailability(
    productId: string,
    quantity: number,
  ): Promise<boolean> {
    const item = await this.inventoryRepo.findByProductId(productId);
    if (!item) return false;
    return item.quantityAvailable >= quantity;
  }

  async reserveStock(productId: string, quantity: number): Promise<void> {
    const item = await this.inventoryRepo.findByProductId(productId);
    if (!item) throw new Error(`No inventory for product ${productId}`);

    const reserved = item.reserve(quantity);
    await this.inventoryRepo.save(reserved);
  }

  async releaseStock(productId: string, quantity: number): Promise<void> {
    const item = await this.inventoryRepo.findByProductId(productId);
    if (!item) throw new Error(`No inventory for product ${productId}`);

    const released = item.release(quantity);
    await this.inventoryRepo.save(released);
  }

  async replenishStock(productId: string, quantity: number): Promise<void> {
    const item = await this.inventoryRepo.findByProductId(productId);
    if (!item) throw new Error(`No inventory for product ${productId}`);

    const replenished = item.replenish(quantity);
    await this.inventoryRepo.save(replenished);
  }
}
