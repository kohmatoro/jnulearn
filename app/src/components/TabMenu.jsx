import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

export default function TabMenu() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const tabs = [
    { name: "강의", path: "/lectures" },
    { name: "시간표", path: "/timetable" },
    { name: "챗봇", path: "/chatbot" },
    { name: "추천", path: "/recommend" }
  ];

  const getActiveTab = () => {
    const tab = tabs.find(t => location.pathname === t.path);
    return tab ? tab.name : "강의";
  };

  const [activeTab, setActiveTab] = useState(getActiveTab());

  const handleTabClick = (tab) => {
    setActiveTab(tab.name);
    navigate(tab.path);
  };

  return (
    <nav className="tab-menu">
      {tabs.map((tab) => (
        <button 
          className={`tab-btn ${activeTab === tab.name ? "active" : ""}`}
          key={tab.name}
          onClick={() => handleTabClick(tab)}
        >
          {tab.name}
        </button>
      ))}
    </nav>
  );
}