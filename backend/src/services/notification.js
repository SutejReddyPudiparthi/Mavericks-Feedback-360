import prisma from '../prismaClient.js';

export const notify = async (userId, type, message, channels = ['Portal']) => {
  for (const channel of channels) {
    await prisma.notification.create({
      data: { userId, channel, type, message, deliveryStatus: 'Sent' },
    });
  }
  // Email/SMS stubs — replace with SES/Twilio in production
  if (channels.includes('Email')) console.log(`[EMAIL] → ${userId}: ${message}`);
  if (channels.includes('SMS'))   console.log(`[SMS]   → ${userId}: ${message}`);
};
