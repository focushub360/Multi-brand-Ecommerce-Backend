export const DEALER_STATUS = Object.freeze({
  PENDING: 'PENDING',
  PENDING_KYC: 'PENDING_KYC',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  SUSPENDED: 'SUSPENDED'
});

export const ALL_DEALER_STATUSES = Object.freeze(Object.values(DEALER_STATUS));

