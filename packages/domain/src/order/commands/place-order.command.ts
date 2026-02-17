import { Command } from "../../shared/command.base";
import type { Principal } from "../../shared/principal";
import type { UnitOfWork } from "../../shared/unit-of-work";
import type { OrderRepository } from "../order.repository";
import type { InventoryRepository } from "../../inventory/inventory.repository";
import { Order } from "../order.entity";
import { OrderItem, ShippingAddress } from "../order.value-objects";

export interface PlaceOrderParams {
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

export class PlaceOrderCommand extends Command<PlaceOrderParams, { id: string }> {
  constructor(
    uow: UnitOfWork,
    private orderRepo: OrderRepository,
    private inventoryRepo: InventoryRepository,
  ) {
    super(uow);
  }

  async execute(principal: Principal, input: PlaceOrderParams): Promise<{ id: string }> {
    // Check availability
    for (const item of input.items) {
      const inv = await this.inventoryRepo.findByProductId(item.productId);
      if (!inv || inv.quantityAvailable < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // Reserve stock
    for (const item of input.items) {
      const inv = await this.inventoryRepo.findByProductId(item.productId);
      if (!inv) throw new Error(`No inventory for product ${item.productId}`);
      const reserved = inv.reserve(principal.id, item.quantity);
      await this.inventoryRepo.save(reserved);
    }

    // Create order
    const orderItems = input.items.map((i) => OrderItem.create(i));
    const shippingAddress = ShippingAddress.create(input.shippingAddress);

    const order = Order.create(principal.id, {
      id: crypto.randomUUID(),
      customerId: input.customerId,
      items: orderItems,
      shippingAddress,
    });

    await this.orderRepo.save(order);
    return { id: order.id };
  }
}
