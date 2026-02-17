import type { PrismaClient } from "@sierra/db";
import type { Command, Principal } from "@sierra/domain";
import { PrismaUnitOfWork } from "../uow/unit-of-work";
import { UowOrderRepository } from "../repositories/uow/order.repository.uow";
import { UowCustomerRepository } from "../repositories/uow/customer.repository.uow";
import { UowProductRepository } from "../repositories/uow/product.repository.uow";
import { UowInventoryRepository } from "../repositories/uow/inventory.repository.uow";

export interface Repos {
  orderRepo: UowOrderRepository;
  customerRepo: UowCustomerRepository;
  productRepo: UowProductRepository;
  inventoryRepo: UowInventoryRepository;
}

export async function runCommand<TParams, TResult>(
  prisma: PrismaClient,
  principal: Principal,
  factory: (uow: PrismaUnitOfWork, repos: Repos) => Command<TParams, TResult>,
  params: TParams,
): Promise<TResult> {
  const uow = new PrismaUnitOfWork(prisma);
  const repos: Repos = {
    orderRepo: new UowOrderRepository(prisma, uow),
    customerRepo: new UowCustomerRepository(prisma, uow),
    productRepo: new UowProductRepository(prisma, uow),
    inventoryRepo: new UowInventoryRepository(prisma, uow),
  };
  const command = factory(uow, repos);
  const result = await command.execute(principal, params);
  await uow.commit({
    commandName: command.constructor.name,
    commandId: command.id,
    principalId: principal.id,
    timestamp: command.timestamp,
  });
  return result;
}
