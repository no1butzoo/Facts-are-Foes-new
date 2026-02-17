import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import FactDetailPage from "./pages/FactDetailPage";
import SubmitFactPage from "./pages/SubmitFactPage";
import ProfilePage from "./pages/ProfilePage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/fact/:id" element={<FactDetailPage />} />
            <Route path="/submit" element={<SubmitFactPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
          </Routes>
        </Layout>
        <Toaster position="bottom-right" theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
