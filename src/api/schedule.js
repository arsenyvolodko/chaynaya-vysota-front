import { SCHEDULE_MOCK } from "../data/scheduleMock.js";

// TODO: заменить на реальный эндпоинт бэкенда, когда появится (текущая
// модель Tasting не хранит цену/фото/свободные места). Асинхронная форма
// сохранена намеренно, чтобы страница уже была готова к переключению.
export async function getTastingSchedule() {
  return SCHEDULE_MOCK;
}
