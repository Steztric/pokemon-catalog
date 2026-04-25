import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Layout } from "./presentation/components/Layout";
import { DashboardPage } from "./presentation/pages/DashboardPage";
import { ScannerPage } from "./presentation/pages/ScannerPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <DashboardPage /> },
      { path: "scanner", element: <ScannerPage /> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
