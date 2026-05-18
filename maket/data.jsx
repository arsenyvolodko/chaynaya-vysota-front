// Ice cream tasting data. 13 items across 3 sets.
// Each item carries: number, line (concept), ingredients, full description,
// and an optional `secret` — the "Интересно будет знать о сорте" trivia.

const ICE_CREAMS = [
  // ── Сет 1. Пломбиры и желато на красных, зелёных и улунах ─────────
  {
    id: "persimmon-halva",
    block: 0,
    num: 34,
    title: "Солнечная хурма и подсолнечная халва",
    line: "Линия тёплой сладости",
    short: "Желато с хурмой, халвой и жареными семечками на зелёном чае",
    ingredients: ["Хурма", "Подсолнечная халва", "Жареные семечки", "Зелёный чай"],
    description:
      "Если повторять «хурма-халва, хурма-халва», становится слаще. А зелёный чай придаёт этой сладости ещё немного свежести.",
    secret:
      "Семечки обжариваются и пропитываются лёгким сиропом уже отдельно, а потом вмешиваются в мороженое — это идёт на пользу и вкусу, и хрустящей текстуре.",
    notes: ["#E8A055", "#F0CB89", "#C97A3A"],
    color: "#E8A055",
    tea: "зелёный",
    pairedTea: "Дянь Хун",
    format: "джелато",
    base: "Сливочное",
    type: "Десертный",
    phrase: "про солнечную сладость",
  },
  {
    id: "wild-berries-irga",
    block: 0,
    num: 59,
    title: "Дикие ягоды: ирга и кизил",
    line: "Линия дикого леса",
    short: "Желато из ирги и кизила с тархуном, можжевельником, перцем",
    ingredients: ["Ирга", "Кизил", "Тархун", "Лайм", "Можжевельник", "Малабарский перец"],
    description:
      "Лесной кизил с Кавказа и полудикая ирга из Карелии, можжевельник, тархун, ароматный малабарский перец, лайм.",
    secret:
      "И кизил, и ирга — «полудикие» ягоды: растут на опушках, в садах, но редко бывают по-настоящему окультурены и практически не выращиваются впрок. Куст кизила и дерево ирги предоставлены сами себе, и расчёта на богатый урожай нет.\nИрга обычно достаётся тем, кто раньше всех заметил её полную спелость и кому не лень дотянуться до веток — чаще всего птицам и детям. Немногие производители вообще заготавливают эту ягоду, а отделение кизиловой мякоти от косточки — отдельное развлечение.\nЧаще всего гости называют этот вкус «лесным» или «прогулочным» — в нём много воздуха, зелени и лёгкой хвойной ноты.",
    notes: ["#7E4A6B", "#A86680", "#3E2A3B"],
    color: "#7E4A6B",
    tea: "красный",
    pairedTea: "Дянь Хун",
    format: "джелато",
    base: "Сливочное",
    type: "Фруктово-ягодный",
    phrase: "про лесные ягоды и хвою",
  },
  {
    id: "dondurma-orchids",
    block: 0,
    num: 110,
    title: "Дондурма «Две орхидеи. Вершки и корешки»",
    line: "Линия тягучего chewy-желато",
    short: "Тягучая дондурма: таитянская ваниль, салеп, мастичная фисташка",
    ingredients: [
      "Таитянская ваниль",
      "Корень орхидеи салеп",
      "Мастичная фисташка",
      "Красный чай",
    ],
    description:
      "Тягучая дондурма из двух орхидей: стручковой таитянской ванили и корня горной орхидеи по имени салеп. Плюс смола мастичной фисташки для аромата. Набираешь ложку — и тяяяянешь. Пряное, кремовое, не приторное, благородное, редкое, фактурное chewy-желато на турецкий мотив.",
    secret:
      "Этот рецепт вырос из попытки перенести стамбульское уличное шоу с дондурмой в чайный контекст — без ярмарочных трюков, но с той же тягучестью.\nСалеп и мастика — два ингредиента, которые обычно живут в кофейнях и лавках ценных специй. Настоящий салеп делают из корней орхидеи, которую по-русски называют ятрышник: именно он даёт то самое тягучее загущение текстуры, усиленное мастикой (mastic gum).\nОрхидей на всех не хватает, поэтому в Турции дондурму и одноимённый зимний напиток всё чаще готовят из безымянного орхидее-заменителя. В этом рецепте используется настоящий салеп, который «как родной» сочетается с другой орхидеей — ванилью.",
    notes: ["#E8DCC2", "#C9B68A", "#B89265"],
    color: "#E8DCC2",
    tea: "красный",
    pairedTea: "Дянь Хун",
    format: "джелато",
    base: "Сливочное",
    type: "Десертный",
    phrase: "про благородную тягучесть",
  },
  {
    id: "cremoso-pancake",
    block: 0,
    num: 141,
    title: "Cremoso Gelato «Блин наизнанку»",
    line: "Линия масленичного сверх-желато",
    short: "Cremoso желато: сметанный крем, коньяк, лавандовые криспи-крепы",
    ingredients: [
      "Сыр в масле нуазет",
      "Сметанный заварной крем",
      "Коньяк",
      "Лавандовые криспи-крепы",
    ],
    description:
      "Масленичное сверх-желато. Блин становится начинкой, щедрая кремовая начинка — оболочкой. Это и есть блин наизнанку. Не только в Масленицу, но круглый год.",
    secret:
      "Этот вкус начинался как суперпломбир — это когда гостовские требования к жирности превышены примерно в полтора раза, до 18%. Потом, по мере работы над текстурой, он плавно переехал в класс cremoso-желато — так изящнее и вкуснее.\nБлины для начинки обжариваются в масле нуазет до криспи-хруста и уже потом пропитываются лавандой.",
    notes: ["#E6D2D8", "#D8C7E0", "#C9A0AA"],
    color: "#D8C7E0",
    tea: "улун",
    pairedTea: "Дянь Хун",
    format: "джелато",
    base: "Сливочное",
    type: "Десертный",
    phrase: "про масленичную нежность",
  },

  // ── Сет 2. Сорбэ на белом чае и улуне, плюс москвито ─────────────
  {
    id: "finnish-sorbet",
    block: 1,
    num: 74,
    title: "Сорбэ «Финниш»",
    line: "Линия лесной ягоды",
    short: "Сорбэ из клюквы и брусники с корицей, бузиной и розмарином",
    ingredients: ["Клюква", "Брусника", "Корица", "Цветы бузины", "Розмарин"],
    description:
      "По мотивам легендарного московского мороженого 1950-х, но с финнским акцентом.",
    secret:
      "В Москве 50-х выпускали щербет с клюквой и корицей. Нам не довелось его попробовать, знаем только понаслышке, поэтому пришлось фантазировать на эту тему самим.\nОтличное сочетание корицы и клюквы базируется на улуне, а розмарин и цветы бузины добавляют обертонов к классической «клюкве с сахаром».",
    notes: ["#B83A4A", "#D86A78", "#7E2230"],
    color: "#B83A4A",
    tea: "улун",
    pairedTea: "Бай Му Дань",
    format: "сорбэ",
    base: "Сорбет",
    type: "Фруктово-ягодный",
    phrase: "про клюквенный мороз",
  },
  {
    id: "eternal-honeysuckle",
    block: 1,
    num: 58,
    title: "Сорбэ «Вечная жимолость»",
    line: "Линия вечной молодости",
    short: "Сорбэ из жимолости с белым персиком и цветами лимона",
    ingredients: ["Жимолость", "Персик «Белый лебедь»", "Цветы лимона", "Белый чай"],
    description:
      "Синие ягоды жимолости, августовские крымские персики сорта «Белый лебедь», цветы лимона, белый чай. Персик в китайской традиции — пожелание вечной молодости. Жимолость и бутоны лимона — средства её достижения.",
    notes: ["#6B7AB8", "#A8B4D8", "#3F4A7E"],
    color: "#6B7AB8",
    tea: "белый",
    pairedTea: "Бай Му Дань",
    format: "сорбэ",
    base: "Сорбет",
    type: "Фруктово-ягодный",
    phrase: "про вечную свежесть",
  },
  {
    id: "fig-ginger-passion",
    block: 1,
    num: 22,
    title: "Сорбэ «Инжир, имбирь и маракуйя»",
    line: "Линия острой свежести",
    short: "Острое, пряное, свежее сорбэ на терпком улуне",
    ingredients: ["Инжир", "Имбирь", "Маракуйя", "Бирюзовый чай Горы Феникса"],
    description:
      "Острое, пряное, свежее сорбэ на терпком улуне.",
    notes: ["#D4793F", "#E8A867", "#9E4E22"],
    color: "#D4793F",
    tea: "улун",
    pairedTea: "Бай Му Дань",
    format: "сорбэ",
    base: "Сорбет",
    type: "Фруктово-ягодный",
    phrase: "про пряный имбирь",
  },
  {
    id: "saperavi-ice",
    block: 1,
    num: 105,
    title: "Саперави Айс. Грузия-сорбэ",
    line: "Линия виноградной краски",
    short: "Сорбэ из айвы, кизила и тархуна, окрашенных саперави",
    ingredients: ["Айва", "Кизил", "Тархун", "Саперави", "Гуандунский улун"],
    description:
      "Саперави в переводе — «красящий». Роль абсолютно натурального красителя прекрасно исполнена этим вином (крепость мороженого при этом не выше 0,5°). В первом грузинском мороженом Чайной высоты виноградом-красильщиком окрашены айва, кизил, тархун и гуандунский улун.",
    notes: ["#5C2030", "#8A3A50", "#3A0F1C"],
    color: "#5C2030",
    tea: "улун",
    pairedTea: "Бай Му Дань",
    format: "сорбэ",
    base: "Сорбет",
    type: "Фруктово-ягодный",
    phrase: "про винную глубину",
  },
  {
    id: "summer-mosquito",
    block: 1,
    num: 160,
    title: "Совершенно летнее москвито",
    line: "Линия дореволюционного «московита»",
    short: "Москвито: вишня, малина, жимолость, тархун, мята, базилик",
    ingredients: [
      "Вишня",
      "Малина",
      "Жимолость",
      "Тархун",
      "Садовая мята",
      "Семена базилика",
    ],
    description:
      "Летнее москвито — частично замороженный десерт из ягод и трав, ароматный и не приторный.",
    secret:
      "Сорт появился в 2024 году, к 18-летию чайного мороженого Чайной высоты.\n«Москвито» — наш оммаж дореволюционному усадебному летнему десерту «московит»: частично замороженному желе из фруктов, сока, а иногда и чая.",
    notes: ["#A82145", "#D26380", "#6A0F2A"],
    color: "#A82145",
    tea: "улун",
    pairedTea: "Бай Му Дань",
    format: "москвито",
    base: "Сорбет",
    type: "Фруктово-ягодный",
    phrase: "про летнюю прохладу",
  },

  // ── Сет 3. Пломбиры и желато на пуэре ───────────────────────────
  {
    id: "puer-raspberry-meadowsweet",
    block: 2,
    num: 40,
    title: "Пуэр, малина, таволга и лайм",
    line: "Линия медвяных лугов",
    short: "Пломбир на пуэре с малиной, таволгой и лаймом",
    ingredients: ["Малина", "Таволга", "Лайм", "Пуэр"],
    description:
      "Полезное, вкусное и удивительно ароматное. Медвяная сладость аромата цветущей таволги, греющее сочетание малины и лайма и сплошные витамины.",
    secret:
      "Таволга по-английски — meadowsweet, буквально «сладость луга». Этот ароматнейший травянистый кустарник встречается повсеместно в средних широтах.\nАптечное название таволги — лабазник. Цветущие заросли таволги легко узнать издалека по обилию пчёл.",
    notes: ["#C84A6B", "#E48AA0", "#7E2A45"],
    color: "#C84A6B",
    tea: "шу пуэр",
    pairedTea: "Шу пуэр",
    format: "пломбир",
    base: "Сливочное",
    type: "Фруктово-ягодный",
    phrase: "про медвяные луга",
  },
  {
    id: "plum-beer-passion",
    block: 2,
    num: 150,
    title: "PLUM BEER PASSION",
    line: "Линия пивной сливы",
    short: "Пломбир: слива, тёрн, берлинер вайс, маракуйя, пуэр",
    ingredients: [
      "Слива",
      "Тёрн",
      "Пиво берлинер вайс",
      "Маракуйя",
      "Кориандр",
      "Мята",
      "Корица",
      "Пуэр",
    ],
    description: "Слива пиво маракуйя!",
    notes: ["#6C2A4A", "#9C4868", "#3F1228"],
    color: "#6C2A4A",
    tea: "шу пуэр",
    pairedTea: "Шу пуэр",
    format: "пломбир",
    base: "Сливочное",
    type: "Фруктово-ягодный",
    phrase: "про дерзкую сливу",
  },
  {
    id: "morchello-mascarpone",
    block: 2,
    num: 147,
    title: "Морчелло маскарпоне тирамису",
    line: "Линия желато-тирамису",
    short: "Желато-тирамису со сморчками, маскарпоне и пуэром",
    ingredients: [
      "Маскарпоне",
      "Миндаль",
      "Крем",
      "Ballantine's",
      "Сморчки",
      "Какао",
      "Хиосский миндальный сироп",
      "Пуэр",
    ],
    description:
      "Заклинание «Морчелло! Маскарпоне! Тирамису!» сочетает редкое с удивительным: сморчки, пропитанные пуэром, заменяют в этой желато-версии тирамису печенье савоярди, какао+Ballantine's+миндаль и миндальный сироп с острова Хиос непротиворечиво погружаются в нежность маскарпоне.",
    secret:
      "Это один из двух наших грибных вкусов мороженого. Пропитка сморчков и других гастрономически ценных видов грибов пуэром — суверенная разработка Чайной высоты.",
    notes: ["#7A5236", "#A8825A", "#4A2F1E"],
    color: "#7A5236",
    tea: "шу пуэр",
    pairedTea: "Шу пуэр",
    format: "джелато",
    base: "Сливочное",
    type: "Десертный",
    phrase: "про смелый эксперимент",
  },
  {
    id: "three-nuts",
    block: 2,
    num: 125,
    title: "Три ореха",
    line: "Линия ореховой сказки",
    short: "Пломбир: фундук, кедровый орех, варенье из грецкого ореха",
    ingredients: ["Фундук", "Кедровый орех", "Варенье из зелёного грецкого ореха"],
    description: "Сладкая версия сказки «Три орешка для Золушки». Сладкая и ореховая.",
    notes: ["#A37345", "#D0A578", "#6A4A28"],
    color: "#A37345",
    tea: "шу пуэр",
    pairedTea: "Шу пуэр",
    format: "пломбир",
    base: "Сливочное",
    type: "Ореховый",
    phrase: "про ореховую сказку",
  },
];

const BLOCKS = [
  {
    id: 0,
    title: "Сет 1. Пломбиры и желато на красных, зелёных и улунах",
    subtitle: "Открытие — травы, ягоды, орхидеи.",
  },
  {
    id: 1,
    title: "Сет 2. Сорбэ на белом чае и улуне, плюс москвито",
    subtitle: "Лёгкая середина — ягоды, цитрус, специи.",
  },
  {
    id: 2,
    title: "Сет 3. Пломбиры и желато на пуэре",
    subtitle: "Глубокий финал — пряное, ореховое, тёмное.",
  },
];

const PAIRING_TAGS = [
  "Само по себе",
  "Белый чай",
  "Зелёный чай",
  "Улун светлый",
  "Улун тёмный",
  "Красный",
  "Шу пуэр",
];

// ─── Custom step sliders ────────────────────────────────────────────────
// Each slider exposes labelled steps. The `pts` field is the HIDDEN numeric
// weight that feeds the Top-3 ranking when the user likes a flavour.
// `defaultIdx` is the neutral starting position (always a 0-point step).
// `noPoints` means the slider doesn't contribute to ranking math at all.

const FLAVOR_SLIDER_DEFS = [
  {
    key: "sweetness",
    label: "Баланс сладости",
    info: "Насколько сладость уравновешена. «Идеально» — сладость поддерживает остальные ноты, не перекрывая их.",
    defaultIdx: 1,
    steps: [
      { label: "Недостаточно", pts: -1 },
      { label: "Сдержанно",    pts:  0 },
      { label: "Идеально",     pts:  2 },
      { label: "Приторно",     pts: -1 },
    ],
  },
  {
    key: "sourness",
    label: "Кислотность / сочность",
    info: "Естественная кислинка и сочность вкуса — не путать со сладостью. Речь о свежести и яркости.",
    defaultIdx: 1,
    steps: [
      { label: "Недостаточно",  pts: -1 },
      { label: "Сдержанно",     pts:  0 },
      { label: "Идеально",      pts:  2 },
      { label: "Слишком кисло", pts: -1 },
    ],
  },
  {
    key: "texture",
    label: "Гладкость текстуры",
    info: "Ощущение во рту — насколько комфортна и приятна текстура мороженого.",
    defaultIdx: 1,
    steps: [
      { label: "Некомфортная", pts: -1 },
      { label: "Спорная",      pts:  0 },
      { label: "Приятная",     pts:  1 },
      { label: "Идеальная",    pts:  2 },
    ],
  },
  {
    key: "composition",
    label: "Выразительность композиции",
    info: "Насколько чисто и стройно слышны все ноты вкуса вместе — есть ли цельная картина.",
    defaultIdx: 1,
    steps: [
      { label: "Дисбаланс",  pts: -1 },
      { label: "Нормально",  pts:  0 },
      { label: "Гармонично", pts:  1 },
      { label: "Идеально",   pts:  2 },
    ],
  },
];

// ─── Tea-pairing match strength ─────────────────────────────────────────
const MATCH_SLIDER_DEF = {
  key: "match",
  label: "Сила мэтча",
  info: "Насколько мороженое раскрывается рядом с подобранным чаем. Идеальный мэтч — оба становятся лучше вместе.",
  defaultIdx: 2,
  steps: [
    { label: "Конфликт",         pts: -2 },
    { label: "Дисбаланс",        pts: -1 },
    { label: "Нейтралитет",      pts:  0 },
    { label: "Гармония",         pts:  1 },
    { label: "Сочетание удачно", pts:  2 },
    { label: "Идеальный мэтч",   pts:  3 },
  ],
};

// ─── Overall impression chips (weighted) ────────────────────────────────
// Hidden float weights feed the ranking. Order shown on the card is the
// order below (most positive → most negative).
const IMPRESSION_TAGS = [
  { tag: "Хочу еще",        weight:  1.0 },
  { tag: "Шок-контент",     weight:  0.8 },
  { tag: "Многогранное",    weight:  0.7 },
  { tag: "Необычно",        weight:  0.4 },
  { tag: "Просто норм",     weight:  0.1 },
  { tag: "Никак",           weight:  0.0 },
  { tag: "Не пробовал",     weight:  0.0 },
  { tag: "На один раз",     weight: -0.3 },
  { tag: "Странно",         weight: -0.5 },
  { tag: "Не понравилось",  weight: -0.8 },
];

const IMPRESSION_WEIGHTS = IMPRESSION_TAGS.reduce((m, x) => {
  m[x.tag] = x.weight; return m;
}, {});

// Compute a flavour's ranking score from its tasting record.
// Sums: 3 flavour sliders (texture excluded) + tea-match slider + chip weights.
function computeFlavorScore(t) {
  if (!t) return 0;
  let s = 0;
  const f = t.flavor || {};
  FLAVOR_SLIDER_DEFS.forEach((def) => {
    if (def.noPoints) return;
    const i = f[def.key];
    if (i == null) return;
    s += def.steps[i]?.pts ?? 0;
  });
  if (t.match != null) s += MATCH_SLIDER_DEF.steps[t.match]?.pts ?? 0;
  (t.impressions || []).forEach((tag) => {
    s += IMPRESSION_WEIGHTS[tag] ?? 0;
  });
  return s;
}

// Used internally by the archetype computation (no longer rendered as a chart).
const PROFILE_AXES = [
  { key: "warmth",    label: "Тепло" },
  { key: "freshness", label: "Свежесть" },
  { key: "depth",     label: "Глубина" },
  { key: "play",      label: "Игра" },
  { key: "cozy",      label: "Уют" },
];

// Emotion tags shown in each ice-cream evaluation. Each tag contributes
// weighted points to one or two profile axes — that's how the archetype gets
// shaped by what the taster actually felt, not just by slider math.
const EMOTION_TAGS = [
  { tag: "Впечатлил",    axes: { play: 0.4, depth: 0.3 } },
  { tag: "Удивил",       axes: { play: 0.9 } },
  { tag: "Согрел",       axes: { warmth: 1.0, cozy: 0.4 } },
  { tag: "Освежил",      axes: { freshness: 1.0 } },
  { tag: "Из детства",   axes: { cozy: 0.9, warmth: 0.3 } },
  { tag: "Медитативный", axes: { depth: 0.9, cozy: 0.3 } },
  { tag: "Дерзкий",      axes: { play: 1.0 } },
  { tag: "Акварельный",  axes: { freshness: 0.6, depth: 0.3 } },
  { tag: "Звенящий",     axes: { freshness: 0.8, play: 0.2 } },
  { tag: "Тёплый шёпот", axes: { warmth: 0.7, cozy: 0.7 } },
];

// ─── Flavour Archetypes ──────────────────────────────────────────────────
// One per dominant axis. The archetype drives the Aura's colour palette and
// morphing speed on the Result screen. `speed` is the base animation duration
// in seconds (lower = faster, more frenetic).
const ARCHETYPES = {
  cozy: {
    key: "cozy",
    title: "Искатель Уюта",
    description:
      "Вам ближе обволакивающие, согревающие вкусы — те, что напоминают о мягком вечере и долгом разговоре. Сладкое, плотное, родное.",
    match: "Дянь хун, орхидея-дондурма и «Блин наизнанку» — мягкое и тёплое.",
    palette: ["#FF9E7A", "#FFCB99", "#FF85B5", "#FFD9A8", "#FF6B7D"],
    bg: "transparent",
    glow: "rgba(255, 130, 130, 0.55)",
    speed: 11,
  },
  warmth: {
    key: "warmth",
    title: "Тёплый Романтик",
    description:
      "Вы ищете тепло — пряное, медовое, с долгим послевкусием. Поздний свет, янтарь, кардамон.",
    match: "Шу пуэр и плотные сливочные джелато — ваш вечер.",
    palette: ["#FF8A2C", "#FF4D1A", "#FF6A8A", "#FFB845", "#E0341A"],
    bg: "transparent",
    glow: "rgba(255, 90, 40, 0.55)",
    speed: 10,
  },
  depth: {
    key: "depth",
    title: "Хранитель Глубины",
    description:
      "Сложные, выдержанные вкусы — те, в которые хочется погружаться долго. Земля, выдержка, тёмная сладость.",
    match: "Пуэр-желато «Морчелло» и «Саперави Айс» — ваша медитация.",
    palette: ["#9C42E8", "#34B5D4", "#D24DFF", "#1F8FB8", "#FFB0F5"],
    bg: "rgba(20, 14, 32, 0.85)",
    glow: "rgba(180, 80, 240, 0.65)",
    speed: 14,
    dark: true,
  },
  freshness: {
    key: "freshness",
    title: "Звенящая Лёгкость",
    description:
      "Прозрачные, бодрящие вкусы — те, что освежают нёбо и оставляют ощущение чистоты. Вода, мята, белый чай.",
    match: "Сорбэ «Вечная жимолость» и «Финниш» — ваш регистр.",
    palette: ["#3FE5C2", "#5FCFFF", "#B8FF52", "#7DEDD2", "#1FD0E0"],
    bg: "transparent",
    glow: "rgba(80, 220, 220, 0.55)",
    speed: 7,
  },
  play: {
    key: "play",
    title: "Дерзкий Искатель",
    description:
      "Эксперимент и неожиданность — вам интересны контрасты и пары, которых ещё не пробовали. Игра вкуса важнее правил.",
    match: "Шэн пуэр и неожиданные сочетания — для вас.",
    palette: ["#2DFF65", "#FFE52A", "#FF479D", "#1FD8FF", "#FF6B1A"],
    bg: "transparent",
    glow: "rgba(255, 85, 160, 0.6)",
    speed: 5,
  },
};

// ─── Mock guest history (for the Личный кабинет screen) ─────────────────
// Three past tasting sessions with archetype, slider averages, top emotion
// tags, and 1–3 representative comments. Used to populate the profile so it
// looks lived-in from the first open.
const MOCK_HISTORY = [
  {
    id: "h-12",
    date: "12 мая 2026",
    title: "Чай и Джелато · Сет №12",
    count: 12,
    archetypeKey: "cozy",
    sliders: { sweetness: 64, texture: 58, intensity: 47 },
    topEmotions: ["Согрел", "Из детства", "Тёплый шёпот"],
    comments: [
      { ic: "Солнечная хурма № 34", text: "Тёплое, почти медитативное. Хорошо вошло после долгого дня." },
      { ic: "Морчелло маскарпоне № 147", text: "Грибное желато — неожиданно родное." },
      { ic: "Три ореха № 125", text: "Финал собрал весь сет в одну точку. Понравилось." },
    ],
  },
  {
    id: "h-spring",
    date: "28 марта 2026",
    title: "Весенний сет · 8 вкусов",
    count: 8,
    archetypeKey: "freshness",
    sliders: { sweetness: 41, texture: 38, intensity: 35 },
    topEmotions: ["Освежил", "Звенящий", "Акварельный"],
    comments: [
      { ic: "Вечная жимолость",       text: "Очень тонко. Едва-едва сладко, и это работает." },
      { ic: "Инжир, имбирь и маракуя", text: "Прозрачно. Хочется ещё." },
    ],
  },
  {
    id: "h-winter",
    date: "14 февраля 2026",
    title: "Зимняя серия · 6 вкусов",
    count: 6,
    archetypeKey: "depth",
    sliders: { sweetness: 52, texture: 71, intensity: 78 },
    topEmotions: ["Медитативный", "Тёплый шёпот"],
    comments: [
      { ic: "Саперави Айс", text: "Тёмное и винное. Долгое послевкусие — то, ради чего пришёл." },
    ],
  },
];

Object.assign(window, {
  ICE_CREAMS, BLOCKS, PAIRING_TAGS,
  PROFILE_AXES, EMOTION_TAGS, ARCHETYPES,
  MOCK_HISTORY,
  FLAVOR_SLIDER_DEFS, MATCH_SLIDER_DEF, IMPRESSION_TAGS,
  IMPRESSION_WEIGHTS, computeFlavorScore,
});

// ─── Seed tasting data ──────────────────────────────────────────────────
// Pre-fills every flavor with realistic, varied evaluations so the result
// screen has rich data on first load — top-3 podium, "Также вам понравились"
// list, and "Идеальный мэтч" block all populate. Each flavor carries
// `flavor` (slider step indices), `match` (tea-pairing step index),
// `impressions` (chip array), `liked`, `touched`, and optional comment.
//
// Score = sum of (slider pts where not noPoints) + match pts + sum of chip
// weights. Indices below were tuned so liked ones outscore non-liked.
const SEED_TASTINGS = {
  // Top-3 podium — guest leans toward depth + experiments (pуэр + orchids)
  "morchello-mascarpone": {
    touched: true, liked: true,
    flavor: { sweetness: 2, sourness: 1, texture: 3, composition: 3 },
    match: 5,                       // +3 Идеальный мэтч (Шу пуэр)
    impressions: ["Хочу еще", "Шок-контент", "Многогранное"],
    comment: "Сморчки в пуэре — открытие вечера.",
  },
  "dondurma-orchids": {
    touched: true, liked: true,
    flavor: { sweetness: 2, sourness: 1, texture: 3, composition: 2 },
    match: 4,                       // +2 (Дянь Хун)
    impressions: ["Хочу еще", "Многогранное", "Необычно"],
    comment: "Тянется бесконечно и в этом радость.",
  },
  "cremoso-pancake": {
    touched: true, liked: true,
    flavor: { sweetness: 2, sourness: 1, texture: 1, composition: 2 },
    match: 4,                       // +2 (Дянь Хун)
    impressions: ["Хочу еще", "Необычно"],
  },

  // Также вы оценили — liked but lower score
  "saperavi-ice": {
    touched: true, liked: true,
    flavor: { sweetness: 1, sourness: 2, texture: 0, composition: 1 },
    match: 4,                       // +2 (Бай Му Дань)
    impressions: ["Хочу еще"],
    comment: "Винное послевкусие без спирта — приятно.",
  },
  "three-nuts": {
    touched: true, liked: true,
    flavor: { sweetness: 2, sourness: 1, texture: 1, composition: 1 },
    match: 4,                       // +2 (Шу пуэр)
    impressions: ["Просто норм"],
  },

  // Not liked
  "finnish-sorbet": {
    touched: true, liked: false,
    flavor: { sweetness: 2, sourness: 2, texture: 0, composition: 1 },
    match: 3,
    impressions: ["Просто норм"],
  },
  "eternal-honeysuckle": {
    touched: true, liked: false,
    flavor: { sweetness: 1, sourness: 2, texture: 1, composition: 1 },
    match: 4,                       // +2 (Бай Му Дань) — anchors second match
    impressions: ["Просто норм", "Необычно"],
  },
  "summer-mosquito": {
    touched: true, liked: false,
    flavor: { sweetness: 1, sourness: 2, texture: 0, composition: 1 },
    match: 2,
    impressions: ["Странно", "На один раз"],
  },
  "plum-beer-passion": {
    touched: true, liked: false,
    flavor: { sweetness: 3, sourness: 1, texture: 0, composition: 1 },
    match: 2,
    impressions: ["Шок-контент", "На один раз"],
    comment: "Идей слишком много в одной ложке.",
  },
  "fig-ginger-passion": {
    touched: true, liked: false,
    flavor: { sweetness: 0, sourness: 3, texture: 0, composition: 1 },
    match: 2,
    impressions: ["Не понравилось"],
  },
  "persimmon-halva": {
    touched: true, liked: false,
    flavor: { sweetness: 3, sourness: 0, texture: 1, composition: 2 },
    match: 3,
    impressions: ["На один раз"],
  },
  "wild-berries-irga": {
    touched: true, liked: false,
    flavor: { sweetness: 1, sourness: 2, texture: 0, composition: 1 },
    match: 2,
    impressions: ["Странно", "Многогранное"],
  },
  "puer-raspberry-meadowsweet": {
    touched: true, liked: false,
    flavor: { sweetness: 1, sourness: 1, texture: 0, composition: 1 },
    match: 3,
    impressions: ["Просто норм"],
  },
};

Object.assign(window, { SEED_TASTINGS });
