import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "@/contexts/AppContext";
import WelcomeScreen from "./pages/WelcomeScreen";
import AuthScreen from "./pages/AuthScreen";
import Dashboard from "./pages/Dashboard";
import AddDeviceScreen from "./pages/AddDeviceScreen";
import DeviceDetailsScreen from "./pages/DeviceDetailsScreen";
import NotificationsScreen from "./pages/NotificationsScreen";
import TipsScreen from "./pages/TipsScreen";
import ProfileScreen from "./pages/ProfileScreen";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Protected Route wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Auth Route - redirects to dashboard if already logged in
const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useApp();
  return isAuthenticated ? <Navigate to="/dashboard" replace /> : <>{children}</>;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<AuthRoute><WelcomeScreen /></AuthRoute>} />
    <Route path="/auth" element={<AuthRoute><AuthScreen /></AuthRoute>} />
    <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
    <Route path="/add-device" element={<ProtectedRoute><AddDeviceScreen /></ProtectedRoute>} />
    <Route path="/device/:id" element={<ProtectedRoute><DeviceDetailsScreen /></ProtectedRoute>} />
    <Route path="/notifications" element={<ProtectedRoute><NotificationsScreen /></ProtectedRoute>} />
    <Route path="/tips" element={<ProtectedRoute><TipsScreen /></ProtectedRoute>} />
    <Route path="/profile" element={<ProtectedRoute><ProfileScreen /></ProtectedRoute>} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppProvider>
          <div className="max-w-lg mx-auto min-h-screen bg-background">
            <AppRoutes />
          </div>
        </AppProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
