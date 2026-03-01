import { InfiniteMovingCards } from "@/components/ui/infinite-moving-cards";

export default function MovingCardsWrapper({
  items,
  direction = "left",
  speed = "fast",
  pauseOnHover = true,
  className = "",
}) {
  return (
    <InfiniteMovingCards
      items={items}
      direction={direction}
      speed={speed}
      pauseOnHover={pauseOnHover}
      className={className}
    />
  );
}