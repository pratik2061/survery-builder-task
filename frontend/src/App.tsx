import { BrowserRouter, Routes, Route, Navigate, Link, Outlet, useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState } from "react";
import axios from "axios";
import { LogOut } from "lucide-react";
import toast from "react-hot-toast";

import AdminDashboard from "./pages/AdminDashboard";
import SurveyBuilder from "./pages/SurveyBuilder";
import SurveyForm from "./pages/SurveyForm";
import SurveyAnalytics from "./pages/SurveyAnalytics";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

// Ensure all API calls send the HTTP-only cookie automatically
axios.defaults.withCredentials = true;
axios.defaults.baseURL = import.meta.env.VITE_API_URL || "http://localhost:3000";

function AdminLayout() {
  const navigate = useNavigate();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Check if user is logged in before rendering admin dashboard
  useEffect(() => {
    axios.get("/api/auth/me")
      .then(() => setIsAuthenticated(true))
      .catch(() => {
        setIsAuthenticated(false);
        navigate("/login");
      });
  }, [navigate]);

  const handleLogout = async () => {
    try {
      await axios.post("/api/auth/logout");
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (err) {
      toast.error("Failed to log out");
    }
  };

  if (isAuthenticated === null) {
    return <div className="min-h-screen flex items-center justify-center bg-gray-50">Loading...</div>;
  }

  if (!isAuthenticated) {
    return null; // Will redirect via useEffect
  }
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link to="/admin" className="text-xl font-bold text-blue-600 hover:text-blue-700 transition">
            SurveyAdmin
          </Link>
          <nav className="flex space-x-4">
            <Link to="/admin" className="text-gray-600 hover:text-gray-900 font-medium">Dashboard</Link>
            <Link to="/admin/survey/new" className="text-gray-600 hover:text-gray-900 font-medium">Create Survey</Link>
            <button 
              onClick={handleLogout}
              className="text-red-600 hover:text-red-700 font-medium flex items-center gap-1 ml-4 border-l border-gray-200 pl-4"
            >
              <LogOut size={16} /> Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet />
      </main>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="survey/new" element={<SurveyBuilder />} />
          <Route path="survey/:id/analytics" element={<SurveyAnalytics />} />
        </Route>

        <Route path="/survey/:id" element={<SurveyForm />} />
      </Routes>
      <Toaster position="top-right" />
    </BrowserRouter>
  );
}

export default App;
