import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";
import Home from "./pages/Home";
// Lazy-load Chats to avoid evaluating heavy Solana/Anchor deps on initial load
const Chats = lazy(() => import("./pages/Chats"));

function App() {
  return (
  <Suspense fallback={<div className="p-4">Loading…</div>}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/chats" element={<Chats />} />
      </Routes>
    </Suspense>
  );
}

export default App;
