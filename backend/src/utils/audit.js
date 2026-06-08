import { AuditLog } from "../models/index.js";

export const audit = async (
  actorId,
  action,
  entityType,
  entityId,
  oldValue = null,
  newValue = null,
) => {
  await AuditLog.create({
    actorId,
    action,
    entityType,
    entityId,
    oldValue: oldValue ? JSON.stringify(oldValue) : null,
    newValue: newValue ? JSON.stringify(newValue) : null,
  });
};
