import { useMemo } from "react";
import styles from "./AppStarfield.module.css";

function createRandom(seed) {
  let value = seed;

  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function buildShadowLayer(seed, count) {
  const random = createRandom(seed);
  const stars = [];

  for (let index = 0; index < count; index += 1) {
    const x = Math.floor(random() * 2000);
    const y = Math.floor(random() * 2000);
    stars.push(`${x}px ${y}px #fff`);
  }

  return stars.join(", ");
}

export default function AppStarfield() {
  const smallStars = useMemo(() => buildShadowLayer(11, 700), []);
  const mediumStars = useMemo(() => buildShadowLayer(23, 200), []);
  const largeStars = useMemo(() => buildShadowLayer(37, 100), []);

  return (
    <div className={styles.background} aria-hidden="true">
      <div className={styles.stars1} style={{ "--star-shadows": smallStars }} />
      <div className={styles.stars2} style={{ "--star-shadows": mediumStars }} />
      <div className={styles.stars3} style={{ "--star-shadows": largeStars }} />
    </div>
  );
}
