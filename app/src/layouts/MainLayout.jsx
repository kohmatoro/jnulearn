import { Outlet } from "react-router-dom";
import TabMenu from "../components/TabMenu";
import "../styles/global.css";

export default function MainLayout() {
  return (
    <>
      <header className="page-title">
        <span>JNULearn</span>
        <TabMenu />
      </header>

      <Outlet />
    </>
  );
}