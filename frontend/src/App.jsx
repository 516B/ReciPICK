import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import CategoryPage from './pages/CategoryPage';
import RecipePage from './pages/RecipePage';
import ChatPage from './pages/ChatPage';
import MyPage from "./pages/MyPage";
import BookmarkPage from "./pages/BookmarkPage";
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/category" element={<CategoryPage />} /> 
      <Route path="/recipe/:id" element={<RecipePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/bookmarks" element={<BookmarkPage />} />
      <Route path="/mypage" element={<MyPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
    </Routes>
  );
}

export default App;
