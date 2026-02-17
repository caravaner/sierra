import { AggregateRoot } from "../shared/aggregate-root.base";
import { AttributeBag } from "../shared/attribute-bag";
import type { DomainEvent } from "../shared/domain-event.base";
import {
  CustomerCreatedEvent,
  CustomerProfileUpdatedEvent,
  CustomerAddressAddedEvent,
} from "./customer.events";

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
  attributes: AttributeBag;
  createdAt: Date;
  updatedAt: Date;
}

export class Customer extends AggregateRoot<CustomerProps> {
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
  get attributes() {
    return this.props.attributes;
  }
  get createdAt() {
    return this.props.createdAt;
  }
  get updatedAt() {
    return this.props.updatedAt;
  }

  protected reconstruct(id: string, props: CustomerProps, events: ReadonlyArray<DomainEvent>): this {
    return new Customer(id, props, events) as this;
  }

  static create(principalId: string, params: {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
  }): Customer {
    const now = new Date();
    const props: CustomerProps = {
      userId: params.userId,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      addresses: [],
      attributes: AttributeBag.empty(),
      createdAt: now,
      updatedAt: now,
    };

    const event = new CustomerCreatedEvent(params.id, principalId, {
      userId: params.userId,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
    });

    return new Customer(params.id, props, [event]);
  }

  static reconstitute(params: {
    id: string;
    userId: string;
    email: string;
    firstName: string;
    lastName: string;
    addresses?: CustomerAddress[];
    attributes?: AttributeBag;
    createdAt?: Date;
    updatedAt?: Date;
  }): Customer {
    return new Customer(params.id, {
      userId: params.userId,
      email: params.email,
      firstName: params.firstName,
      lastName: params.lastName,
      addresses: params.addresses ?? [],
      attributes: params.attributes ?? AttributeBag.empty(),
      createdAt: params.createdAt ?? new Date(),
      updatedAt: params.updatedAt ?? new Date(),
    });
  }

  updateProfile(principalId: string, params: {
    email?: string;
    firstName?: string;
    lastName?: string;
  }): Customer {
    const before = {
      email: this.props.email,
      firstName: this.props.firstName,
      lastName: this.props.lastName,
    };
    const after = {
      email: params.email ?? this.props.email,
      firstName: params.firstName ?? this.props.firstName,
      lastName: params.lastName ?? this.props.lastName,
    };

    return this.addEvent(
      {
        ...this.props,
        email: after.email,
        firstName: after.firstName,
        lastName: after.lastName,
        updatedAt: new Date(),
      },
      new CustomerProfileUpdatedEvent(this.id, principalId, { before, after }),
    );
  }

  addAddress(principalId: string, address: Omit<CustomerAddress, "id">): Customer {
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

    return this.addEvent(
      {
        ...this.props,
        addresses,
        updatedAt: new Date(),
      },
      new CustomerAddressAddedEvent(this.id, principalId, { address: newAddress }),
    );
  }

  withAttributes(attrs: AttributeBag): Customer {
    return this.reconstruct(this.id, { ...this.props, attributes: attrs }, this.domainEvents);
  }
}
