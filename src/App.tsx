import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import SubmitPage from "./pages/SubmitPage";
import AccountPage from "./pages/AccountPage";
import NotFound from "./pages/NotFound";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import CategoryListingPage from "./pages/CategoryListingPage";
import ListingDetailPage from "./pages/ListingDetailPage";
import AboutPage from "./pages/AboutPage";
import SearchPage from "./pages/SearchPage";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminListings from "./pages/admin/AdminListings";
import AdminAddListing from "./pages/admin/AdminAddListing";
import AdminEditListing from "./pages/admin/AdminEditListing";
import AdminFeatured from "./pages/admin/AdminFeatured";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminSettings from "./pages/admin/AdminSettings";
import AdminScanLog from "./pages/admin/AdminScanLog";
import AdminScanner from "./pages/admin/AdminScanner";
import StubPage from "./pages/StubPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/submit" element={<SubmitPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/events" element={<CategoryListingPage category="Events" />} />
            <Route path="/jobs" element={<CategoryListingPage category="Jobs" />} />
            <Route path="/grants" element={<CategoryListingPage category="Grants" />} />
            <Route path="/programs" element={<CategoryListingPage category="Programs" />} />
            <Route path="/wellbeing" element={<CategoryListingPage category="Wellbeing" />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/listings" element={<AdminListings />} />
            <Route path="/admin/add" element={<AdminAddListing />} />
            <Route path="/admin/listings/:id/edit" element={<AdminEditListing />} />
            <Route path="/admin/featured" element={<AdminFeatured />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
            <Route path="/admin/scanner" element={<AdminScanner />} />
            <Route path="/admin/scan-log" element={<AdminScanLog />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
