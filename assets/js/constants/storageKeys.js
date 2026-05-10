window.getCartKey = function(storeId) {

  return `lumora_cart_${storeId}`;
};

window.getOrderKey = function(storeId) {

  return `lumora_orders_${storeId}`;
};

window.STORAGE_KEYS = {

  CUSTOMER_STORE:
    'lumora_selected_store',

  CUSTOMER_SESSION:
    'lumora_customer_session',

  ADMIN_SESSION:
    'lumora_admin_session'
};
