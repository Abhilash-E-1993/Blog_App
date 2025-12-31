// src/App.jsx
import { Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

// Lazy pages
const FeedPage = lazy(() => import("./pages/FeedPage"));
const CreatePostPage = lazy(() => import("./pages/CreatePostPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const PostPage = lazy(() => import("./pages/PostPage"));
const EditPostPage = lazy(() => import("./pages/EditPostPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const VerifiedLandingPage = lazy(() => import("./pages/VerifiedLandingPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const SearchAccountsPage = lazy(() => import("./pages/SearchAccountsPage"));
const ChatsListPage = lazy(() => import("./pages/ChatsListPage"));
const ChatPage = lazy(() => import("./pages/ChatPage"));

// Non‑lazy components
import ProtectedRoute from "./components/ProtectedRoute";
import MainLayout from "./components/MainLayout";
import ChatLayout from "./pages/ChatLayout";

export default function App() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-950">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-emerald-500/70 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-300 text-sm">Loading BharatBlog...</p>
          </div>
        </div>
      }
    >
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

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <MainLayout>
                <SearchAccountsPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Public profile for any user (still behind auth) */}
        <Route
          path="/u/:uid"
          element={
            <ProtectedRoute>
              <MainLayout>
                <UserProfilePage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Chats list WITH navbar */}
        <Route
          path="/chats"
          element={
            <ProtectedRoute>
              <MainLayout>
                <ChatsListPage />
              </MainLayout>
            </ProtectedRoute>
          }
        />

        {/* Single chat WITHOUT navbar – full immersive chat */}
        <Route
          path="/chat/:conversationId"
          element={
            <ProtectedRoute>
              <ChatLayout>
                <ChatPage />
              </ChatLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
}
