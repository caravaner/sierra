// Shared primitives
export { Entity } from "./shared/entity.base";
export { ValueObject } from "./shared/value-object.base";
export { DomainEvent } from "./shared/domain-event.base";
export { AggregateRoot } from "./shared/aggregate-root.base";
export { Command } from "./shared/command.base";
export { AttributeBag, Attribute, attribute } from "./shared/attribute-bag";
export type { AttributeType, Mapper } from "./shared/attribute-bag";
export type { Principal } from "./shared/principal";
export type { UnitOfWork, CommandMeta, UowRepository } from "./shared/unit-of-work";
export type { Repository } from "./shared/repository.interface";

// Order
export { Order } from "./order/order.entity";
export {
  OrderItem,
  OrderStatus,
  ShippingAddress,
  ORDER_STATUSES,
} from "./order/order.value-objects";
export type { OrderStatusType, OrderItemProps, ShippingAddressProps } from "./order/order.value-objects";
export type { OrderRepository } from "./order/order.repository";
export { OrderPlacedEvent, OrderStatusChangedEvent, OrderCancelledEvent } from "./order/order.events";
export { PlaceOrderCommand } from "./order/commands/place-order.command";
export type { PlaceOrderParams } from "./order/commands/place-order.command";
export { CancelOrderCommand } from "./order/commands/cancel-order.command";
export { UpdateOrderStatusCommand } from "./order/commands/update-order-status.command";
export { calculateDeliveryFee } from "./order/delivery-fee.service";
export type { DeliveryConfig } from "./order/delivery-fee.service";

// Product
export { Product } from "./product/product.entity";
export { Money, SKU } from "./product/product.value-objects";
export type { ProductRepository } from "./product/product.repository";
export { ProductCreatedEvent, ProductUpdatedEvent, ProductActivatedEvent, ProductDeactivatedEvent } from "./product/product.events";
export { CreateProductCommand } from "./product/commands/create-product.command";
export type { CreateProductParams } from "./product/commands/create-product.command";
export { UpdateProductCommand } from "./product/commands/update-product.command";
export type { UpdateProductParams } from "./product/commands/update-product.command";

// Inventory
export { InventoryItem } from "./inventory/inventory.entity";
export type { InventoryRepository } from "./inventory/inventory.repository";
export { StockReservedEvent, StockReleasedEvent, StockReplenishedEvent } from "./inventory/inventory.events";
export { ReplenishStockCommand } from "./inventory/commands/replenish-stock.command";
export type { ReplenishStockParams } from "./inventory/commands/replenish-stock.command";

// Subscription
export { Subscription } from "./subscription/subscription.entity";
export { SubscriptionItem } from "./subscription/subscription.value-objects";
export type { SubscriptionStatusType, SubscriptionShippingAddress, SubscriptionItemProps } from "./subscription/subscription.value-objects";
export type { SubscriptionRepository } from "./subscription/subscription.repository";
export { SubscriptionCreatedEvent, SubscriptionPausedEvent, SubscriptionResumedEvent, SubscriptionCancelledEvent } from "./subscription/subscription.events";
export { CreateSubscriptionCommand } from "./subscription/commands/create-subscription.command";
export type { CreateSubscriptionParams } from "./subscription/commands/create-subscription.command";
export { PauseSubscriptionCommand } from "./subscription/commands/pause-subscription.command";
export { ResumeSubscriptionCommand } from "./subscription/commands/resume-subscription.command";
export { CancelSubscriptionCommand } from "./subscription/commands/cancel-subscription.command";

// Customer
export { Customer } from "./customer/customer.entity";
export type { CustomerAddress } from "./customer/customer.entity";
export type { CustomerRepository } from "./customer/customer.repository";
export { CustomerCreatedEvent, CustomerProfileUpdatedEvent, CustomerAddressAddedEvent } from "./customer/customer.events";
export { SyncCustomerCommand } from "./customer/commands/sync-customer.command";
export type { SyncCustomerParams } from "./customer/commands/sync-customer.command";
export { AddAddressCommand } from "./customer/commands/add-address.command";
export type { AddAddressParams } from "./customer/commands/add-address.command";
