import { apiRequest, postJSON } from "./api";

export function getProducts() {
  return apiRequest("/products/");
}

export function createProduct(productData) {
  return postJSON("/products/", productData);
}