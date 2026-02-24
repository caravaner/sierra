import {DomainEvent} from "../shared/domain-event.base";
import type {CustomerAddress} from "./customer.entity";

export interface CustomerCreatedPayload {
    userId: string;
    email?: string;
    phone: string
    firstName: string;
    lastName: string;
}

export class CustomerCreatedEvent extends DomainEvent<CustomerCreatedPayload> {
    constructor(aggregateId: string, principalId: string, payload: CustomerCreatedPayload) {
        super(aggregateId, "Customer", "Customer.Created", principalId, payload);
    }
}

export interface CustomerProfileUpdatedPayload {
    before: { email: any; firstName: string; lastName: string, phone: string };
    after: { email: any; firstName: string; lastName: string, phone: string };
}

export class CustomerProfileUpdatedEvent extends DomainEvent<CustomerProfileUpdatedPayload> {
    constructor(aggregateId: string, principalId: string, payload: CustomerProfileUpdatedPayload) {
        super(aggregateId, "Customer", "Customer.ProfileUpdated", principalId, payload);
    }
}

export class CustomerAddressAddedEvent extends DomainEvent<{ address: CustomerAddress }> {
    constructor(aggregateId: string, principalId: string, payload: { address: CustomerAddress }) {
        super(aggregateId, "Customer", "Customer.AddressAdded", principalId, payload);
    }
}
