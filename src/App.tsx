import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Locations from "./pages/Locations";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Users from "./pages/Users";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/auth" element={<Auth />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Redirect root to dashboard */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            {/* Master Data Management - Admin only */}
            <Route
              path="/locations"
              element={
                <ProtectedRoute allowedRoles={['group_admin']}>
                  <Locations />
                </ProtectedRoute>
              }
            />

            {/* Vehicles & Drivers - Admins and Coordinators */}
            <Route
              path="/vehicles"
              element={
                <ProtectedRoute allowedRoles={['group_admin', 'location_coordinator']}>
                  <Vehicles />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/drivers"
              element={
                <ProtectedRoute allowedRoles={['group_admin', 'location_coordinator']}>
                  <Drivers />
                </ProtectedRoute>
              }
            />

            {/* User Management - Group Admin only */}
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['group_admin']}>
                  <Users />
                </ProtectedRoute>
              }
            />

            {/* Catch-all */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;