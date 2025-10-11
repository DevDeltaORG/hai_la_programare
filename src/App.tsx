import { useState, useEffect } from "react";
import { GoogleOAuthProvider, googleLogout } from "@react-oauth/google";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Link } from "react-router-dom";
import Index from "./pages/Index";
import StudentsPage from "./pages/StudentsPage.tsx";
import TeamForm from "./pages/TeamForm";
import TeamDashboard from "./pages/TeamDashboard";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

interface GoogleUser {
  name: string;
  email: string;
  picture: string;
  sub: string;
}

const App = () => {
  const [user, setUser] = useState<GoogleUser | null>(
      JSON.parse(localStorage.getItem("currentUser") || "null")
  );

  const [countdown, setCountdown] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    const targetDate = new Date("2025-10-30T00:00:00").getTime();

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance <= 0) {
        clearInterval(interval);
        setCountdown({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const days = Math.floor(distance / (1000 * 60 * 60 * 24));
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);

      setCountdown({ days, hours, minutes, seconds });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    googleLogout();
    localStorage.removeItem("currentUser");
    setUser(null);
  };

  return (
      <GoogleOAuthProvider clientId="723092660993-7e0vfrumsmb9e71o7a0i9h1c6vmg707r.apps.googleusercontent.com">
        <QueryClientProvider client={queryClient}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <div className="flex flex-col min-h-screen bg-gray-900 text-gray-100">
                {/* TopBar */}
                <header className="bg-gray-800 text-gray-100 shadow-md w-full py-6 px-6 flex flex-col items-center">
                  <Link to="/" className="text-3xl font-extrabold hover:text-blue-400 transition-colors text-center">
                    Concurs Hai la Programare!
                  </Link>

                  <div
                      className="mt-3 bg-gray-700 text-white text-center py-2 px-4 rounded-full font-semibold text-sm shadow-lg animate-pulse">
                    ⏰ Înscrierile se închid
                    în: {countdown.days} zile, {countdown.hours}h {countdown.minutes}m {countdown.seconds}s
                  </div>

                  <p className="mt-2 text-gray-300 text-center max-w-md">
                    Participă acum și alătură-te echipelor pentru a câștiga premii și experiență valoroasă! 🏆
                  </p>
                </header>


                {/* Main Content */}
                <main className="flex-1 p-6">
                  <Routes>
                    <Route path="/" element={<Index/>}/>
                    <Route path="/students" element={<StudentsPage/>}/>
                    <Route path="/team/:teamId/form" element={<TeamForm/>}/>
                    <Route path="/team/:teamId" element={<TeamDashboard/>}/>
                    <Route path="/admin" element={<Admin/>}/>
                    <Route path="*" element={<NotFound/>}/>
                    <Route path="/privacy-policy" element={<PrivacyPolicy/>}/>
                  </Routes>
                </main>

                {/* Footer */}
                <footer
                    className="bg-gray-800 text-gray-400 py-10 mt-auto w-full flex flex-col items-center text-sm space-y-2">
                  <p>Prof. coordonator: Cristian Rusu</p>
                  <p>Email: <a href="mailto:cristi.gabriel.rusu@gmail.com"
                               className="hover:text-white transition-colors">cristi.gabriel.rusu@gmail.com</a></p>
                  <p className="mt-2">&copy; {new Date().getFullYear()} Platforma Studenți</p>
                </footer>

              </div>
            </BrowserRouter>
          </TooltipProvider>
        </QueryClientProvider>
      </GoogleOAuthProvider>
  );
};

export default App;
