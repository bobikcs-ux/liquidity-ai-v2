import { createBrowserRouter } from "react-router";
import { UnifiedLayout } from "./components/layout/UnifiedLayout";
import { Dashboard } from "./pages/Dashboard";
import { Intelligence } from "./pages/Intelligence";
import { StressLab } from "./pages/StressLab";
import { Reports } from "./pages/Reports";
import { DataSources } from "./pages/DataSources";
import { Profile } from "./pages/Profile";
import { BlackSwanTerminal } from "./pages/BlackSwanTerminal";
import { CapitalSurvival } from "./pages/CapitalSurvival";
import { AGITerminal } from "./pages/AGITerminal";
import { EnergyFinance } from "./pages/EnergyFinance";
import { Sovereign } from "./pages/Sovereign";
import { Citadel } from "./pages/Citadel";
import { Triad } from "./pages/Triad";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <UnifiedLayout />,
    children: [
      {
        index: true,
        element: <Dashboard />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "intelligence",
        element: <Intelligence />,
      },
      {
        path: "stress-lab",
        element: <StressLab />,
      },
      {
        path: "black-swan",
        element: <BlackSwanTerminal />,
      },
      {
        path: "capital-survival",
        element: <CapitalSurvival />,
      },
      {
        path: "agi-terminal",
        element: <AGITerminal />,
      },
      {
        path: "reports",
        element: <Reports />,
      },
      {
        path: "data-sources",
        element: <DataSources />,
      },
      {
        path: "profile",
        element: <Profile />,
      },
      {
        path: "energy-finance",
        element: <EnergyFinance />,
      },
      {
        path: "sovereign",
        element: <Sovereign />,
      },
      {
        path: "citadel",
        element: <Citadel />,
      },
      {
        path: "triad",
        element: <Triad />,
      },
    ],
  },
]);
