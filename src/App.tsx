import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
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
import Coffee from "./pages/Coffee.tsx";
import AuthCallback from "./pages/AuthCallback.tsx";
import EnvHelp from "./pages/EnvHelp.tsx";
import EvidenceTriggers from "./pages/EvidenceTriggers.tsx";
import DemoIdCardPage from "./pages/DemoIdCardPage.tsx";
import DemoWalletPage from "./pages/DemoWalletPage.tsx";
import NandiSandbox from "./pages/NandiSandbox.tsx";
import { NandiInviteGate } from "./components/nandi/NandiInviteGate";
import { SandboxNandiRedirect } from "./components/nandi/SandboxNandiRedirect";
import { AppShell } from "./components/layout/AppShell";
import { AuthProvider } from "./hooks/useAuth.tsx";
import { DemoProvider } from "./contexts/DemoContext";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AuthProvider>
          <DemoProvider>
            <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/coffee" element={<Coffee />} />
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
            <Route path="/help/env" element={<AppShell><EnvHelp /></AppShell>} />
            <Route path="/evidence-triggers" element={<AppShell><EvidenceTriggers /></AppShell>} />
            <Route path="/id-card" element={<AppShell><DemoIdCardPage /></AppShell>} />
            <Route path="/wallet" element={<AppShell><DemoWalletPage /></AppShell>} />
            <Route path="/nandi" element={<NandiInviteGate><Navigate to="/nandi/farmer" replace /></NandiInviteGate>} />
            <Route path="/nandi/:audience" element={<NandiInviteGate><NandiSandbox /></NandiInviteGate>} />
            <Route path="/sandbox/nandi/*" element={<SandboxNandiRedirect />} />
            <Route path="/sandbox/nandi" element={<Navigate to="/nandi" replace />} />
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
