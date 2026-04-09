import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import SignupPage from "./pages/SignupPage";
import LoginPage from "./pages/LoginPage";
import SubmitPage from "./pages/SubmitPage";
import AccountPage from "./pages/AccountPage";
import StubPage from "./pages/StubPage";
import NotFound from "./pages/NotFound";

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
            <Route path="/events" element={<StubPage />} />
            <Route path="/jobs" element={<StubPage />} />
            <Route path="/grants" element={<StubPage />} />
            <Route path="/programs" element={<StubPage />} />
            <Route path="/wellbeing" element={<StubPage />} />
            <Route path="/about" element={<StubPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
