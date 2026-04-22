import { prisma } from "@/lib/prisma";

/**
 * Portable JSON-serialisable value type — same shape as Prisma.InputJsonValue
 * but defined locally to avoid depending on the generated Prisma namespace.
 */
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue };

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
