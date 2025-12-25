// src/App.jsx
import { useEffect } from "react";
import { auth, db } from "./lib/firebase";

// src/App.jsx
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";

import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import FeedPage from "./pages/FeedPage";
import PostPage from "./pages/PostPage";
import CreatePostPage from "./pages/CreatePostPage";
import EditPostPage from "./pages/EditPostPage";
import ProfilePage from "./pages/ProfilePage";

function App() {
  return (
    <div className="min-h-screen bg-slate-900 text-white">
      {/* Top Navbar */}
      <Navbar />

      {/* Main content container */}
      <main className="max-w-3xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<FeedPage />} />
          <Route path="/post/:slug" element={<PostPage />} />
          <Route path="/create" element={<CreatePostPage />} />
          <Route path="/edit/:id" element={<EditPostPage />} />
          <Route path="/profile" element={<ProfilePage />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
