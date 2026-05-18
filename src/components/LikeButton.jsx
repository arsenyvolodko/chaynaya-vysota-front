import { useState } from "react";
import { IconHeart } from "./icons.jsx";

export default function LikeButton({ liked, onToggle, disabled }) {
  const [burstId, setBurstId] = useState(0);

  const handleLike = () => {
    if (disabled) return;
    if (!liked) setBurstId((id) => id + 1);
    onToggle();
  };

  const SPARKS = 10;

  return (
    <button
      className={`like-btn like-btn--lg ${liked ? "like-btn--on" : ""}`}
      onClick={handleLike}
      aria-pressed={liked}
      aria-label={liked ? "Убрать лайк" : "Поставить лайк"}
      disabled={disabled}
    >
      <span className="like-btn__heart">
        <IconHeart size={26} filled={liked} stroke={2} />
      </span>
      {burstId > 0 && (
        <span className="like-spark-burst" key={burstId} aria-hidden="true">
          {Array.from({ length: SPARKS }).map((_, i) => {
            const ang = (i / SPARKS) * 360 + (i % 2 ? 8 : -8);
            const dist = 30 + (i % 3) * 6;
            const cls = i % 3 === 0 ? "like-spark like-spark--alt" : "like-spark";
            return (
              <span
                key={i}
                className={cls}
                style={{ "--ang": `${ang}deg`, "--dist": `${dist}px` }}
              />
            );
          })}
        </span>
      )}
    </button>
  );
}
