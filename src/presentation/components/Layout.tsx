import { Outlet } from "react-router-dom";
import { NavBar } from "./NavBar";
import { IndexRefreshBanner } from "./IndexRefreshBanner";
import { usePHashIndexBuild } from "../hooks/usePHashIndexBuild";

export function Layout() {
  const { isBuilding } = usePHashIndexBuild();
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <NavBar />
      <IndexRefreshBanner isBuilding={isBuilding} />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  );
}
