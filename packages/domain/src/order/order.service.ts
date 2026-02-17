import { Order } from "./order.entity";
import { OrderItem, ShippingAddress } from "./order.value-objects";
import type { OrderRepository } from "./order.repository";
import type { InventoryService } from "../inventory/inventory.service";
import type { OrderStatusType } from "./order.value-objects";

export interface PlaceOrderInput {
  customerId: string;
  items: { productId: string; name: string; quantity: number; unitPrice: number }[];
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
}

export class OrderService {
  constructor(
    private orderRepo: OrderRepository,
    private inventoryService: InventoryService,
  ) {}

  async placeOrder(input: PlaceOrderInput): Promise<Order> {
    // Check and reserve stock for each item
    for (const item of input.items) {
      const available = await this.inventoryService.checkAvailability(
        item.productId,
        item.quantity,
      );
      if (!available) {
        throw new Error(
          `Insufficient stock for product ${item.productId}`,
        );
      }
    }

    // Reserve inventory
    for (const item of input.items) {
      await this.inventoryService.reserveStock(item.productId, item.quantity);
    }

    const orderItems = input.items.map((i) => OrderItem.create(i));
    const shippingAddress = ShippingAddress.create(input.shippingAddress);

    const order = Order.create({
      id: crypto.randomUUID(),
      customerId: input.customerId,
      items: orderItems,
      shippingAddress,
    });

    return this.orderRepo.save(order);
  }

  async cancelOrder(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");

    const cancelled = order.cancel();

    // Release reserved inventory
    for (const item of order.items) {
      await this.inventoryService.releaseStock(item.productId, item.quantity);
    }

    return this.orderRepo.save(cancelled);
  }

  async updateOrderStatus(
    orderId: string,
    newStatus: OrderStatusType,
  ): Promise<Order> {
    const order = await this.orderRepo.findById(orderId);
    if (!order) throw new Error("Order not found");

    const updated = order.updateStatus(newStatus);
    return this.orderRepo.save(updated);
  }
}
