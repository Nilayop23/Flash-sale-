import { apiRequest, postJSON } from "./api";

export function getFlashSales() {
  return apiRequest("/flash-sales/");
}

export function getFlashSale(saleId) {
  return apiRequest(`/flash-sales/${saleId}`);
}

export function createFlashSale(payload) {
  return postJSON("/flash-sales/", payload);
}