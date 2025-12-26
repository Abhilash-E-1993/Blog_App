// src/App.jsx
import { useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import { auth, db } from "./lib/firebase";

import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";

import RegisterPage from "./pages/RegisterPage";
import LoginPage from "./pages/LoginPage";
import FeedPage from "./pages/FeedPage";
import PostPage from "./pages/PostPage";
import CreatePostPage from "./pages/CreatePostPage";
import EditPostPage from "./pages/EditPostPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  // Optional: check Firebase wiring once
  useEffect(() => {
    console.log("Auth instance:", auth);
    console.log("DB instance:", db);
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50">
      <Navbar />

      <main className="max-w-3xl mx-auto px-4 py-6">
        <Routes>
          {/* Public routes */}
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <FeedPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/post/:slug"
            element={
              <ProtectedRoute>
                <PostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/create"
            element={
              <ProtectedRoute>
                <CreatePostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/edit/:id"
            element={
              <ProtectedRoute>
                <EditPostPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
