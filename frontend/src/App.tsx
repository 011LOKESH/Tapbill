import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CustomerDetails from "./pages/CustomerDetails";
import MenuPage from "./pages/MenuPage";
import EditBill from "./pages/EditBill";
import Report from "./pages/Report";
import DayWiseSales from "./pages/DayWiseSales";
import BillWiseSales from "./pages/BillWiseSales";
import DeletedBills from "./pages/DeletedBills";
import DeletedBillDetails from './pages/DeletedBillDetails';
import CustomizeMenu from './pages/CustomizeMenu';
import ExportAndDelete from './pages/ExportAndDelete';
import DeletedItems from './pages/DeletedItems';
import Login from './pages/Login';

const queryClient = new QueryClient();

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const session = localStorage.getItem('userSession');
  if (!session) {
    return <Navigate to="/login" replace />;
  }

  const { timestamp } = JSON.parse(session);
  const now = new Date().getTime();
  if (now - timestamp > 12 * 60 * 60 * 1000) {
    localStorage.removeItem('userSession');
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <ProtectedRoute>
              <Index />
            </ProtectedRoute>
          } />
          <Route path="/menu" element={
            <ProtectedRoute>
              <MenuPage />
            </ProtectedRoute>
          } />
          <Route path="/edit-bill" element={
            <ProtectedRoute>
              <EditBill />
            </ProtectedRoute>
          } />
          <Route path="/edit-bill/:id" element={
            <ProtectedRoute>
              <EditBill />
            </ProtectedRoute>
          } />
          <Route path="/customer-details" element={
            <ProtectedRoute>
              <CustomerDetails />
            </ProtectedRoute>
          } />
          <Route path="/report" element={
            <ProtectedRoute>
              <Report />
            </ProtectedRoute>
          } />
          <Route path="/day-wise-sales" element={
            <ProtectedRoute>
              <DayWiseSales />
            </ProtectedRoute>
          } />
          <Route path="/bill-wise-sales" element={
            <ProtectedRoute>
              <BillWiseSales />
            </ProtectedRoute>
          } />
          <Route path="/deleted-bills" element={
            <ProtectedRoute>
              <DeletedBills />
            </ProtectedRoute>
          } />
          <Route path="/deleted-bill-details/:id" element={
            <ProtectedRoute>
              <DeletedBillDetails />
            </ProtectedRoute>
          } />
          <Route path="/customize-menu" element={
            <ProtectedRoute>
              <CustomizeMenu />
            </ProtectedRoute>
          } />
          <Route path="/export-and-delete" element={
            <ProtectedRoute>
              <ExportAndDelete />
            </ProtectedRoute>
          } />
          <Route path="/deleted-items" element={
            <ProtectedRoute>
              <DeletedItems />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
