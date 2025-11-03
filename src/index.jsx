import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import ErrorBoundary from "./ErrorBoundary";
import logger from "./utils/logger";
import "./styles.css";

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Zendesk App Framework client
  if (window.ZAFClient) {
    const client = window.ZAFClient.init();
    logger.log("[Zapdesk] ZAFClient initialized");

    // Mount React App inside the root element, wrapped in ErrorBoundary
    const root = createRoot(document.getElementById("root"));
    root.render(
      <ErrorBoundary>
        <App client={client} />
      </ErrorBoundary>
    );
  } else {
    logger.error(
      "[Zapdesk] ZAFClient not found. Check iframe.html script include."
    );
  }
});
