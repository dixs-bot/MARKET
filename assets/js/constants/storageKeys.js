export function getCartKey(storeId) {
  return `lumora_cart_${storeId}`;
}

export function getOrderKey(storeId) {
  return `lumora_orders_${storeId}`;
}

export const STORAGE_KEYS = {
  CUSTOMER_STORE: 'lumora_selected_store',
  CUSTOMER_SESSION: 'lumora_customer_session',
  ADMIN_SESSION: 'lumora_admin_session'
};