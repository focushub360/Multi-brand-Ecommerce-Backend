import { PaymentService } from './payment.service.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { asyncHandler } from '../../utils/asyncHandler.js';

export const getPayments = asyncHandler(async (req, res) => {
  const result = await PaymentService.getPayments(req.query);
  return res.status(200).json(
    ApiResponse.success(
      {
        payments: result.payments,
        summary: result.summary
      },
      'Payments retrieved successfully',
      200,
      result.pagination
    )
  );
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await PaymentService.getPaymentById(req.params.id);
  return res.status(200).json(ApiResponse.success(payment, 'Payment transaction details retrieved'));
});

