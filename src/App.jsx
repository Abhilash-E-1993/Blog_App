// src/App.jsx
import { Routes, Route } from "react-router-dom";

import FeedPage from "./pages/FeedPage";
import CreatePostPage from "./pages/CreatePostPage";
import ProfilePage from "./pages/ProfilePage";
import PostPage from "./pages/PostPage";
import EditPostPage from "./pages/EditPostPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import VerifiedLandingPage from "./pages/VerifiedLandingPage";
import LandingPage from "./pages/LandingPage";

import ProtectedRoute from "./components/ProtectedRoute"; // note: routes folder
import MainLayout from "./components/MainLayout";

export default function App() {
  return (
    <Routes>
      {/* Public routes WITHOUT navbar */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verified" element={<VerifiedLandingPage />} />

      {/* Protected app routes WITH navbar */}
      <Route
        path="/feed"
        element={
          <ProtectedRoute>
            <MainLayout>
              <FeedPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/post/:slug"
        element={
          <ProtectedRoute>
            <MainLayout>
              <PostPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/edit/:id"
        element={
          <ProtectedRoute>
            <MainLayout>
              <EditPostPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/create"
        element={
          <ProtectedRoute>
            <MainLayout>
              <CreatePostPage />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <MainLayout>
              <ProfilePage />
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
