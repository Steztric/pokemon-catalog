import type { CardDetail } from "../../application/usecases/GetCardDetail";
import { CardTile } from "./CardTile";

interface Props {
  items: CardDetail[];
}

export function CardGrid({ items }: Props) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((item) => (
        <CardTile key={item.entry.id} item={item} />
      ))}
    </div>
  );
}
