
import { hydrateRoot, createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.tsx";
import "./index.css";

// Handle GitHub Pages SPA redirect
const redirect = sessionStorage.getItem('redirect');
if (redirect) {
  sessionStorage.removeItem('redirect');
  window.history.replaceState(null, '', redirect);
}

const rootElement = document.getElementById("root")!;

const AppWithRouter = () => (
  <BrowserRouter basename="/chatpulse">
    <App />
  </BrowserRouter>
);

if (rootElement.hasChildNodes()) {
  hydrateRoot(rootElement, <AppWithRouter />);
} else {
  createRoot(rootElement).render(<AppWithRouter />);
}  