import { User } from './user.model.js';
import { ApiError } from '../../utils/ApiError.js';
import { ROLES } from '../../constants/roles.js';

export class UserService {
  /**
   * Super Admin List Registered Customers
   */
  static async getAllUsers({ search = '', role = '', page = 1, limit = 20 }) {
    const query = {};
    if (role) {
      query.role = role;
    } else {
      query.role = ROLES.USER; // Default to customers
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(query)
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get User by ID
   */
  static async getUserById(userId) {
    const user = await User.findById(userId).lean();
    if (!user) throw ApiError.notFound('User not found.');
    return user;
  }

  /**
   * Super Admin Delete User
   */
  static async deleteUser(userId) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found.');

    if (user.role === ROLES.SUPER_ADMIN) {
      throw ApiError.forbidden('The Super Admin account cannot be deleted.');
    }

    await User.findByIdAndDelete(userId);
    return { message: `User account '${user.name}' (${user.email}) deleted successfully.` };
  }

  /**
   * Customer Update Profile
   */
  static async updateProfile(userId, updateData) {
    const user = await User.findById(userId);
    if (!user) throw ApiError.notFound('User not found.');

    if (updateData.name) user.name = updateData.name.trim();
    if (updateData.phone !== undefined) user.phone = updateData.phone.trim();
    if (updateData.avatar !== undefined) user.avatar = updateData.avatar;

    await user.save();
    return user;
  }
}

