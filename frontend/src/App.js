import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import HomePage from "./pages/HomePage";
import ExplorePage from "./pages/ExplorePage";
import FactDetailPage from "./pages/FactDetailPage";
import SubmitFactPage from "./pages/SubmitFactPage";
import ProfilePage from "./pages/ProfilePage";
import AdminPage from "./pages/AdminPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import { SubscriptionSuccessPage, SubscriptionCancelPage } from "./pages/SubscriptionPages";
import FFTCoursePage from "./pages/FFTCoursePage";
import PredictiveAnalyticsPage from "./pages/PredictiveAnalyticsPage";
import FrequencyCipherPage from "./pages/FrequencyCipherPage";
import ProjectThyselfPage from "./pages/ProjectThyselfPage";
import IntelPortalPage from "./pages/IntelPortalPage";
import InvisibleHandPage from "./pages/InvisibleHandPage";
import StarfieldBackground from "./components/StarfieldBackground";
import GameMasterManifestoPage from "./pages/GameMasterManifestoPage";
import NetworkPingWidget from "./components/NetworkPingWidget";
import RedirectPage from "./pages/RedirectPage";
import "./App.css";

function App() {
  return (
    <AuthProvider>
        <NetworkPingWidget />
      <BrowserRouter>
        <StarfieldBackground />
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/fact/:id" element={<FactDetailPage />} />
            <Route path="/submit" element={<SubmitFactPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/profile/:userId" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
            <Route path="/subscription/cancel" element={<SubscriptionCancelPage />} />
            <Route path="/fft-course" element={<FFTCoursePage />} />
            <Route path="/predictive-analytics" element={<PredictiveAnalyticsPage />} />
            <Route path="/frequency-cipher" element={<FrequencyCipherPage />} />
            <Route path="/project-thyself" element={<ProjectThyselfPage />} />
            <Route path="/intel-portal" element={<IntelPortalPage />} />
            <Route path="/invisible-hand" element={<InvisibleHandPage />} />
          </Routes>
            <Route path="/s/:shortCode" element={<RedirectPage />} />
            <Route path="/game-master-manifesto" element={<GameMasterManifestoPage />} />
        </Layout>
        <Toaster position="bottom-right" theme="dark" />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
