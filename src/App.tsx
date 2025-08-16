import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Home from "./pages/Home";
import TextTranslate from "./pages/TextTranslate";
import CameraTranslate from "./pages/CameraTranslate";
import AudioTranslate from "./pages/AudioTranslate";
import InterfaceOverlay from "./pages/InterfaceOverlay";
import History from "./pages/History";
import Settings from "./pages/Settings";
import LanguageSettings from "./pages/LanguageSettings";
import Profile from "./pages/Profile";
import Login from "./pages/Login";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/text-translate" element={<TextTranslate />} />
        <Route path="/camera-translate" element={<CameraTranslate />} />
        <Route path="/audio-translate" element={<AudioTranslate />} />
        <Route path="/overlay" element={<InterfaceOverlay />} />
        <Route path="/history" element={<History />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/language-settings" element={<LanguageSettings />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/login" element={<Login />} />
      </Routes>
      <Toaster 
        position="top-center"
        richColors
        closeButton
      />
    </Router>
  );
}
