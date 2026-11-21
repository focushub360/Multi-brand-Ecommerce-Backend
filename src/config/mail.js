import nodemailer from 'nodemailer';
import { env } from './env.js';

let transporter = null;

export const getMailTransporter = async () => {
  if (transporter) return transporter;

  if (env.SMTP_USER && env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASSWORD
      }
    });
    console.log(`📧 Nodemailer configured with SMTP host: ${env.SMTP_HOST}`);
  } else {
    // Development fallback: Create Ethereal test account or logging transporter
    try {
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass
        }
      });
      console.log(`📧 Nodemailer initialized with Ethereal Test Account: ${testAccount.user}`);
    } catch {
      // Safe logger mock if external network is unavailable
      transporter = {
        sendMail: async (options) => {
          console.log('📧 [Mock Email Dispatcher]:', {
            to: options.to,
            subject: options.subject,
            preview: options.text || options.html
          });
          return { messageId: 'mock-mail-id-12345' };
        }
      };
      console.log('📧 Nodemailer running in local mock logging mode.');
    }
  }

  return transporter;
};

