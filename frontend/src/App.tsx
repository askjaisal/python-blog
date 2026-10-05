import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import Posts from "./pages/Post";
import Home from "./pages/Home"
import CreatePost from "./pages/CreatePost";
import PostDetail from "./pages/PostDetail";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/home" element={<Home />} />
        <Route path="/posts/create" element={<CreatePost />} />
        <Route path="/posts/:postId/edit" element={<CreatePost />} />
        <Route path="/posts/:postId" element={<PostDetail />} />
        <Route path="/posts" element={<Posts />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;