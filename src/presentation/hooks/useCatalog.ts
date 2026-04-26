import { useQuery } from "@tanstack/react-query";
import type { CatalogFilter } from "../../domain/entities";
import type { CardDetail } from "../../application/usecases/GetCardDetail";
import { searchCatalog } from "../../application/usecases/SearchCatalog";
import { platform } from "../../infrastructure/platform";

export function useCatalog(filter?: CatalogFilter) {
  return useQuery<CardDetail[]>({
    queryKey: ["catalog", filter],
    queryFn: () => searchCatalog(platform.storage, filter),
  });
}
