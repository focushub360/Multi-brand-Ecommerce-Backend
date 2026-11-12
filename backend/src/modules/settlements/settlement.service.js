import { Settlement } from './settlement.model.js';
import { DealerOrder } from '../orders/dealerOrder.model.js';
import { ApiError } from '../../utils/ApiError.js';

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

  /**
   * Super Admin Release Escrow Settlement to Dealer
   */
  static async releaseSettlement(settlementId, adminUser) {
    const settlement = await Settlement.findById(settlementId);
    if (!settlement) throw ApiError.notFound('Settlement record not found.');

    if (settlement.status === 'SETTLED') {
      throw ApiError.badRequest('Settlement payout has already been processed.');
    }

    settlement.status = 'SETTLED';
    settlement.bankRef = `BANK_REF_${Date.now()}`;
    settlement.settledAt = new Date();
    await settlement.save();

    // Mark associated suborders as Settled
    if (settlement.dealerOrders?.length) {
      await DealerOrder.updateMany(
        { _id: { $in: settlement.dealerOrders } },
        { payoutStatus: 'Settled' }
      );
    }

    return settlement;
  }
}

