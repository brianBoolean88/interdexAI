import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import SessionPage from "./pages/SessionPage";
import ResultsPage from "./pages/ResultsPage";
import CreatedPage from "./pages/Created";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/created" element={<CreatedPage />} />
      <Route path="/session/:id" element={<SessionPage />} />
      <Route path="/results/:id" element={<ResultsPage />} />
    </Routes>
  );
}
