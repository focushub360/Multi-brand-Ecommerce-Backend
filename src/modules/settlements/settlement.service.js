import { Settlement } from './settlement.model.js';

export class SettlementService {
  /**
   * Super Admin Get All Settlements
   */
  static async getSettlements({ status = '', dealerId = '', page = 1, limit = 20 }) {
    const query = {};
    if (status) query.status = status;
    if (dealerId) query.dealer = dealerId;

    const skip = (page - 1) * limit;

    const [settlements, total] = await Promise.all([
      Settlement.find(query).populate('dealer', 'businessName dealerCode bankDetails').sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Settlement.countDocuments(query)
    ]);

    return {
      settlements,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Dealer Get Own Payout Settlements
   */
  static async getDealerSettlements(dealerId) {
    return await Settlement.find({ dealer: dealerId }).sort({ createdAt: -1 }).lean();
  }

}

