import { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import { TimetableContext } from "../context/TimetableContext";

export default function LectureCard({
  title,
  professor,
  time,
  credit,
  year,
  category,
  capacity,
  enrolled,
  note,
  courseId,
  similarLectures,
}) {
  const navigate = useNavigate();
  const context = useContext(TimetableContext);
  const { timetables = [], addTimetable, addCoursesToTimetable } = context || {};
  
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showChatbotModal, setShowChatbotModal] = useState(false);
  const [chatbotQuestion, setChatbotQuestion] = useState("");
  const [selectedTimetableId, setSelectedTimetableId] = useState(null);

  const handleChatbotSubmit = () => {
    if (chatbotQuestion.trim()) {
      navigate("/chatbot", { state: { initialQuestion: chatbotQuestion } });
    }
  };

  return (
    <div className="lecture-card">
      <div className="lecture-title">{title}</div>

      <div className="lecture-info">
        <b>교수</b> {professor} &nbsp;&nbsp;
        <b>시간 / 강의실</b> {time}
      </div>

      <div className="lecture-info" style={{ marginTop: "6px" }}>
        <b>수강반번호</b> {courseId} &nbsp;&nbsp;
        <b>학년</b> {year} &nbsp;&nbsp;
        <b>학점</b> {credit} &nbsp;&nbsp;
        <b>이수구분</b> {category}
      </div>

      <div className="lecture-info" style={{ marginTop: "6px" }}>
        <b>정원</b> {capacity} &nbsp;&nbsp;
        <b>담은 인원</b> {enrolled} &nbsp;&nbsp;
        <b>비고</b> {note}
      </div>

      {similarLectures && similarLectures.length > 0 && (
        <div className="lecture-tags">
          <span>강의 추천</span>
          {similarLectures.map((lec, idx) => (
            <span key={idx}>{lec["과목명"] || lec[" 과목명"]}</span>
          ))}
        </div>
      )}

      <div className="card-icons">
        <button className="icon-btn" aria-label="시간표 보기" onClick={() => setShowTimetableModal(true)}>
          <img src="/icons/tab.svg" alt="시간표" className="icon-img" />
        </button>
        <button className="icon-btn" aria-label="챗봇에게 물어보기" onClick={() => setShowChatbotModal(true)}>
          <img src="/icons/robo.svg" alt="챗봇" className="icon-img" />
        </button>
      </div>

      {/* 시간표 추가 모달 */}
      {showTimetableModal && (
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
            width: 420,
            maxWidth: "90%",
          }}>
            <h3 style={{ marginTop: 0 }}>시간표에 추가</h3>
            <p style={{ marginTop: 8 }}>선택한 강의: {title}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
              <button 
                className="icon-btn" 
                style={{ background: "#2c2c2c", color: "white" }}
                onClick={() => {
                  const lectureData = {
                    "과목명": title,
                    "담당교수": professor,
                    "강의실 및 시간": time,
                  };
                  const newTimetableId = addTimetable("시간표 " + (timetables.length + 1));
                  addCoursesToTimetable(newTimetableId, [lectureData]);
                  navigate("/timetable", { state: { timetableId: newTimetableId } });
                  setShowTimetableModal(false);
                }}
              >
                새 시간표 만들기
              </button>
              <div style={{ background: "#f1f1f1", borderRadius: 8, padding: 8 }}>
                <p style={{ margin: 0, marginBottom: 8, fontWeight: 600 }}>시간표 선택</p>
                {timetables.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {timetables.map(t => (
                      <label key={t.id} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
                        <input 
                          type="radio" 
                          name="timetable" 
                          checked={selectedTimetableId === t.id}
                          onChange={() => setSelectedTimetableId(t.id)}
                        />
                        <span>{t.name}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: "12px", color: "#666" }}>시간표가 없습니다.</p>
                )}
              </div>
              <button 
                className="icon-btn" 
                style={{ background: "#2c2c2c", color: "white" }}
                disabled={!selectedTimetableId}
                onClick={() => {
                  if (selectedTimetableId) {
                    const lectureData = {
                      "과목명": title,
                      "담당교수": professor,
                      "강의실 및 시간": time,
                    };
                    addCoursesToTimetable(selectedTimetableId, [lectureData]);
                    navigate("/timetable", { state: { timetableId: selectedTimetableId, courses: [lectureData] } });
                    setShowTimetableModal(false);
                  }
                }}
              >
                리스트에서 선택한 후 시간표로 이동
              </button>
              <button className="icon-btn" onClick={() => setShowTimetableModal(false)}>단기</button>
            </div>
          </div>
        </div>
      )}

      {/* 챗봇 질문 모달 */}
      {showChatbotModal && (
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
            width: 420,
            maxWidth: "90%",
          }}>
            <h3 style={{ marginTop: 0 }}>챗봇에게 물어보기</h3>
            <p style={{ marginTop: 8, fontSize: 14, color: "#666" }}>
              "{title}" 강의에 대해 궁금한 점을 입력하세요.
            </p>
            <textarea
              value={chatbotQuestion}
              onChange={(e) => setChatbotQuestion(e.target.value)}
              placeholder="예: 이 수업 난이도가 어떤가요?"
              style={{
                width: "100%",
                height: 100,
                padding: 10,
                borderRadius: 8,
                border: "1px solid #ccc",
                fontSize: 14,
                fontFamily: "Pretendard, sans-serif",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />
            <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
              <button 
                className="icon-btn" 
                onClick={handleChatbotSubmit}
                disabled={!chatbotQuestion.trim()}
                style={{ 
                  flex: 1, 
                  background: chatbotQuestion.trim() ? "#2c2c2c" : "#868686",
                  color: "white"
                }}
              >
                물어보기
              </button>
              <button 
                className="icon-btn" 
                onClick={() => {
                  setShowChatbotModal(false);
                  setChatbotQuestion("");
                }}
                style={{ flex: 1 }}
              >
                닫기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}