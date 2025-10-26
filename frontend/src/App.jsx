import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";
import LandingPage from "./pages/LandingPage";
import ResultsPage from "./pages/ResultsPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/create" element={<HomePage />} />
      <Route path="/session/:id" element={<SessionPage />} />
      <Route path="/results/:id" element={<ResultsPage />} />
    </Routes>
  );
}
