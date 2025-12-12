import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import LecturePage from "../pages/LecturePage";
import RecommendPage from "../pages/RecommendPage";
import ChatbotPage from "../pages/ChatbotPage";

// 나중에 만들 페이지들은 일단 임시 컴포넌트
const TimetablePage = () => <div style={{ color: "white" }}>시간표 페이지 준비중</div>;

export const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { path: "/", element: <LecturePage /> },         // 기본 페이지 = 강의 페이지
      { path: "/lectures", element: <LecturePage /> },
      { path: "/recommend", element: <RecommendPage /> },
      { path: "/timetable", element: <TimetablePage /> },
      { path: "/chatbot", element: <ChatbotPage /> },
    ],
  },
]);