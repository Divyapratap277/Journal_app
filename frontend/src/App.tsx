import { BrowserRouter, Route, Routes } from "react-router-dom";
import { AccountProvider } from "./account";
import { AuthProvider } from "./auth";
import { Layout } from "./components/Layout";
import { RequireAuth } from "./RequireAuth";
import { AccountsPage } from "./pages/AccountsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LoginPage } from "./pages/LoginPage";
import { SettingsPage } from "./pages/SettingsPage";
import { TradeEditPage } from "./pages/TradeEditPage";
import { TradeNewPage } from "./pages/TradeNewPage";
import { TradesPage } from "./pages/TradesPage";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route
              element={
                <AccountProvider>
                  <Layout />
                </AccountProvider>
              }
            >
              <Route path="/" element={<DashboardPage />} />
              <Route path="/trades" element={<TradesPage />} />
              <Route path="/trades/new" element={<TradeNewPage />} />
              <Route path="/trades/:id/edit" element={<TradeEditPage />} />
              <Route path="/accounts" element={<AccountsPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
