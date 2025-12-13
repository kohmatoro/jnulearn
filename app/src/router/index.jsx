import { createBrowserRouter } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";

import LecturePage from "../pages/LecturePage";
import RecommendPage from "../pages/RecommendPage";
import ChatbotPage from "../pages/ChatbotPage";
import TimetablePage from "../pages/TimetablePage";

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