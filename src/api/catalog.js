import { api } from "./client";

export async function getTasting(id) {
  const { data } = await api.get(`/api/catalog/tastings/${id}/`);
  return data;
}

export async function getTastingProducts(id) {
  const { data } = await api.get(`/api/catalog/tastings/${id}/products/`);
  return data;
}

export async function getTastingProduct(id, productId) {
  const { data } = await api.get(`/api/catalog/tastings/${id}/products/${productId}/`);
  return data;
}

export async function joinTasting(id) {
  const { data } = await api.post(`/api/catalog/tastings/${id}/join/`);
  return data;
}

export async function getMyTastings() {
  const { data } = await api.get(`/api/catalog/tastings/my/`);
  return data;
}

export async function reviewProduct(productId, body) {
  const { data } = await api.post(`/api/catalog/products/${productId}/review/`, body);
  return data;
}

export async function nominate(tastingId, productId, isNominated) {
  const { data } = await api.post(
    `/api/catalog/tastings/${tastingId}/products/${productId}/nominate/`,
    { is_nominated: isNominated }
  );
  return data;
}

export async function setPodium(tastingId, { first, second, third } = {}) {
  const body = {};
  if (first !== undefined) body.first = first;
  if (second !== undefined) body.second = second;
  if (third !== undefined) body.third = third;
  const { data } = await api.patch(`/api/catalog/tastings/${tastingId}/podium/`, body);
  return data;
}

export async function getResult(tastingId) {
  const { data } = await api.get(`/api/catalog/tastings/${tastingId}/result/`);
  return data;
}
