import type { Session } from "@sierra/auth";
import { AttributeBag, type Principal } from "@sierra/domain";

export function toPrincipal(session: Session): Principal {
  return {
    id: session.user.id,
    email: session.user.email ?? "",
    name: session.user.name ?? null,
    role: session.user.role,
    attributes: AttributeBag.empty(),
  };
}
