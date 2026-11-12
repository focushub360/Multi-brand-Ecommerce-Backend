import { Dealer } from './dealer.model.js';
import { User } from '../users/user.model.js';
import { Category } from '../categories/category.model.js';
import { DEALER_STATUS } from '../../constants/dealerStatus.js';
import { ROLES } from '../../constants/roles.js';
import { ApiError } from '../../utils/ApiError.js';
import { generateSecurePassword } from '../../utils/generatePassword.js';
import { hashPassword } from '../../utils/passwordHash.js';
import { sendDealerApprovalEmail, sendDealerRejectionEmail } from '../../utils/sendEmail.js';

export class DealerService {
  /**
   * Submit Dealer Onboarding Application
   */
  static async submitApplication(data) {
    const cleanEmail = data.officialEmail.toLowerCase().trim();
    const cleanGstin = data.gstin.toUpperCase().trim();

    // 1. Check duplicate email in Users or Dealers
    const existingUser = await User.findOne({ email: cleanEmail });
    if (existingUser) {
      throw ApiError.conflict('An account with this official email already exists on GROVE.');
    }

    const existingGstin = await Dealer.findOne({ gstin: cleanGstin });
    if (existingGstin) {
      throw ApiError.conflict('A dealership with this GSTIN is already registered.');
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
      await sendDealerApprovalEmail({
        to: dealer.officialEmail,
        ownerName: dealer.ownerName,
        businessName: dealer.businessName,
        temporaryPassword,
        expiryHours: 24
      });
    } catch (emailErr) {
      console.warn(`Email dispatch notice during dealer approval: ${emailErr.message}`);
    }

    // 3. Update dealer record with hashed temporary password
    dealer.status = DEALER_STATUS.APPROVED;
    dealer.commissionRate = options.commissionRate ?? dealer.commissionRate;
    dealer.tier = options.tier ?? dealer.tier;
    dealer.payoutHold = false;
    dealer.temporaryPassword = {
      hash: tempHash,
      expiresAt,
      isUsed: false,
      mustChange: true
    };

    dealer.kycDocuments = dealer.kycDocuments.map((doc) => ({
      ...doc.toObject(),
      status: 'Verified'
    }));

    dealer.approvalHistory.push({
      action: 'APPROVED',
      actionBy: adminUser.id,
      timestamp: new Date(),
      reason: options.notes || 'KYC verified and approved by Super Admin'
    });

    await dealer.save();

    // 4. Update linked User record password to the temporary password
    const user = await User.findById(dealer.user);
    if (user) {
      user.password = temporaryPassword; // will be hashed by userSchema pre-save
      user.mustChangePassword = true;
      user.status = 'ACTIVE';
      await user.save();
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

    // Also update linked user status
    await User.findByIdAndUpdate(dealer.user, {
      status: newStatus === DEALER_STATUS.SUSPENDED ? 'SUSPENDED' : 'ACTIVE'
    });

    return { message: `Dealer status changed to ${newStatus}.`, dealer };
  }

  /**
   * Dealer Updates Store Settings
   * Server strictly prevents modification of businessName, gstin, primaryCategory, warehouseAddress.
   */
  static async updateStoreSettings(dealerId, settingsData) {
    const dealer = await Dealer.findById(dealerId);
    if (!dealer) {
      throw ApiError.notFound('Dealer not found.');
    }

    // Only allow updating safe fields
    if (settingsData.tagline !== undefined) dealer.storeSettings.tagline = settingsData.tagline;
    if (settingsData.description !== undefined) dealer.storeSettings.description = settingsData.description;
    if (settingsData.operatingHours !== undefined) dealer.storeSettings.operatingHours = settingsData.operatingHours;
    if (settingsData.isOpen !== undefined) dealer.storeSettings.isOpen = settingsData.isOpen;

    await dealer.save();

    return {
      message: 'Store settings updated successfully.',
      storeSettings: dealer.storeSettings
    };
  }

  /**
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
}

