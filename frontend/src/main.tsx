import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Optional Sentry initialization (no-op if VITE_SENTRY_DSN is absent)
try {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (dsn) {
    // dynamic import to avoid bundling if unused
    // @ts-ignore
    import("@sentry/react").then(({ init, BrowserTracing }) => {
      init({
        dsn,
        integrations: [new BrowserTracing()],
        tracesSampleRate: 0.1,
        environment: import.meta.env.MODE,
      });
    });
  }
} catch (_) {}

createRoot(document.getElementById("root")!).render(<App />);
