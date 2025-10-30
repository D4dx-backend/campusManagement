import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initializeMasterData } from "./utils/initializeData";

// Initialize default master data
initializeMasterData();

createRoot(document.getElementById("root")!).render(<App />);
