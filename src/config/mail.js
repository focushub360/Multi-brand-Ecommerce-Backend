import nodemailer from 'nodemailer';
import { env } from './env.js';

// Do NOT cache — always build fresh from current env values
export const getMailTransporter = async () => {
  if (!env.SMTP_USER || !env.SMTP_PASSWORD) {
    console.warn('⚠️  SMTP credentials missing — falling back to mock email logger.');
    return {
      sendMail: async (options) => {
        console.log('\n📧 [Mock Email — No SMTP Configured]');
        console.log('  To:', options.to);
        console.log('  Subject:', options.subject);
        return { messageId: 'mock-no-smtp-' + Date.now() };
      }
    };
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_SECURE, // true = SSL on port 465
    auth: {
      user: env.SMTP_USER,
      pass: env.SMTP_PASSWORD
    },
    tls: {
      rejectUnauthorized: false // Allow self-signed certs in dev
    }
  });

  // Verify connection — throw immediately if credentials are wrong
  try {
    await transporter.verify();
    console.log(`✅ SMTP connected: ${env.SMTP_HOST}:${env.SMTP_PORT} as ${env.SMTP_USER}`);
  } catch (verifyErr) {
    console.error(`❌ SMTP connection FAILED: ${verifyErr.message}`);
    console.error('   Check SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD in .env');
    // Still throw so the caller knows email will not work
    throw new Error(`SMTP verification failed: ${verifyErr.message}`);
  }

  return transporter;
};
