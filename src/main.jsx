// src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./index.css";
import { AuthProvider } from "./context/AuthContext.jsx";
import { ChatUnreadProvider } from "./context/ChatUnreadContext.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ChatUnreadProvider>
          <App />
        </ChatUnreadProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
