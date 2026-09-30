const GIFT_PREFIX = "cv.gift.";
const ACTIVATED_PREFIX = "cv.gifts.activated.";

const phoneKey = (phone) => (phone || "").replace(/\D/g, "");

export function getGift(giftId) {
  if (!giftId) return null;
  try { return JSON.parse(localStorage.getItem(`${GIFT_PREFIX}${giftId}`)); }
  catch (_) { return null; }
}

export function saveGift(giftId, gift) {
  localStorage.setItem(`${GIFT_PREFIX}${giftId}`, JSON.stringify(gift));
}

export function activateGift(giftId, phone) {
  const gift = getGift(giftId);
  const key = phoneKey(phone);
  if (!gift || !key) return null;
  if (gift.activatedPhone && gift.activatedPhone !== key) return null;

  const next = { ...gift, id: giftId, activatedPhone: key, activatedAt: new Date().toISOString() };
  saveGift(giftId, next);

  const indexKey = `${ACTIVATED_PREFIX}${key}`;
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem(indexKey)) || []; } catch (_) {}
  if (!ids.includes(giftId)) localStorage.setItem(indexKey, JSON.stringify([giftId, ...ids]));
  return next;
}

export function getActivatedGifts(phone) {
  const key = phoneKey(phone);
  if (!key) return [];
  let ids = [];
  try { ids = JSON.parse(localStorage.getItem(`${ACTIVATED_PREFIX}${key}`)) || []; } catch (_) {}
  return ids.map((id) => ({ ...getGift(id), id })).filter((gift) => gift.id && gift.activatedPhone === key);
}

export function giftBalance(gift) {
  return Math.max(0, Number.isFinite(gift?.remainingVisits) ? gift.remainingVisits : (gift?.visits || 0));
}

export function spendGiftVisits(allocations, meta = {}) {
  const gifts = allocations.map(({ giftId, visits }) => {
    const gift = getGift(giftId);
    if (!gift || visits < 1 || giftBalance(gift) < visits) throw new Error("gift_balance_changed");
    return { giftId, visits, gift };
  });

  const usedAt = new Date().toISOString();
  gifts.forEach(({ giftId, visits, gift }) => {
    saveGift(giftId, {
      ...gift,
      remainingVisits: giftBalance(gift) - visits,
      usage: [
        ...(gift.usage || []),
        { ...meta, visits, usedAt },
      ],
    });
  });
}
