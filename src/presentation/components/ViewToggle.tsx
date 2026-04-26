export type ViewMode = "grid" | "list";

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex rounded border border-gray-300 overflow-hidden">
      <button
        onClick={() => onChange("grid")}
        aria-label="Grid view"
        aria-pressed={value === "grid"}
        className={`px-3 py-1.5 text-sm ${
          value === "grid"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        Grid
      </button>
      <button
        onClick={() => onChange("list")}
        aria-label="List view"
        aria-pressed={value === "list"}
        className={`px-3 py-1.5 text-sm border-l border-gray-300 ${
          value === "list"
            ? "bg-gray-900 text-white"
            : "bg-white text-gray-600 hover:bg-gray-50"
        }`}
      >
        List
      </button>
    </div>
  );
}
