import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// Wait until DOM is ready
document.addEventListener("DOMContentLoaded", () => {
  // Initialize Zendesk App Framework client
  if (window.ZAFClient) {
    const client = window.ZAFClient.init();
    console.log("[Zapdesk] ZAFClient initialized");

    // Mount React App inside the root element
    const root = createRoot(document.getElementById("root"));
    root.render(<App client={client} />);
  } else {
    console.error(
      "[Zapdesk] ZAFClient not found. Check iframe.html script include."
    );
  }
});
