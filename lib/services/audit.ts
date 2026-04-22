import { prisma } from "@/lib/prisma";

/**
 * Portable JSON-serialisable value type — same shape as Prisma.InputJsonValue
 * but defined locally to avoid depending on the generated Prisma namespace.
 */
// Prisma's InputJsonValue does not include top-level null.
// Use undefined to skip setting a nullable JSON field.
type JsonValue =
  | string
  | number
  | boolean
  | JsonValue[]
  | { [key: string]: JsonValue | null | undefined };

export async function audit(opts: {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  payload?: JsonValue;
}): Promise<void> {
  await prisma.auditLog.create({
    data: {
      actorUserId: opts.actorUserId ?? null,
      action: opts.action,
      entityType: opts.entityType,
      entityId: opts.entityId ?? null,
      payloadJson: opts.payload,
    },
  });
}
