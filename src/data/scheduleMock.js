// Мок-данные расписания дегустаций. Бэкенд пока не отдаёт этот список
// (модель Tasting не хранит цену/фото/число записавшихся) — используем
// заглушку в форме, максимально близкой к будущему ответу API, чтобы
// страницу было легко переключить на реальный эндпоинт позже.
// guests_count — сколько гостей уже записалось (набор по принципу чартера,
// см. src/utils/tastingCapacity.js).

function daysFromNow(days, hours = 15, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export const SCHEDULE_MOCK = [
  {
    id: "sch-1",
    title: "Улуны высокогорного Тайваня",
    date: daysFromNow(3, 18, 30),
    price_from: 1900,
    description:
      "Пять улунов с плантаций на высоте от 1200 метров — от лёгких цветочных до тяжёлых печёных. Разберём, как высота и обжарка меняют вкус.",
    guests_count: 9,
    tags: ["tea"],
    cover: "tea",
  },
  {
    id: "sch-2",
    title: "Мороженое ручной работы: осенняя линейка",
    date: daysFromNow(6, 19, 0),
    price_from: 1400,
    description:
      "Пробуем новые вкусы сезона — тыква с кардамоном, груша-розмарин и классический пломбир. С разбором текстуры и баланса сладости.",
    guests_count: 23,
    tags: ["ice_cream"],
    cover: "ice_cream",
  },
  {
    id: "sch-3",
    title: "Чай и мороженое: неожиданные пары",
    date: daysFromNow(9, 17, 0),
    price_from: 2200,
    description:
      "Смешанная дегустация: подбираем чайные пары к мороженому и смотрим, как вкусы усиливают друг друга.",
    guests_count: 17,
    tags: ["tea", "ice_cream"],
    cover: "tea",
  },
  {
    id: "sch-4",
    title: "Пуэры: молодые и выдержанные",
    date: daysFromNow(24, 18, 0),
    price_from: 2100,
    description:
      "Сравниваем шен и шу разных лет — от свежих прессовок до пуэров с десятилетней выдержкой.",
    guests_count: 6,
    tags: ["tea"],
    cover: "tea",
  },
  {
    id: "sch-5",
    title: "Ремесленное мороженое: базовый курс",
    date: daysFromNow(41, 16, 0),
    price_from: 1600,
    description: "Вводная дегустация для тех, кто только знакомится с крафтовым мороженым.",
    guests_count: 12,
    tags: ["ice_cream"],
    cover: "ice_cream",
  },
  {
    id: "sch-6",
    title: "Красные чаи провинции Юньнань",
    date: daysFromNow(68, 18, 30),
    price_from: 1800,
    description: "От медовых до солодовых — путешествие по стилям юньнаньского красного чая.",
    guests_count: 15,
    tags: ["tea"],
    cover: "tea",
  },
  // Прошедшие
  {
    id: "sch-7",
    title: "Белые чаи нового урожая",
    date: daysFromNow(-6, 18, 0),
    price_from: 1700,
    description: "Разбирали белый чай этого сезона — от Бай Хао Иньчжэнь до Шоу Мэй.",
    guests_count: 23,
    tags: ["tea"],
    cover: "tea",
  },
  {
    id: "sch-8",
    title: "Мороженое и чай: летний сезон",
    date: daysFromNow(-19, 19, 0),
    price_from: 2000,
    description: "Летняя серия сочетаний холодного чая и мороженого.",
    guests_count: 20,
    tags: ["tea", "ice_cream"],
    cover: "ice_cream",
  },
  {
    id: "sch-9",
    title: "Зелёные чаи Китая",
    date: daysFromNow(-33, 17, 30),
    price_from: 1500,
    description: "Лунцзин, Билочунь и другие — знакомство с классикой зелёного чая.",
    guests_count: 23,
    tags: ["tea"],
    cover: "tea",
  },
  {
    id: "sch-10",
    title: "Сорбеты против пломбиров",
    date: daysFromNow(-58, 16, 0),
    price_from: 1300,
    description: "Сравнивали фруктовые сорбеты и классические пломбиры по текстуре и вкусу.",
    guests_count: 10,
    tags: ["ice_cream"],
    cover: "ice_cream",
  },
];
