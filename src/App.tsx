import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Auth from "./pages/Auth.tsx";
import CompleteProfile from "./pages/CompleteProfile.tsx";
import Invite from "./pages/Invite.tsx";
import PublicPassport from "./pages/PublicPassport.tsx";
import PublicAttest from "./pages/PublicAttest.tsx";
import Admin from "./pages/Admin.tsx";
import PassportReport from "./pages/PassportReport.tsx";
import LogWork from "./pages/LogWork.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Contracts from "./pages/Contracts.tsx";
import Account from "./pages/Account.tsx";
import Pricing from "./pages/Pricing.tsx";
import { AppShell } from "./components/layout/AppShell";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { DemoProvider } from "./contexts/DemoContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <DemoProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/invite" element={<Invite />} />
            <Route path="/complete-profile" element={<CompleteProfile />} />
            <Route path="/passport/:contributorId" element={<PublicPassport />} />
            <Route path="/attest/:token" element={<PublicAttest />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/report" element={<PassportReport />} />
            <Route path="/dashboard" element={<AppShell><Dashboard /></AppShell>} />
            <Route path="/log-work" element={<AppShell><LogWork /></AppShell>} />
            <Route path="/contracts" element={<AppShell><Contracts /></AppShell>} />
            <Route path="/account" element={<AppShell><Account /></AppShell>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
            </Routes>
          </DemoProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
