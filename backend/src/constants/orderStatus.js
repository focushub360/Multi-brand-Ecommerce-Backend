export const ORDER_STATUS = Object.freeze({
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
});

export const ALL_ORDER_STATUSES = Object.freeze(Object.values(ORDER_STATUS));

