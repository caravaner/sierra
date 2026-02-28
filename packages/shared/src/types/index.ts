export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export interface ProductDTO {
  id: string;
  name: string;
  description: string | null;
  price: number;
  sku: string;
  category: string | null;
  images: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderDTO {
  id: string;
  customerId: string;
  status: OrderStatus;
  items: OrderItemDTO[];
  shippingAddress: AddressDTO;
  totalAmount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemDTO {
  id: string;
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface AddressDTO {
  street: string;
  city: string;
  state: string;
}

export interface InventoryDTO {
  id: string;
  productId: string;
  quantityOnHand: number;
  quantityReserved: number;
  quantityAvailable: number;
  reorderPoint: number;
  needsReorder: boolean;
}

export interface CustomerDTO {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  addresses: (AddressDTO & { id: string; isDefault: boolean })[];
  createdAt: Date;
}
