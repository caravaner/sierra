// Shared primitives
export { Entity } from "./shared/entity.base";
export { ValueObject } from "./shared/value-object.base";
export { DomainEvent } from "./shared/domain-event.base";
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
export { OrderService } from "./order/order.service";
export type { PlaceOrderInput } from "./order/order.service";

// Product
export { Product } from "./product/product.entity";
export { Money, SKU } from "./product/product.value-objects";
export type { ProductRepository } from "./product/product.repository";
export { ProductService } from "./product/product.service";
export type { CreateProductInput, UpdateProductInput } from "./product/product.service";

// Inventory
export { InventoryItem } from "./inventory/inventory.entity";
export type { InventoryRepository } from "./inventory/inventory.repository";
export { InventoryService } from "./inventory/inventory.service";

// Customer
export { Customer } from "./customer/customer.entity";
export type { CustomerAddress } from "./customer/customer.entity";
export type { CustomerRepository } from "./customer/customer.repository";
export { CustomerService } from "./customer/customer.service";
export type { SyncUserInput } from "./customer/customer.service";
