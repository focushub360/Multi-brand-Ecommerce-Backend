import { getMailTransporter } from '../config/mail.js';
import { env } from '../config/env.js';

/**
 * Dispatches an email via configured Nodemailer transporter.
 */
export const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const transporter = await getMailTransporter();
    const mailOptions = {
      from: env.EMAIL_FROM,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>?/gm, '')
    };

    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (err) {
    console.error(`❌ Email delivery failed to ${to}: ${err.message}`);
    throw err;
  }
};

/**
 * Sends Dealer Application Approval Email with 12-character Temporary Password
 */
export const sendDealerApprovalEmail = async ({ to, ownerName, businessName, temporaryPassword, expiryHours = 24 }) => {
  const subject = `Welcome to GROVE – Dealer Application Approved for ${businessName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h2 style="color: #1B4332; margin: 0; font-size: 26px;">GROVE Marketplace</h2>
        <p style="color: #4A5568; font-size: 14px; margin-top: 4px;">Dealer Operations & Partner Onboarding</p>
      </div>

      <div style="background-color: #F0FDF4; border-left: 4px solid #16A34A; padding: 16px; margin-bottom: 20px; border-radius: 4px;">
        <h3 style="color: #15803D; margin: 0 0 6px 0; font-size: 16px;">Congratulations, ${ownerName}!</h3>
        <p style="color: #166534; margin: 0; font-size: 14px;">Your dealership application for <strong>${businessName}</strong> has been officially approved by GROVE Platform Administration.</p>
      </div>

      <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        You can now access your dedicated Dealer Portal. To begin, please log in with your temporary password:
      </p>

      <div style="background-color: #F8FAFC; border: 1px dashed #94A3B8; padding: 16px; text-align: center; border-radius: 8px; margin: 24px 0;">
        <p style="color: #64748B; font-size: 12px; text-transform: uppercase; margin: 0 0 6px 0; letter-spacing: 0.5px; font-weight: bold;">Temporary One-Time Password</p>
        <div style="font-family: monospace; font-size: 22px; font-weight: bold; color: #0F172A; letter-spacing: 2px;">
          ${temporaryPassword}
        </div>
        <p style="color: #DC2626; font-size: 12px; margin: 8px 0 0 0; font-weight: 500;">
          ⚠️ Valid for ${expiryHours} hours only. You will be prompted to set a permanent password upon initial login.
        </p>
      </div>

      <div style="text-align: center; margin-top: 30px;">
        <a href="${env.CLIENT_URL}/login" style="background-color: #1B4332; color: #ffffff; text-decoration: none; padding: 12px 28px; font-weight: bold; border-radius: 8px; font-size: 14px; display: inline-block;">
          Sign In to Dealer Portal &rarr;
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #E2E8F0; margin: 30px 0 20px 0;" />
      <p style="color: #94A3B8; font-size: 12px; text-align: center; margin: 0;">
        If you did not apply for this account, please contact GROVE Partner Desk at operations@grove.com immediately.
      </p>
    </div>
  `;

  return await sendEmail({ to, subject, html });
};

/**
 * Sends Dealer Application Rejection Email with Admin Reason
 */
export const sendDealerRejectionEmail = async ({ to, ownerName, businessName, reason }) => {
  const subject = `Update on your GROVE Dealership Application for ${businessName}`;
  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #E2E8F0; border-radius: 12px; background-color: #ffffff;">
      <h2 style="color: #1B4332; margin-top: 0;">GROVE Marketplace</h2>
      <p style="color: #334155; font-size: 14px;">Dear ${ownerName},</p>
      <p style="color: #334155; font-size: 14px; line-height: 1.6;">
        Thank you for your interest in partnering with GROVE as an authorized merchant. After reviewing your commercial documents for <strong>${businessName}</strong>, our operations team was unable to approve the application at this time.
      </p>

      <div style="background-color: #FEF2F2; border-left: 4px solid #EF4444; padding: 14px; margin: 20px 0; border-radius: 4px;">
        <p style="color: #991B1B; font-weight: bold; margin: 0 0 4px 0; font-size: 13px;">Reason for Decision:</p>
        <p style="color: #7F1D1D; margin: 0; font-size: 14px;">${reason || 'KYC documentation requirements were not satisfied or commercial criteria were incomplete.'}</p>
      </div>

      <p style="color: #64748B; font-size: 13px;">
        You may re-apply with updated GSTIN and warehouse documents or contact our Partner Support Desk if you have any questions.
      </p>
    </div>
  `;

  return await sendEmail({ to, subject, html });
};

