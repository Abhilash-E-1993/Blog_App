// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import FeedPage from "./pages/FeedPage";
import CreatePostPage from "./pages/CreatePostPage";
import ProfilePage from "./pages/ProfilePage";
import PostPage from "./pages/PostPage";
import EditPostPage from "./pages/EditPostPage";   // <-- add this
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifiedLandingPage from "./pages/VerifiedLandingPage";
import ProtectedRoute from "./components/ProtectedRoute";

export default function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 py-6">
        <Routes>
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
            path="/edit/:id"                 // <-- this fixes the Edit blank page
            element={
              <ProtectedRoute>
                <EditPostPage />
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
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />

          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verified" element={<VerifiedLandingPage />} />
        </Routes>
      </main>
    </div>
  );
}
