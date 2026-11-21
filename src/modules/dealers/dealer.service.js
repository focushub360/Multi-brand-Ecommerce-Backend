import { Dealer } from './dealer.model.js';
import { User } from '../users/user.model.js';
import { Category } from '../categories/category.model.js';
import { DEALER_STATUS } from '../../constants/dealerStatus.js';
import { ROLES } from '../../constants/roles.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSecurePassword } from '../../utils/generatePassword.js';
import { hashPassword } from '../../utils/passwordHash.js';
import { sendDealerApprovalEmail, sendDealerRejectionEmail } from '../../utils/sendEmail.js';
<<<<<<< HEAD
=======
import { NotificationService } from '../admin/service/notification.service.js';
import { AdminNotification } from '../admin/models/adminNotification.model.js';
import { AdminService } from '../admin/service/admin.service.js';
>>>>>>> origin/master

export class DealerService {
  /**
   * Submit Dealer Onboarding Application
   */
  static async submitApplication(data) {
    const cleanEmail = data.officialEmail.toLowerCase().trim();
    const cleanGstin = data.gstin.toUpperCase().trim();

<<<<<<< HEAD
    // 1. Check duplicate email in Users or Dealers
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this official email already exists on GROVE.');
    }

    const existingGstin = await Dealer.findOne({ gstin: cleanGstin });
    if (existingGstin) {
      throw ApiError.conflict('A dealership with this GSTIN is already registered.');
=======
    // 1. Check duplicate email in Dealers or Users
    const existingDealer = await Dealer.findOne({
      $or: [{ officialEmail: cleanEmail }, { gstin: cleanGstin }]
    });
    if (existingDealer) {
      if (existingDealer.officialEmail === cleanEmail) {
        throw ApiError.conflict('An account with this official email already exists on GROVE.');
      }
      if (existingDealer.gstin === cleanGstin) {
        throw ApiError.conflict('A dealership with this GSTIN is already registered.');
      }
    }

    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      if (existingUser.role === ROLES.DEALER) {
        await User.deleteOne({ _id: existingUser._id });
      } else {
        throw ApiError.conflict('An account with this official email already exists on GROVE.');
      }
>>>>>>> origin/master
    }

    // 2. Resolve Primary Category
    let category = null;
    if (data.primaryCategory.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(data.primaryCategory);
    } else {
      category = await Category.findOne({
        $or: [{ name: data.primaryCategory }, { slug: data.primaryCategory.toLowerCase().replace(/ & /g, '-').replace(/\s+/g, '-') }]
      });
    }

    if (!category) {
      throw ApiError.badRequest(`Selected primary category '${data.primaryCategory}' is invalid.`);
    }

    // 3. Generate sequential Dealer Code (e.g. DEALER_001)
    const count = await Dealer.countDocuments();
    const dealerCode = `DEALER_${String(count + 1).padStart(3, '0')}`;

<<<<<<< HEAD
    // 4. Create base user account (initially inactive / pending password setup)
    const initialPlaceholderPassword = generateSecurePassword(16);
    const user = new User({
      name: data.ownerName.trim(),
      email: cleanEmail,
      phone: data.phone.trim(),
      password: initialPlaceholderPassword,
      role: ROLES.DEALER,
      status: 'ACTIVE',
      mustChangePassword: true
    });
    await user.save();

    // 5. Create Dealer record
    const dealer = new Dealer({
      user: user._id,
=======
    // 4. Create autonomous Dealer record (No User record created)
    const initialPlaceholderPassword = generateSecurePassword(16);
    const dealer = new Dealer({
      password: initialPlaceholderPassword,
      mustChangePassword: true,
>>>>>>> origin/master
      dealerCode,
      businessName: data.businessName.trim(),
      businessType: data.businessType,
      primaryCategory: category._id,
      primaryCategoryName: category.name,
      ownerName: data.ownerName.trim(),
      officialEmail: cleanEmail,
      phone: data.phone.trim(),
      gstin: cleanGstin,
      pan: (data.pan || '').toUpperCase().trim(),
      businessAddress: data.businessAddress,
      warehouseAddress: data.warehouseAddress.trim(),
      location: {
        type: 'Point',
        coordinates: [data.coordinates?.lng || 73.8567, data.coordinates?.lat || 18.5204]
      },
      status: DEALER_STATUS.PENDING,
      storeSettings: {
        description: data.businessDescription || '',
        tagline: `${category.name} Certified Dealer`,
        operatingHours: 'Mon - Sat: 08:30 AM - 07:30 PM',
        isOpen: true,
        fulfillmentSLA: 99.0
      },
      kycDocuments: [
        { name: 'GSTIN Registration Certificate', url: 'https://docs.grove.com/sample-gstin.pdf', status: 'Under Review' },
        { name: 'Bank Cancelled Cheque', url: 'https://docs.grove.com/sample-cheque.pdf', status: 'Under Review' }
      ]
    });

    await dealer.save();

<<<<<<< HEAD
=======
    // Trigger Admin Notification for the Bell Icon
    await NotificationService.createNotification({
      sourceType: 'DEALER',
      sourceId: dealer._id,
      sourceName: dealer.businessName,
      category: 'DEALER_ONBOARDING',
      priority: 'NORMAL',
      title: 'New Dealer Application Submitted',
      message: `${dealer.businessName} (${dealer.ownerName}) applied under ${dealer.primaryCategoryName}.`,
      entityType: 'dealer',
      entityId: dealer._id.toString(),
      actionUrl: '/admin/dealers',
      metadata: { gstin: dealer.gstin, phone: dealer.phone }
    });

>>>>>>> origin/master
    return {
      dealerCode: dealer.dealerCode,
      businessName: dealer.businessName,
      officialEmail: dealer.officialEmail,
      primaryCategory: dealer.primaryCategoryName,
      status: dealer.status,
      message: 'Dealership application submitted successfully. GROVE Operations will review your credentials.'
    };
  }

  /**
   * Super Admin Approves Dealer Application
   * Generates 12-char single-use temp password, emails dealer, and activates account.
   */
  static async approveDealer(dealerId, adminUser, options = {}) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

    if (dealer.status === DEALER_STATUS.APPROVED) {
      throw ApiError.badRequest('Dealer application is already approved.');
    }

    // 1. Generate 12-character secure temporary password
    const temporaryPassword = generateSecurePassword(12);
    const tempHash = await hashPassword(temporaryPassword);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // exactly 24 hours

    // 2. Dispatch credentials via Nodemailer
    try {
<<<<<<< HEAD
      await sendDealerApprovalEmail({
=======
     console.log(`📨 [DEALER APPROVAL] Sending email to: ${dealer.officialEmail}`);
      const mailRes = await sendDealerApprovalEmail({
>>>>>>> origin/master
        to: dealer.officialEmail,
        ownerName: dealer.ownerName,
        businessName: dealer.businessName,
        temporaryPassword,
        expiryHours: 24
      });
<<<<<<< HEAD
    } catch (emailErr) {
      console.warn(`Email dispatch notice during dealer approval: ${emailErr.message}`);
    }

    // 3. Update dealer record with hashed temporary password
    dealer.status = DEALER_STATUS.APPROVED;
    dealer.commissionRate = options.commissionRate ?? dealer.commissionRate;
    dealer.tier = options.tier ?? dealer.tier;
    dealer.payoutHold = false;
=======
      console.log(`✅ [DEALER APPROVAL] Email successfully sent:`, mailRes);
    } catch (emailErr) {
      console.error(`❌ [DEALER APPROVAL] Email delivery failed:`, emailErr.message);
    }

    // 3. Update dealer record with hashed temporary password and transition to PENDING_KYC
    dealer.status = DEALER_STATUS.PENDING_KYC;
    dealer.bankVerificationStatus = 'PENDING';
    dealer.rejectionReason = '';
    dealer.commissionRate = options.commissionRate ?? dealer.commissionRate;
    dealer.tier = options.tier ?? dealer.tier;
    dealer.payoutHold = false;
    dealer.password = temporaryPassword; // hashed automatically by dealerSchema pre-save
    dealer.mustChangePassword = true;
>>>>>>> origin/master
    dealer.temporaryPassword = {
      hash: tempHash,
      expiresAt,
      isUsed: false,
      mustChange: true
    };

<<<<<<< HEAD
    dealer.kycDocuments = dealer.kycDocuments.map((doc) => ({
      ...doc.toObject(),
      status: 'Verified'
    }));

=======
>>>>>>> origin/master
    dealer.approvalHistory.push({
      action: 'APPROVED',
      actionBy: adminUser.id,
      timestamp: new Date(),
<<<<<<< HEAD
      reason: options.notes || 'KYC verified and approved by Super Admin'
=======
      reason: options.notes || 'Dealer application accepted; credentials issued for KYC & bank verification'
>>>>>>> origin/master
    });

    await dealer.save();

<<<<<<< HEAD
    // 4. Update linked User record password to the temporary password
    const user = await User.findById(dealer.user);
    if (user) {
      user.password = temporaryPassword; // will be hashed by userSchema pre-save
      user.mustChangePassword = true;
      user.status = 'ACTIVE';
      await user.save();
=======
    await AdminService.recordAuditLog({
      action: 'DEALER_APPROVED', actor: adminUser.id, actorRole: adminUser.role,
      targetEntity: 'Dealer', targetId: dealer._id.toString(),
      details: `Dealer application approved for ${dealer.businessName}.`,
      ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
    });

    // 4. Mark pending admin notification as read
    try {
      await AdminNotification.updateMany(
        { entityId: dealer._id.toString(), category: 'DEALER_ONBOARDING', isRead: false },
        { isRead: true, readAt: new Date() }
      );
    } catch (e) {
      console.warn('Failed to resolve dealer notification:', e.message);
>>>>>>> origin/master
    }

    return {
      message: `Dealer '${dealer.businessName}' successfully approved. Credentials dispatched to ${dealer.officialEmail}.`,
      dealer: {
        id: dealer._id,
        dealerCode: dealer.dealerCode,
        businessName: dealer.businessName,
        officialEmail: dealer.officialEmail,
        status: dealer.status,
        primaryCategoryName: dealer.primaryCategoryName,
        temporaryPasswordExpiry: expiresAt
      }
    };
  }

  /**
   * Super Admin Rejects Dealer Application
   */
<<<<<<< HEAD
  static async rejectDealer(dealerId, adminUser, reason) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

    dealer.status = DEALER_STATUS.REJECTED;
    dealer.approvalHistory.push({
      action: 'REJECTED',
      actionBy: adminUser.id,
      timestamp: new Date(),
      reason
    });

    await dealer.save();

    // Send rejection email
    try {
      await sendDealerRejectionEmail({
        to: dealer.officialEmail,
        ownerName: dealer.ownerName,
        businessName: dealer.businessName,
        reason
      });
    } catch (e) {
      console.warn('Rejection email delivery warning:', e.message);
    }

    return { message: `Dealer application for '${dealer.businessName}' rejected.` };
  }

=======
 
static async rejectDealer(dealerId, adminUser, reason) {
  const dealer = await Dealer.findById(dealerId);

  if (!dealer) {
    throw ApiError.notFound('Dealer not found.');
  }

  if (!reason || typeof reason !== 'string' || reason.trim().length < 5) {
    throw ApiError.badRequest('Rejection reason is required (minimum 5 characters).');
  }

  const cleanReason = reason.trim();

  // 1. Check status BEFORE changing it
  if (dealer.status === DEALER_STATUS.REJECTED) {
    throw ApiError.badRequest(
      'This dealer application has already been rejected.'
    );
  }

  if (dealer.status === DEALER_STATUS.APPROVED) {
    throw ApiError.badRequest(
      'An approved dealer cannot be rejected through this action.'
    );
  }

  // 2. Update dealer status and store rejection reason
  dealer.status = DEALER_STATUS.REJECTED;
  dealer.rejectionReason = cleanReason;

  dealer.approvalHistory.push({
    action: 'REJECTED',
    actionBy: adminUser.id,
    timestamp: new Date(),
    reason: cleanReason
  });

  await dealer.save();

  await AdminService.recordAuditLog({
    action: 'DEALER_REJECTED', actor: adminUser.id, actorRole: adminUser.role,
    targetEntity: 'Dealer', targetId: dealer._id.toString(),
    details: `Dealer application rejected. Reason: ${cleanReason}`,
    ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
  });

  // 3. Resolve admin notification
  try {
    await AdminNotification.updateMany(
      {
        entityId: dealer._id.toString(),
        category: 'DEALER_ONBOARDING',
        isRead: false
      },
      {
        isRead: true,
        readAt: new Date()
      }
    );
  } catch (error) {
    console.warn(
      'Failed to resolve dealer notification:',
      error.message
    );
  }

  // 4. Send rejection email
  let emailSent = false;

  try {
    const emailResult = await sendDealerRejectionEmail({
      to: dealer.officialEmail,
      ownerName: dealer.ownerName,
      businessName: dealer.businessName,
      reason
    });

    emailSent = emailResult.success === true;

    if (emailSent) {
      console.log('✅ Rejection email accepted by SMTP');
    } else {
      console.error('❌ Rejection email failed:', emailResult);
    }

  } catch (error) {
    console.error('❌ Rejection email error:', error.message);
  }

  // 5. Return result
  return {
    message: `Dealer application for '${dealer.businessName}' rejected.`,
    emailSent
  };
}


>>>>>>> origin/master
  /**
   * Suspend or Reactivate Dealer
   */
  static async toggleStatus(dealerId, adminUser, newStatus, reason = '') {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

    dealer.status = newStatus;
    dealer.approvalHistory.push({
      action: newStatus === DEALER_STATUS.SUSPENDED ? 'SUSPENDED' : 'REACTIVATED',
      actionBy: adminUser.id,
      timestamp: new Date(),
      reason
    });

    await dealer.save();

<<<<<<< HEAD
    // Also update linked user status
    await User.findByIdAndUpdate(dealer.user, {
      status: newStatus === DEALER_STATUS.SUSPENDED ? 'SUSPENDED' : 'ACTIVE'
=======
    await AdminService.recordAuditLog({
      action: 'DEALER_STATUS_CHANGED', actor: adminUser.id, actorRole: adminUser.role,
      targetEntity: 'Dealer', targetId: dealer._id.toString(),
      details: `Dealer status changed to ${newStatus}. Reason: ${reason || 'Not provided'}`,
      ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
>>>>>>> origin/master
    });

    return { message: `Dealer status changed to ${newStatus}.`, dealer };
  }

  /**
   * Dealer Updates Store Settings
<<<<<<< HEAD
   * Server strictly prevents modification of businessName, gstin, primaryCategory, warehouseAddress.
=======
   * Allows updating store name, warehouse address & hub, store description, tagline, and operating hours.
   * Strictly prevents modification of gstin, officialEmail, phone, and primaryCategory.
>>>>>>> origin/master
   */
  static async updateStoreSettings(dealerId, settingsData) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

<<<<<<< HEAD
    // Only allow updating safe fields
=======
    if (settingsData.businessName !== undefined) {
      dealer.businessName = settingsData.businessName.trim();
    }
    if (settingsData.warehouseAddress !== undefined) {
      dealer.warehouseAddress = settingsData.warehouseAddress.trim();
    }
    if (settingsData.city !== undefined || settingsData.state !== undefined || settingsData.pincode !== undefined) {
      if (!dealer.businessAddress) {
        dealer.businessAddress = {};
      }
      if (settingsData.city !== undefined) dealer.businessAddress.city = settingsData.city.trim();
      if (settingsData.state !== undefined) dealer.businessAddress.state = settingsData.state.trim();
      if (settingsData.pincode !== undefined) dealer.businessAddress.pincode = settingsData.pincode.trim();
    }
    if (settingsData.businessAddress) {
      if (!dealer.businessAddress) dealer.businessAddress = {};
      if (settingsData.businessAddress.address) dealer.businessAddress.address = settingsData.businessAddress.address.trim();
      if (settingsData.businessAddress.city) dealer.businessAddress.city = settingsData.businessAddress.city.trim();
      if (settingsData.businessAddress.state) dealer.businessAddress.state = settingsData.businessAddress.state.trim();
      if (settingsData.businessAddress.pincode) dealer.businessAddress.pincode = settingsData.businessAddress.pincode.trim();
    }

    if (!dealer.storeSettings) dealer.storeSettings = {};
>>>>>>> origin/master
    if (settingsData.tagline !== undefined) dealer.storeSettings.tagline = settingsData.tagline;
    if (settingsData.description !== undefined) dealer.storeSettings.description = settingsData.description;
    if (settingsData.operatingHours !== undefined) dealer.storeSettings.operatingHours = settingsData.operatingHours;
    if (settingsData.isOpen !== undefined) dealer.storeSettings.isOpen = settingsData.isOpen;

    await dealer.save();

    return {
      message: 'Store settings updated successfully.',
<<<<<<< HEAD
=======
      dealer: {
        id: dealer._id,
        businessName: dealer.businessName,
        warehouseAddress: dealer.warehouseAddress,
        businessAddress: dealer.businessAddress,
        storeSettings: dealer.storeSettings,
        bankVerificationStatus: dealer.bankVerificationStatus
      },
>>>>>>> origin/master
      storeSettings: dealer.storeSettings
    };
  }

  /**
<<<<<<< HEAD
=======
   * Newly Approved Dealer Verifies Bank Settlement Details
   * Validates IFSC and account number, marks status as VERIFIED, and locks bank details.
   */
  static async verifyBankDetails(dealerId, bankData) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

    if (dealer.bankVerificationStatus === 'VERIFIED') {
      throw ApiError.badRequest('Settlement bank details are already verified and locked. Contact GROVE Admin to request modifications.');
    }

    dealer.bankDetails = {
      bankName: bankData.bankName.trim(),
      accountName: bankData.accountName.trim(),
      accountNumber: bankData.accountNumber.trim(),
      ifsc: bankData.ifsc.toUpperCase().trim(),
      upiId: (bankData.upiId || '').trim()
    };
    dealer.bankVerificationStatus = 'VERIFIED';
    dealer.bankVerifiedAt = new Date();

    dealer.approvalHistory.push({
      action: 'DETAILS_UPDATED',
      timestamp: new Date(),
      reason: 'Settlement bank details verified and locked by dealer'
    });

    await dealer.save();

    return {
      message: 'Settlement bank details successfully verified and locked.',
      bankDetails: dealer.bankDetails,
      bankVerificationStatus: dealer.bankVerificationStatus,
      bankVerifiedAt: dealer.bankVerifiedAt
    };
  }

  /**
   * Submit Dealer Settlement Bank Details During Onboarding Wizard
   */
  static async submitOnboardingBankDetails(dealerId, bankData) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

    dealer.bankDetails = {
      bankName: bankData.bankName.trim(),
      accountName: bankData.accountName.trim(),
      accountNumber: bankData.accountNumber.trim(),
      ifsc: bankData.ifsc.toUpperCase().trim(),
      upiId: (bankData.upiId || '').trim()
    };
    dealer.bankVerificationStatus = 'SUBMITTED';

    dealer.approvalHistory.push({
      action: 'DETAILS_UPDATED',
      timestamp: new Date(),
      reason: 'Settlement bank details submitted during onboarding wizard'
    });

    await dealer.save();

    return {
      message: 'Settlement bank details recorded successfully.',
      bankDetails: dealer.bankDetails,
      bankVerificationStatus: dealer.bankVerificationStatus
    };
  }

  /**
   * Admin Verifies Dealer KYC & Settlement Bank Account
   * Transitions status from PENDING_KYC to APPROVED and bankVerificationStatus to VERIFIED.
   */
  static async verifyKyc(dealerId, adminUser, options = {}) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

    if (dealer.status === DEALER_STATUS.APPROVED && dealer.bankVerificationStatus === 'VERIFIED') {
      throw ApiError.badRequest('Dealer KYC and settlement account are already approved and verified.');
    }

    dealer.status = DEALER_STATUS.APPROVED;
    dealer.bankVerificationStatus = 'VERIFIED';
    dealer.bankVerifiedAt = new Date();
    dealer.rejectionReason = '';

    dealer.kycDocuments = dealer.kycDocuments.map((doc) => ({
      ...doc.toObject(),
      status: 'Verified'
    }));

    dealer.approvalHistory.push({
      action: 'APPROVED',
      actionBy: adminUser.id,
      timestamp: new Date(),
      reason: options.notes || 'Dealer KYC documents and bank settlement account approved by Super Admin'
    });

    await dealer.save();

    await AdminService.recordAuditLog({
      action: 'DEALER_KYC_VERIFIED', actor: adminUser.id, actorRole: adminUser.role,
      targetEntity: 'Dealer', targetId: dealer._id.toString(),
      details: `Dealer KYC and bank details verified and approved for ${dealer.businessName}.`,
      ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
    });

    return {
      message: `Dealer KYC and settlement bank verified successfully. ${dealer.businessName} is now a Verified Dealer.`,
      dealer
    };
  }

  static async updateAdminDealerDetails(dealerId, data, adminUser) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) throw ApiError.notFound('Dealer not found.');
    const before = {
      businessName: dealer.businessName, ownerName: dealer.ownerName, primaryCategory: dealer.primaryCategoryName,
      officialEmail: dealer.officialEmail, gstin: dealer.gstin, phone: dealer.phone,
      warehouseAddress: dealer.warehouseAddress, businessAddress: dealer.businessAddress?.toObject?.() || dealer.businessAddress
    };
    let category = null;
    if (data.primaryCategory) {
      category = /^[0-9a-fA-F]{24}$/.test(data.primaryCategory)
        ? await Category.findById(data.primaryCategory)
        : await Category.findOne({ name: data.primaryCategory });
      if (!category) throw ApiError.badRequest('Selected primary category does not exist.');
      dealer.primaryCategory = category._id;
      dealer.primaryCategoryName = category.name;
    }
    const normalizedEmail = data.officialEmail?.toLowerCase();
    if (normalizedEmail && normalizedEmail !== dealer.officialEmail) {
      const duplicateDealer = await Dealer.findOne({ officialEmail: normalizedEmail, _id: { $ne: dealer._id } });
      const duplicateUser = await User.findOne({ email: normalizedEmail });
      if (duplicateDealer || duplicateUser) throw ApiError.conflict('That email is already used by another account.');
      dealer.officialEmail = normalizedEmail;
    }
    if (data.gstin && data.gstin !== dealer.gstin) {
      const duplicate = await Dealer.findOne({ gstin: data.gstin, _id: { $ne: dealer._id } });
      if (duplicate) throw ApiError.conflict('That GSTIN is already registered.');
      dealer.gstin = data.gstin;
    }
    if (data.businessName !== undefined) dealer.businessName = data.businessName;
    if (data.ownerName !== undefined) dealer.ownerName = data.ownerName;
    if (data.phone !== undefined) dealer.phone = data.phone;
    if (data.warehouseAddress !== undefined) dealer.warehouseAddress = data.warehouseAddress;
    if (data.commissionRate !== undefined) dealer.commissionRate = data.commissionRate;
    for (const key of ['city', 'state', 'pincode']) {
      if (data[key] !== undefined) dealer.businessAddress[key] = data[key];
    }
    dealer.approvalHistory.push({ action: 'DETAILS_UPDATED', actionBy: adminUser.id, reason: 'Dealer details edited by Super Admin' });
    await dealer.save();
    await AdminService.recordAuditLog({
      action: 'DEALER_DETAILS_UPDATED', actor: adminUser.id, actorRole: adminUser.role,
      targetEntity: 'Dealer', targetId: dealer._id.toString(),
      details: `Dealer details updated. Before: ${JSON.stringify(before)}; after: ${JSON.stringify(data)}`,
      ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
    });
    return dealer;
  }

  static async resetDealerCredentials(dealerId, adminUser) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) throw ApiError.notFound('Dealer not found.');
    const temporaryPassword = generateSecurePassword(12);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    dealer.password = temporaryPassword;
    dealer.mustChangePassword = true;
    dealer.temporaryPassword = { hash: await hashPassword(temporaryPassword), expiresAt, isUsed: false, mustChange: true };
    dealer.approvalHistory.push({ action: 'CREDENTIALS_RESET', actionBy: adminUser.id, reason: 'Credentials reset by Super Admin' });
    await dealer.save();
    let emailSent = false;
    try {
      const result = await sendDealerApprovalEmail({
        to: dealer.officialEmail, ownerName: dealer.ownerName, businessName: dealer.businessName,
        temporaryPassword, expiryHours: 24
      });
      emailSent = result?.success !== false;
    } catch (error) {
      console.error('Dealer credential reset email failed:', error.message);
    }
    await AdminService.recordAuditLog({
      action: 'DEALER_CREDENTIALS_RESET', actor: adminUser.id, actorRole: adminUser.role,
      targetEntity: 'Dealer', targetId: dealer._id.toString(),
      details: `Dealer login credentials reset; notification ${emailSent ? 'sent' : 'failed'}.`,
      ipAddress: adminUser.ipAddress || '', userAgent: adminUser.userAgent || ''
    });
    return { message: emailSent ? 'Temporary credentials sent to the dealer email.' : 'Credentials reset, but email delivery failed. Re-send after checking email configuration.' };
  }

  /**
>>>>>>> origin/master
   * Get Dealer Profile
   */
  static async getProfile(dealerId) {
    const dealer = await Dealer.findById(dealerId).populate('primaryCategory', 'name slug commissionRate');
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }
    return dealer;
  }

  /**
   * Get All Dealers (Admin)
   */
  static async getAllDealers(filters = {}, pagination = {}) {
    const query = {};
    if (filters.status) query.status = filters.status;
    if (filters.category) query.primaryCategory = filters.category;
    if (filters.search) {
      query.$or = [
        { businessName: { $regex: filters.search, $options: 'i' } },
        { dealerCode: { $regex: filters.search, $options: 'i' } },
        { officialEmail: { $regex: filters.search, $options: 'i' } }
      ];
    }

    const page = parseInt(pagination.page, 10) || 1;
    const limit = parseInt(pagination.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const [dealers, total] = await Promise.all([
      Dealer.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Dealer.countDocuments(query)
    ]);

    return {
      dealers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }
<<<<<<< HEAD
=======

  // Public directory response: deliberately excludes contact, KYC, bank, and approval data.
  static async getPublicDealers({ page = 1, limit = 20 } = {}) {
    page = Math.max(1, Number.parseInt(page, 10) || 1);
    limit = Math.min(100, Math.max(1, Number.parseInt(limit, 10) || 20));
    const query = { status: DEALER_STATUS.APPROVED };
    const [dealers, total] = await Promise.all([
      Dealer.find(query)
        .select('businessName dealerCode primaryCategory primaryCategoryName location storeSettings.tagline storeSettings.description storeSettings.operatingHours storeSettings.isOpen')
        .populate('primaryCategory', 'name slug')
        .sort({ businessName: 1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Dealer.countDocuments(query)
    ]);
    return { dealers, pagination: { page, limit, total, pages: Math.ceil(total / limit) } };
  }
>>>>>>> origin/master
}

