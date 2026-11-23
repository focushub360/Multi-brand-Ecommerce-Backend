import { Payment } from './payment.model.js';
import { ApiError } from '../../utils/ApiError.js';

export class PaymentService {
  static async getPayments({ status = '', search = '', page = 1, limit = 20 }) {
    const query = {};
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { transactionId: { $regex: search, $options: 'i' } },
        { orderNumber: { $regex: search, $options: 'i' } },
        { customerName: { $regex: search, $options: 'i' } }
      ];
    }

    const skip = (page - 1) * limit;

    const [payments, total] = await Promise.all([
      Payment.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Payment.countDocuments(query)
    ]);

    // Financial volume metrics
    const all = await Payment.find().select('amount status escrowStatus').lean();
    const totalVolume = all.filter((p) => p.status === 'COMPLETED').reduce((acc, curr) => acc + curr.amount, 0);
    const escrowHeld = all.filter((p) => p.escrowStatus === 'Escrow Held').reduce((acc, curr) => acc + curr.amount, 0);

    return {
      payments,
      summary: {
        totalVolume,
        escrowHeld,
        settledToDealers: Math.max(0, totalVolume - escrowHeld),
        transactionsCount: all.length
      },
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  static async getPaymentById(id) {
    const payment = await Payment.findById(id).lean();
    if (!payment) throw ApiError.notFound('Payment transaction record not found.');
    return payment;
  }
}

