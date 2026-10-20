import { postJSON } from "./api";

export function createOrder(payload) {
  return postJSON("/orders/", payload);
}