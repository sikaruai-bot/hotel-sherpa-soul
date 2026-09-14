import nodemailer from 'nodemailer';
import { CommunicationChannel } from '@prisma/client';
import { prisma } from './prisma';
import { config } from 'dotenv';

config();

/**
 * Sends an email using nodemailer. Returns true on success.
 */
async function sendEmail(to: string, subject: string, html: string): Promise<boolean> {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP configuration missing, email not sent');
    return false;
  }

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `no-reply@${process.env.NEXT_PUBLIC_APP_URL}`,
      to,
      subject,
      html,
    });
    return true;
  } catch (err) {
    console.error('Email send error:', err);
    return false;
  }
}

/**
 * Placeholder for WhatsApp message sending. Replace with real provider implementation.
 */
async function sendWhatsApp(to: string, templateName: string, templateData: Record<string, any>): Promise<boolean> {
  // In production, integrate with Twilio/360dialog etc.
  console.info(`WhatsApp send placeholder -> to=${to}, template=${templateName}`);
  return true;
}

/**
 * Core notification dispatcher used by the job queue.
 */
export async function dispatchNotification(params: {
  channel: CommunicationChannel;
  recipient: string;
  templateName: string;
  subject?: string;
  htmlContent?: string;
  templateData?: Record<string, any>;
}): Promise<boolean> {
  const { channel, recipient, templateName, subject, htmlContent, templateData } = params;
  let delivered = false;
  switch (channel) {
    case CommunicationChannel.EMAIL:
      if (!subject || !htmlContent) {
        console.warn('Email dispatch missing subject or htmlContent');
        break;
      }
      delivered = await sendEmail(recipient, subject, htmlContent);
      break;
    case CommunicationChannel.WHATSAPP:
      delivered = await sendWhatsApp(recipient, templateName, templateData || {});
      break;
    case CommunicationChannel.SMS:
    case CommunicationChannel.IN_APP:
    case CommunicationChannel.OTA_MESSAGE:
    default:
      console.warn(`Channel ${channel} not implemented yet`);
      break;
  }
  // Record in Notification table for audit / inbox.
  try {
    await prisma.notification.create({
      data: {
        title: `Notification: ${templateName}`,
        detail: `Sent via ${channel} to ${recipient}`,
        type: 'General',
        channel: channel,
        status: delivered ? 'Delivered' : 'Failed',
      },
    });
  } catch (e) {
    console.error('Failed to persist notification record:', e);
  }
  return delivered;
}

/**
 * Convenience wrapper for email notifications.
 */
export async function sendEmailNotification(to: string, subject: string, html: string, templateName: string) {
  return dispatchNotification({
    channel: CommunicationChannel.EMAIL,
    recipient: to,
    templateName,
    subject,
    htmlContent: html,
  });
}

/**
 * Convenience wrapper for WhatsApp notifications.
 */
export async function sendWhatsAppNotification(to: string, templateName: string, templateData: Record<string, any>) {
  return dispatchNotification({
    channel: CommunicationChannel.WHATSAPP,
    recipient: to,
    templateName,
    templateData,
  });
}
