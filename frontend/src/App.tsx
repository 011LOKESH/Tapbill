import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CustomerDetails from "./pages/CustomerDetails";
import MenuPage from "./pages/MenuPage";
import EditBill from "./pages/EditBill";
import Report from "./pages/Report";
import DayWiseSales from "./pages/DayWiseSales";
import BillWiseSales from "./pages/BillWiseSales";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/menu" element={<MenuPage />} />
          <Route path="/edit-bill" element={<EditBill />} />
          <Route path="/customer-details" element={<CustomerDetails />} />
          <Route path="/report" element={<Report />} />
          <Route path="/day-wise-sales" element={<DayWiseSales />} />
          <Route path="/bill-wise-sales" element={<BillWiseSales />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
