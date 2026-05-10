window.ORDER_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled'
};

window.ORDER_STATUS_LIST = [
  window.ORDER_STATUS.PENDING,
  window.ORDER_STATUS.PROCESSING,
  window.ORDER_STATUS.SHIPPED,
  window.ORDER_STATUS.COMPLETED,
  window.ORDER_STATUS.CANCELLED
];

window.ORDER_STATUS_LABELS = {
  [window.ORDER_STATUS.PENDING]: 'Menunggu',
  [window.ORDER_STATUS.PROCESSING]: 'Diproses',
  [window.ORDER_STATUS.SHIPPED]: 'Dikirim',
  [window.ORDER_STATUS.COMPLETED]: 'Selesai',
  [window.ORDER_STATUS.CANCELLED]: 'Dibatalkan'
};

window.ORDER_STATUS_FLOW = {
  [window.ORDER_STATUS.PENDING]:
    window.ORDER_STATUS.PROCESSING,

  [window.ORDER_STATUS.PROCESSING]:
    window.ORDER_STATUS.SHIPPED,

  [window.ORDER_STATUS.SHIPPED]:
    window.ORDER_STATUS.COMPLETED
};
