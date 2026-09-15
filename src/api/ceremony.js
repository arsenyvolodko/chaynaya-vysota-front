import { CEREMONY_MOCK } from "../data/ceremonyMock.js";

// TODO: заменить на реальный эндпоинт, когда мастерские чаепития появятся в
// бэкенде (сейчас источник — карточки teatix.com/ceremony, вручную перенесены в мок).
export async function getCeremonies() {
  return CEREMONY_MOCK;
}
