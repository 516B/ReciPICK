import { Routes, Route } from 'react-router-dom';
import MainPage from './pages/MainPage';
import CategoryPage from './pages/CategoryPage';
import RecipePage from './pages/RecipePage';
import ChatPage from './pages/ChatPage';
import MyPage from "./pages/MyPage";
import BookmarkPage from "./pages/BookmarkPage";

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainPage />} />
      <Route path="/category" element={<CategoryPage />} /> 
      <Route path="/recipe/:id" element={<RecipePage />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/bookmarks" element={<BookmarkPage />} />
      <Route path="/mypage" element={<MyPage />} />
    </Routes>
  );
}

export default App;
