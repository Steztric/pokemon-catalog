interface Props {
  isBuilding: boolean;
}

export function IndexRefreshBanner({ isBuilding }: Props) {
  if (!isBuilding) return null;
  return (
    <div role="status" className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-800">
      Rebuilding card index — matching performance may be reduced until complete.
    </div>
  );
}
