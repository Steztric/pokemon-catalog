import type { CardDetail } from "../../application/usecases/GetCardDetail";

interface Props {
  items: CardDetail[];
}

export function CardList({ items }: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-gray-500 border-b border-gray-200">
            <th className="pb-2 pr-4 font-medium">Card</th>
            <th className="pb-2 pr-4 font-medium">Set</th>
            <th className="pb-2 pr-4 font-medium">#</th>
            <th className="pb-2 pr-4 font-medium">Rarity</th>
            <th className="pb-2 pr-4 font-medium">Type</th>
            <th className="pb-2 pr-4 font-medium">Qty</th>
            <th className="pb-2 font-medium">Added</th>
          </tr>
        </thead>
        <tbody>
          {items.map(({ card, entry }) => (
            <tr
              key={entry.id}
              className="border-b border-gray-100 hover:bg-gray-50"
            >
              <td className="py-2 pr-4">
                <div className="flex items-center gap-3">
                  <img
                    src={card.imageUrl}
                    alt={card.name}
                    className="w-8 object-contain flex-shrink-0"
                    loading="lazy"
                  />
                  <span className="font-medium text-gray-900">{card.name}</span>
                </div>
              </td>
              <td className="py-2 pr-4 text-gray-600">{card.setName}</td>
              <td className="py-2 pr-4 text-gray-600">{card.number}</td>
              <td className="py-2 pr-4 text-gray-600">{card.rarity}</td>
              <td className="py-2 pr-4 text-gray-600">{card.type}</td>
              <td className="py-2 pr-4 text-gray-600">{entry.quantity}</td>
              <td className="py-2 text-gray-500">
                {new Date(entry.firstAddedAt).toLocaleDateString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
