import { Entity } from "../shared/entity.base";

export interface CustomerAddress {
  id: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  isDefault: boolean;
}

interface CustomerProps {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  addresses: CustomerAddress[];
  createdAt: Date;
  updatedAt: Date;
}

export class Customer extends Entity<CustomerProps> {
  get userId() {
    return this.props.userId;
  }
  get email() {
    return this.props.email;
  }
  get firstName() {
    return this.props.firstName;
  }
  get lastName() {
    return this.props.lastName;
  }
  get fullName() {
    return `${this.props.firstName} ${this.props.lastName}`;
  }
  get addresses() {
    return this.props.addresses;
  }
  get defaultAddress() {
    return this.props.addresses.find((a) => a.isDefault) ?? null;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(params: {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    addresses?: CustomerAddress[];
    createdAt?: Date;
    updatedAt?: Date;
  }): Customer {
    return new Customer(params.id, {
      userId: params.userId,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      addresses: params.addresses ?? [],
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  updateProfile(params: {
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Customer {
    return new Customer(this.id, {
      ...this.props,
      email: params.email ?? this.props.email,
      firstName: params.firstName ?? this.props.firstName,
      lastName: params.lastName ?? this.props.lastName,
      updatedAt: new Date(),
    });
  }

  addAddress(address: Omit<CustomerAddress, "id">): Customer {
    const newAddress: CustomerAddress = {
      ...address,
      id: crypto.randomUUID(),
    };

    let addresses = [...this.props.addresses, newAddress];
    if (newAddress.isDefault) {
      addresses = addresses.map((a) => ({
        ...a,
        isDefault: a.id === newAddress.id,
      }));
    }

    return new Customer(this.id, {
      ...this.props,
      addresses,
      updatedAt: new Date(),
    });
  }
}
