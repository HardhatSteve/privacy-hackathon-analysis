import type { FC } from "react";
import Navbar from "./components/Navbar";
import Pool from "./pages/Pool";

const App: FC = () => {
  return (
    <div className="bg-[#111] min-h-screen text-white">
      <Navbar />
      <Pool />
    </div>
  );
};

export default App;
