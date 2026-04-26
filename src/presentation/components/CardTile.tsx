import type { CardDetail } from "../../application/usecases/GetCardDetail";

interface Props {
  item: CardDetail;
}

export function CardTile({ item: { card, entry } }: Props) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="relative">
        <img
          src={card.imageUrl}
          alt={card.name}
          className="w-full object-contain bg-gray-50"
          loading="lazy"
        />
        {entry.quantity > 1 && (
          <span className="absolute top-2 right-2 bg-blue-600 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            ×{entry.quantity}
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="font-semibold text-gray-900 text-sm truncate">{card.name}</p>
        <p className="text-xs text-gray-500 truncate">{card.setName}</p>
        <p className="text-xs text-gray-400 mt-1">{card.rarity}</p>
      </div>
    </div>
  );
}
