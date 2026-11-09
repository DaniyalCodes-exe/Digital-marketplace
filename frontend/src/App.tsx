import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import PartnerDashboardPage from "./pages/PartnerDashboardPage";
import ProductsPage from "./pages/ProductsPage";
import CheckoutPage from "./pages/CheckoutPage";
import MarketplacePage from "./pages/MarketplacePage";
import PublicPartnerPage from "./pages/PublicPartnerPage";
import PublicProductPage from "./pages/PublicProductPage";
import PurchaseSuccessPage from "./pages/PurchaseSuccessPage";
import AdminPage from "./pages/AdminPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MarketplacePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/home" element={<HomePage />} />
      <Route path="/partner" element={<PartnerDashboardPage />} />
      <Route path="/admin" element={<AdminPage />} />
      <Route path="/admin/*" element={<AdminPage />} />
      <Route path="/products" element={<ProductsPage />} />
      <Route path="/products/marketplace" element={<MarketplacePage />} />
      <Route path="/profile/:slug" element={<PublicPartnerPage />} />
      <Route path="/products/:slug" element={<PublicProductPage />} />
      <Route path="/checkout/:slug" element={<CheckoutPage />} />
      <Route path="/checkout/:slug/success" element={<PurchaseSuccessPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
