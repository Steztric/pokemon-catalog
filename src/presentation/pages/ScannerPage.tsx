import { Link } from "react-router-dom";

export function ScannerPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Scanner</h1>
      <p className="text-gray-600 mb-6">
        Hold a Pokemon card up to your webcam to identify and add it to your
        collection.
      </p>
      <Link
        to="/dashboard"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition-colors"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
