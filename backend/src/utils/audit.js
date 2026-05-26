import prisma from '../prismaClient.js';

export const audit = async (actorId, action, entityType, entityId, oldValue = null, newValue = null) => {
  await prisma.auditLog.create({
    data: {
      actorId,
      action,
      entityType,
      entityId,
      oldValue: oldValue ? JSON.stringify(oldValue) : null,
      newValue: newValue ? JSON.stringify(newValue) : null,
    },
  });
};
