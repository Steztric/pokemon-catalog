import { Link } from "react-router-dom";

export function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
      <p className="text-gray-600 mb-6">
        Browse your Pokemon card collection. Cards you scan will appear here.
      </p>
      <Link
        to="/scanner"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Go to Scanner
      </Link>
    </div>
  );
}
