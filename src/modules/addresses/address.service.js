import { Address } from './address.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class AddressService {
  /**
   * Get User Saved Addresses
   */
  static async getUserAddresses(userId) {
    return await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 }).lean();
  }

  /**
   * Add New Delivery Address (Enforcing 5-Address Limit)
   */
  static async addAddress(userId, data) {
    const existingCount = await Address.countDocuments({ user: userId });
    if (existingCount >= 5) {
      throw ApiError.badRequest('Address limit reached: You can save a maximum of 5 delivery addresses.');
    }

    // If marked default or this is the first address, clear existing defaults
    const shouldBeDefault = data.isDefault || existingCount === 0;
    if (shouldBeDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const address = new Address({
      user: userId,
      name: data.name.trim(),
      mobile: data.mobile.trim(),
      pincode: data.pincode.trim(),
      house: data.house.trim(),
      street: data.street.trim(),
      landmark: data.landmark || '',
      city: data.city.trim(),
      state: data.state.trim(),
      type: data.type || 'Home',
      isDefault: shouldBeDefault,
      coordinates: data.coordinates || {}
    });

    await address.save();
    return address;
  }

  /**
   * Update Delivery Address
   */
  static async updateAddress(userId, addressId, updateData) {
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) throw ApiError.notFound('Address not found.');

    if (updateData.isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
      address.isDefault = true;
    }

    if (updateData.name) address.name = updateData.name.trim();
    if (updateData.mobile) address.mobile = updateData.mobile.trim();
    if (updateData.pincode) address.pincode = updateData.pincode.trim();
    if (updateData.house) address.house = updateData.house.trim();
    if (updateData.street) address.street = updateData.street.trim();
    if (updateData.landmark !== undefined) address.landmark = updateData.landmark;
    if (updateData.city) address.city = updateData.city.trim();
    if (updateData.state) address.state = updateData.state.trim();
    if (updateData.type) address.type = updateData.type;
    if (updateData.coordinates) address.coordinates = updateData.coordinates;

    await address.save();
    return address;
  }

  /**
   * Delete Delivery Address
   */
  static async deleteAddress(userId, addressId) {
    const address = await Address.findOneAndDelete({ _id: addressId, user: userId });
    if (!address) throw ApiError.notFound('Address not found.');

    // If deleted address was default, promote next address to default if any exists
    if (address.isDefault) {
      const nextAddr = await Address.findOne({ user: userId }).sort({ createdAt: -1 });
      if (nextAddr) {
        nextAddr.isDefault = true;
        await nextAddr.save();
      }
    }

    return { message: 'Address removed successfully.' };
  }

  /**
   * Set Address as Default
   */
  static async setDefaultAddress(userId, addressId) {
    const address = await Address.findOne({ _id: addressId, user: userId });
    if (!address) throw ApiError.notFound('Address not found.');

    await Address.updateMany({ user: userId }, { isDefault: false });
    address.isDefault = true;
    await address.save();

    return address;
  }
}

