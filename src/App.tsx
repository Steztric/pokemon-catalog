import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { Layout } from "./presentation/components/Layout";
import { DashboardPage } from "./presentation/pages/DashboardPage";
import { ScannerPage } from "./presentation/pages/ScannerPage";
import { SettingsPage } from "./presentation/pages/SettingsPage";
import { PageErrorBoundary } from "./presentation/components/PageErrorBoundary";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <PageErrorBoundary><DashboardPage /></PageErrorBoundary> },
      { path: "scanner", element: <PageErrorBoundary><ScannerPage /></PageErrorBoundary> },
      { path: "settings", element: <PageErrorBoundary><SettingsPage /></PageErrorBoundary> },
    ],
  },
]);

export function App() {
  return <RouterProvider router={router} />;
}
