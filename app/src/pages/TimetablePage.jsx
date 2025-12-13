import React, { useState, useEffect, useContext } from "react";
import { useLocation } from "react-router-dom";
import { TimetableContext } from "../context/TimetableContext";

const DAYS = ["월", "화", "수", "목", "금", "토"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
const COLORS = ["#FFD6D6", "#FFF4BD", "#D4F0F0", "#D6E4FF", "#E8D9FF", "#FFD9FA"];

export default function TimetablePage() {
  const location = useLocation();
  const context = useContext(TimetableContext);
  const { timetables = [], setTimetables, removeCourseFromTimetable } = context || {};

  const [semester, setSemester] = useState("2025년 1학기");
  const [currentTimetableId, setCurrentTimetableId] = useState(() => {
    // location.state에서 timetableId가 있으면 사용, 없으면 기본값
    return location.state?.timetableId || timetables[0]?.id || 1;
  });
  const [events, setEvents] = useState([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [settingsAction, setSettingsAction] = useState(null); // 'setDefault' | 'delete'
  const [selectedDeleteTimetableId, setSelectedDeleteTimetableId] = useState(null);
  const [showCourseDeleteModal, setShowCourseDeleteModal] = useState(false);
  const [selectedCourseToDelete, setSelectedCourseToDelete] = useState(null);

  // location.state.courses가 있으면 그것을 한 번만 Context에 저장 (초기 로드 시)
  useEffect(() => {
    if (location.state?.courses && location.state.courses.length > 0) {
      // 새 시간표가 방금 만들어진 경우, courses를 Context에 저장
      const currentTimetable = timetables.find(t => t.id === currentTimetableId);
      if (currentTimetable && currentTimetable.courses.length === 0) {
        // 아직 courses가 없으면 location.state에서 추가
        setTimetables(prev =>
          prev.map(t => {
            if (t.id === currentTimetableId) {
              return { ...t, courses: location.state.courses };
            }
            return t;
          })
        );
      }
    }
  }, []); // 마운트 시에만 한 번 실행

  // Context의 현재 시간표 courses를 events로 변환
  useEffect(() => {
    const currentTimetable = timetables.find(t => t.id === currentTimetableId);
    
    if (currentTimetable && currentTimetable.courses && currentTimetable.courses.length > 0) {
      const convertedEvents = [];
      currentTimetable.courses.forEach((course, idx) => {
        const title = course["과목명"] || course[" 과목명"] || "";
        const credit = course["학점"] || course[" 학점"] || 0;
        const placeTime = course["강의실 및 시간"] || course[" 강의실 및 시간"] || course["강의실및시간"] || "";
        const color = COLORS[idx % COLORS.length];

        const parsed = parseTimeLocation(placeTime);
        parsed.forEach((p, pIdx) => {
          convertedEvents.push({
            id: `timetable-${currentTimetableId}-${idx}-${pIdx}`,
            name: title,
            credit: credit,
            day: p.day,
            period: p.period,
            duration: p.duration,
            place: p.classroom,
            color: color,
          });
        });
      });
      setEvents(convertedEvents);
    } else {
      setEvents([]);
    }
  }, [currentTimetableId, timetables]);

  const parseTimeLocation = (rawStr) => {
    if (!rawStr) return [];
    const result = [];
    const parts = rawStr.split("/");

    parts.forEach(part => {
      const day = DAYS.find(d => part.includes(d));
      if (!day) return;

      const placeMatch = part.match(/\(([^)]+)\)/);
      const classroom = placeMatch ? placeMatch[1] : "";

      const nums = part.match(/\d+/g);
      if (nums) {
        const periods = nums.map(Number).filter(n => n < 20);
        if (periods.length > 0) {
          const minP = Math.min(...periods);
          const maxP = Math.max(...periods);
          result.push({
            day,
            period: minP,
            duration: (maxP - minP) + 1,
            classroom,
          });
        }
      }
    });
    return result;
  };

  const createNewTimetable = (customName) => {
    const name = customName || window.prompt("새 시간표 이름을 입력하세요:");
    if (name) {
      const newId = Math.max(...timetables.map(t => t.id), 0) + 1;
      setTimetables([...timetables, { id: newId, name, credits: 0, courses: [] }]);
      setCurrentTimetableId(newId);
      setEvents([]);
    }
  };

  const removeCourse = (courseName) => {
    removeCourseFromTimetable(currentTimetableId, courseName);
    setShowCourseDeleteModal(false);
    setSelectedCourseToDelete(null);
  };

  // 현재 시간표의 총 학점 계산
  const calculateTotalCredits = () => {
    const currentTimetable = timetables.find(t => t.id === currentTimetableId);
    if (!currentTimetable || !currentTimetable.courses) return 0;
    
    return currentTimetable.courses.reduce((total, course) => {
      const credit = Number(course["학점"] || course[" 학점"] || 0);
      return total + credit;
    }, 0);
  };

  const totalCredits = calculateTotalCredits();

  const deleteTimetable = (id) => {
    if (timetables.length === 1) {
      alert("마지막 시간표는 삭제할 수 없습니다.");
      return;
    }
    if (window.confirm("이 시간표를 삭제하시겠습니까?")) {
      const filtered = timetables.filter(t => t.id !== id);
      setTimetables(filtered);
      if (currentTimetableId === id) {
        setCurrentTimetableId(filtered[0].id);
        setEvents([]);
      }
    }
  };

  const currentTimetable = timetables.find(t => t.id === currentTimetableId);

  return (
    <div className="timetable-page">
      {/* 사이드바 */}
      <aside className="timetable-sidebar">
        {/* 학기 선택 */}
        <div className="sidebar-section">
          <label className="sidebar-label">학기 선택</label>
          <select value={semester} onChange={(e) => setSemester(e.target.value)} className="semester-select">
            <option>2024년 2학기</option>
            <option>2025년 1학기</option>
            <option>2025년 2학기</option>
          </select>
        </div>

        {/* 시간표 카드 */}
        <div className="sidebar-section">
          <div className="timetable-card">
            <div className="card-header">
              <h3 className="card-title">시간표</h3>
              <button className="icon-btn settings-btn" onClick={() => setShowSettingsModal(true)}>
                <img src="/icons/settings.svg" alt="settings" className="icon-img" />
              </button>
            </div>
            <div className="card-content">
              <div className="credits-display">{totalCredits}학점</div>
            </div>
            <div className="card-footer">
              {timetables.map(t => (
                <button
                  key={t.id}
                  className={`timetable-tab ${t.id === currentTimetableId ? "active" : ""}`}
                  onClick={() => setCurrentTimetableId(t.id)}
                >
                  {t.name}
                </button>
              ))}
            </div>
          </div>
        </div>

      </aside>

      {/* 메인 시간표 영역 */}
      <main className="timetable-main">
        <div className="timetable-header">
          <h2 className="timetable-title">{semester} 시간표</h2>
        </div>

        <div className="timetable-grid">
          {/* 코너 셀 */}
          <div className="grid-corner"></div>

          {/* 요일 헤더 */}
          {DAYS.map(day => (
            <div key={day} className="grid-header">
              {day}
            </div>
          ))}

          {/* 교시 및 셀 */}
          {PERIODS.map((period, periodIndex) => (
            <React.Fragment key={period}>
              <div className="grid-time">{period}교시</div>
              {DAYS.map((day, dayIndex) => (
                <div
                  key={`${day}-${period}`}
                  className="grid-cell"
                  style={{
                    gridColumn: dayIndex + 2,
                    gridRow: periodIndex + 2,
                  }}
                />
              ))}
            </React.Fragment>
          ))}

          {/* 강의 블록 */}
          {events.map(evt => {
            const dayIndex = DAYS.indexOf(evt.day);
            if (dayIndex === -1) return null;

            return (
              <div
                key={evt.id}
                className="event-card"
                onClick={() => {
                  setSelectedCourseToDelete(evt);
                  setShowCourseDeleteModal(true);
                }}
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: `${evt.period + 1} / span ${evt.duration}`,
                  backgroundColor: evt.color,
                }}
              >
                <div className="event-name">{evt.name}</div>
                <div className="event-credit">{evt.credit}학점</div>
                <div className="event-place">{evt.place}</div>
              </div>
            );
          })}
        </div>
      </main>

      {/* 설정 모달 */}
      {showSettingsModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            width: 340,
            maxWidth: "90%",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 20 }}>시간표 설정</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <button 
                className="icon-btn" 
                style={{ background: "#2c2c2c", color: "white", textAlign: "left", paddingLeft: 12 }}
                onClick={() => {
                  setSettingsAction("addNew");
                }}
              >
                + 새 시간표 추가
              </button>
              <button 
                className="icon-btn" 
                style={{ background: "#2c2c2c", color: "white", textAlign: "left", paddingLeft: 12 }}
                onClick={() => {
                  setSettingsAction("setDefault");
                }}
              >
                기본 시간표 설정
              </button>
              <button 
                className="icon-btn" 
                style={{ background: "#2c2c2c", color: "white", textAlign: "left", paddingLeft: 12 }}
                onClick={() => {
                  setSettingsAction("delete");
                }}
              >
                시간표 삭제
              </button>
            </div>
            <button 
              className="icon-btn" 
              style={{ width: "100%", marginTop: 12 }}
              onClick={() => {
                setShowSettingsModal(false);
                setSettingsAction(null);
              }}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {/* 새 시간표 추가 모달 */}
      {settingsAction === "addNew" && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            width: 340,
            maxWidth: "90%",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>새 시간표 추가</h3>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: 12 }}>
              새로운 시간표 이름을 입력하세요.
            </p>
            <input
              type="text"
              placeholder="시간표 이름 (예: 2025-1 시간표)"
              style={{
                width: "100%",
                padding: "10px 12px",
                border: "1px solid #ddd",
                borderRadius: 6,
                fontSize: "14px",
                marginBottom: 12,
                boxSizing: "border-box",
              }}
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  const name = e.target.value.trim();
                  if (name) {
                    createNewTimetable(name);
                    setSettingsAction(null);
                    setShowSettingsModal(false);
                  }
                }
              }}
              id="new-timetable-name"
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                className="icon-btn" 
                style={{ flex: 1, background: "#2c2c2c", color: "white" }}
                onClick={() => {
                  const input = document.getElementById("new-timetable-name");
                  const name = input.value.trim();
                  if (name) {
                    createNewTimetable(name);
                    setSettingsAction(null);
                    setShowSettingsModal(false);
                  } else {
                    alert("시간표 이름을 입력하세요.");
                  }
                }}
              >
                추가
              </button>
              <button 
                className="icon-btn" 
                style={{ flex: 1 }}
                onClick={() => {
                  setSettingsAction(null);
                  setShowSettingsModal(false);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 기본 시간표 설정 모달 */}
      {settingsAction === "setDefault" && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            width: 340,
            maxWidth: "90%",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>기본 시간표 선택</h3>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: 12 }}>
              매 학기 시작 시 기본으로 사용할 시간표를 선택하세요.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
              {timetables.map(t => (
                <label key={t.id} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: 8, 
                  padding: "10px 12px",
                  border: "1px solid #ddd",
                  borderRadius: 6,
                  cursor: "pointer",
                  background: t.id === currentTimetableId ? "#f5f5f5" : "white",
                }}>
                  <input 
                    type="radio" 
                    name="default-timetable" 
                    checked={t.id === currentTimetableId}
                    onChange={() => setCurrentTimetableId(t.id)}
                  />
                  <span style={{ flex: 1 }}>{t.name}</span>
                </label>
              ))}
            </div>
            <button 
              className="icon-btn" 
              style={{ background: "#2c2c2c", color: "white", width: "100%" }}
              onClick={() => {
                setSettingsAction(null);
                setShowSettingsModal(false);
              }}
            >
              완료
            </button>
          </div>
        </div>
      )}

      {/* 시간표 삭제 모달 */}
      {settingsAction === "delete" && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1001,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            width: 340,
            maxWidth: "90%",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>시간표 삭제</h3>
            {timetables.length === 1 ? (
              <p style={{ fontSize: "13px", color: "#666", marginBottom: 16 }}>
                최소 1개 이상의 시간표가 필요합니다.
              </p>
            ) : (
              <div>
                <p style={{ fontSize: "13px", color: "#666", marginBottom: 12 }}>
                  삭제할 시간표를 선택하세요.
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
                  {timetables.map(t => (
                    <label key={t.id} style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: 8, 
                      padding: "10px 12px",
                      border: "1px solid #ddd",
                      borderRadius: 6,
                      cursor: "pointer",
                      opacity: timetables.length === 1 ? 0.5 : 1,
                    }}>
                      <input 
                        type="radio" 
                        name="delete-timetable" 
                        checked={selectedDeleteTimetableId === t.id}
                        onChange={() => setSelectedDeleteTimetableId(t.id)}
                        disabled={timetables.length === 1}
                      />
                      <span style={{ flex: 1 }}>{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                className="icon-btn" 
                style={{ flex: 1, background: "#2c2c2c", color: "white" }}
                disabled={timetables.length === 1 || !selectedDeleteTimetableId}
                onClick={() => {
                  if (selectedDeleteTimetableId) {
                    deleteTimetable(selectedDeleteTimetableId);
                    setSelectedDeleteTimetableId(null);
                    setSettingsAction(null);
                    setShowSettingsModal(false);
                  }
                }}
              >
                삭제
              </button>
              <button 
                className="icon-btn" 
                style={{ flex: 1 }}
                onClick={() => {
                  setSettingsAction(null);
                  setShowSettingsModal(false);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 과목 삭제 확인 모달 */}
      {showCourseDeleteModal && selectedCourseToDelete && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1002,
        }}>
          <div style={{
            background: "#fff",
            borderRadius: 12,
            padding: 20,
            width: 340,
            maxWidth: "90%",
          }}>
            <h3 style={{ marginTop: 0, marginBottom: 16 }}>과목 삭제</h3>
            <p style={{ fontSize: "14px", color: "#333", marginBottom: 8 }}>
              <strong>{selectedCourseToDelete.name}</strong>
            </p>
            <p style={{ fontSize: "13px", color: "#666", marginBottom: 16 }}>
              {selectedCourseToDelete.place && `${selectedCourseToDelete.place} · `}
              {selectedCourseToDelete.day}요일 {selectedCourseToDelete.period}교시
            </p>
            <p style={{ fontSize: "13px", color: "#999", marginBottom: 16 }}>
              이 과목을 시간표에서 삭제하시겠습니까?
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button 
                className="icon-btn" 
                style={{ flex: 1, background: "#d32f2f", color: "white" }}
                onClick={() => removeCourse(selectedCourseToDelete.name)}
              >
                삭제
              </button>
              <button 
                className="icon-btn" 
                style={{ flex: 1 }}
                onClick={() => {
                  setShowCourseDeleteModal(false);
                  setSelectedCourseToDelete(null);
                }}
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}