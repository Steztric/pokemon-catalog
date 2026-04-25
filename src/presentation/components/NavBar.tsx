import { NavLink } from "react-router-dom";

export function NavBar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center gap-6">
      <span className="font-bold text-gray-900 text-lg mr-4">Pokemon Catalog</span>
      <NavLink
        to="/dashboard"
        className={({ isActive }) =>
          `text-sm font-medium transition-colors ${
            isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
          }`
        }
      >
        Dashboard
      </NavLink>
      <NavLink
        to="/scanner"
        className={({ isActive }) =>
          `text-sm font-medium transition-colors ${
            isActive ? "text-blue-600" : "text-gray-600 hover:text-gray-900"
          }`
        }
      >
        Scanner
      </NavLink>
    </nav>
  );
}
