export const ORDER_STATUS = Object.freeze({
  PLACED: 'Placed',
  CONFIRMED: 'Confirmed',
  PROCESSING: 'Processing',
  PACKED: 'Packed',
  SHIPPED: 'Shipped',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled'
});

export const ALL_ORDER_STATUSES = Object.freeze(Object.values(ORDER_STATUS));

