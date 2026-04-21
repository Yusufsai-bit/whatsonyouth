import { lazy, Suspense } from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import NotFound from "./pages/NotFound";
import BackToTop from "@/components/BackToTop";
import AdminGuard from "@/components/admin/AdminGuard";

const Index = lazy(() => import('./pages/Index'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const SubmitPage = lazy(() => import('./pages/SubmitPage'));
const AccountPage = lazy(() => import('./pages/AccountPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const CategoryListingPage = lazy(() => import('./pages/CategoryListingPage'));
const ListingDetailPage = lazy(() => import('./pages/ListingDetailPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const PrivacyPage = lazy(() => import('./pages/PrivacyPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const EditListingPage = lazy(() => import('./pages/EditListingPage'));
const StubPage = lazy(() => import('./pages/StubPage'));
const SavedListingsPage = lazy(() => import('./pages/SavedListingsPage'));
const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminListings = lazy(() => import('./pages/admin/AdminListings'));
const AdminAddListing = lazy(() => import('./pages/admin/AdminAddListing'));
const AdminEditListing = lazy(() => import('./pages/admin/AdminEditListing'));
const AdminFeatured = lazy(() => import('./pages/admin/AdminFeatured'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminSettings = lazy(() => import('./pages/admin/AdminSettings'));
const AdminScanLog = lazy(() => import('./pages/admin/AdminScanLog'));
const AdminScanner = lazy(() => import('./pages/admin/AdminScanner'));
const AdminSEO = lazy(() => import('./pages/admin/AdminSEO'));
const RegionalPage = lazy(() => import('./pages/RegionalPage'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

const App = () => (
  <HelmetProvider>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <ScrollToTop />
        <AuthProvider>
          <div className="pt-14 md:pt-[60px]">
          <Suspense fallback={
            <div className="min-h-screen bg-white flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#5847E0] border-t-transparent rounded-full animate-spin" />
            </div>
          }>
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
            <Route path="/melbourne" element={<RegionalPage region="melbourne" />} />
            <Route path="/geelong" element={<RegionalPage region="geelong" />} />
            <Route path="/ballarat" element={<RegionalPage region="ballarat" />} />
            <Route path="/bendigo" element={<RegionalPage region="bendigo" />} />
            <Route path="/gippsland" element={<RegionalPage region="gippsland" />} />
            <Route path="/shepparton" element={<RegionalPage region="shepparton" />} />
            <Route path="/listings/:id" element={<ListingDetailPage />} />
            <Route path="/listings/:id/edit" element={<EditListingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/saved" element={<SavedListingsPage />} />
            <Route path="/admin" element={<AdminGuard><AdminDashboard /></AdminGuard>} />
            <Route path="/admin/listings" element={<AdminGuard><AdminListings /></AdminGuard>} />
            <Route path="/admin/add" element={<AdminGuard><AdminAddListing /></AdminGuard>} />
            <Route path="/admin/listings/:id/edit" element={<AdminGuard><AdminEditListing /></AdminGuard>} />
            <Route path="/admin/featured" element={<AdminGuard><AdminFeatured /></AdminGuard>} />
            <Route path="/admin/users" element={<AdminGuard><AdminUsers /></AdminGuard>} />
            <Route path="/admin/settings" element={<AdminGuard><AdminSettings /></AdminGuard>} />
            <Route path="/admin/scanner" element={<AdminGuard><AdminScanner /></AdminGuard>} />
            <Route path="/admin/scan-log" element={<AdminGuard><AdminScanLog /></AdminGuard>} />
            <Route path="/admin/seo" element={<AdminGuard><AdminSEO /></AdminGuard>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
          </div>
          <BackToTop />
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </HelmetProvider>
);

export default App;
