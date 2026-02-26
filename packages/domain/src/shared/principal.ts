import { AttributeBag } from "./attribute-bag";

export interface Principal {
  id: string;
  email: string;
  name: string | null;
  role: "USER" | "ADMIN" | 'SUPERADMIN';
  attributes: AttributeBag;
}
