import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom"; // 🔥 [추가] 데이터 받기용

const DAYS = ["월", "화", "수", "목", "금"];
const TIMES = [9, 10, 11, 12, 13, 14, 15, 16, 17, 18];
const COLORS = ["#FFD6D6", "#FFF4BD", "#D4F0F0", "#D6E4FF", "#E8D9FF", "#FFD9FA"];

export default function Timetable() {
  const location = useLocation(); // 🔥 [추가] 라우터로 전달된 데이터 받기
  
  // 초기 데이터 (기본값)
  const [events, setEvents] = useState([
    { id: 1, name: "자료구조", day: "월", time: 9, duration: 2, place: "공학3관", color: COLORS[0] },
    { id: 2, name: "인공지능", day: "수", time: 13, duration: 3, place: "IT관", color: COLORS[3] },
  ]);

  // 🔥 [추가] RecommendPage에서 넘어온 데이터가 있으면 처리하는 로직
  useEffect(() => {
    // location.state에 lectures가 담겨 있으면 실행
    if (location.state && location.state.lectures) {
      const newEvents = [];
      const incomingLectures = location.state.lectures;

      incomingLectures.forEach((lec, idx) => {
        // 데이터에서 필요한 정보 추출
        const title = lec["과목명"] || lec[" 과목명"];
        const placeTime = lec["강의실 및 시간"] || lec[" 강의실 및 시간"] || lec["강의실및시간"] || "";
        // 색상은 랜덤으로 지정
        const color = COLORS[idx % COLORS.length]; 

        // 시간 파싱 ("월3,4 / 수2" 같은 문자열을 분석)
        const parsed = parseTimeLocation(placeTime);
        
        parsed.forEach((p) => {
          newEvents.push({
            id: Date.now() + Math.random(), // 고유 ID 생성
            name: title,
            day: p.day,
            time: p.startTime, // 교시를 실제 시간(9, 10...)으로 변환 필요 시 로직 수정
            duration: p.duration,
            place: p.classroom,
            color: color,
          });
        });
      });

      // 기존 데이터 덮어쓰기 (새 시간표로 교체)
      if (newEvents.length > 0) {
        setEvents(newEvents);
      }
    }
  }, [location.state]);

  // 🔥 [추가] "월3,4(301호)" 같은 문자열을 파싱하는 도구 함수
  const parseTimeLocation = (rawStr) => {
    if (!rawStr) return [];
    
    const result = [];
    // 예: "월3,4(IT관)/수2(공학관)" -> "/"로 분리
    const parts = rawStr.split("/"); 

    parts.forEach(part => {
        // 요일 찾기
        const day = DAYS.find(d => part.includes(d));
        if (!day) return;

        // 강의실 찾기 (괄호 안 내용)
        const placeMatch = part.match(/\(([^)]+)\)/);
        const classroom = placeMatch ? placeMatch[1] : "";

        // 숫자(교시) 찾기
        const nums = part.match(/\d+/g);
        if (nums) {
            const periods = nums.map(Number).filter(n => n < 20); // 301호 같은 호수 제외하고 교시만 (단순 처리)
            if (periods.length > 0) {
                const minP = Math.min(...periods);
                const maxP = Math.max(...periods);
                // 학교 1교시가 9시라고 가정: (교시 + 8 = 실제 시간)
                // 예: 1교시 -> 9시, 2교시 -> 10시
                result.push({
                    day,
                    startTime: minP + 8, 
                    duration: (maxP - minP) + 1,
                    classroom
                });
            }
        }
    });
    return result;
  };

  const addClass = (dayIndex, time) => {
    const name = window.prompt(`${DAYS[dayIndex]}요일 ${time}시에 추가할 강의명을 입력하세요:`);
    if (!name) return;
    const place = window.prompt("강의실을 입력하세요 (선택):") || "";
    const duration = parseInt(window.prompt("강의 시간(시간 단위):", "1"), 10) || 1;
    const randomColor = COLORS[Math.floor(Math.random() * COLORS.length)];

    const newEvent = {
      id: Date.now(),
      name,
      day: DAYS[dayIndex],
      time,
      duration,
      place,
      color: randomColor,
    };
    setEvents([...events, newEvent]);
  };

  const removeClass = (id) => {
    if (window.confirm("이 강의를 삭제하시겠습니까?")) {
      setEvents(events.filter((evt) => evt.id !== id));
    }
  };

  return (
    <div className="timetable-container">
      <h2 className="timetable-title">2025년 1학기 시간표</h2>
      <p className="timetable-desc">
        * 추천 페이지에서 넘어온 시간표입니다. 빈 칸을 클릭하면 직접 추가할 수도 있습니다.
      </p>

      <div className="timetable-grid">
        <div className="grid-corner"></div>
        {DAYS.map((day, i) => (
          <div key={day} className="grid-header" style={{ gridColumn: i + 2, gridRow: 1 }}>
            {day}
          </div>
        ))}

        {TIMES.map((time, timeIndex) => (
          <React.Fragment key={time}>
            <div className="grid-time" style={{ gridRow: timeIndex + 2 }}>
              {time}
            </div>

            {DAYS.map((day, dayIndex) => (
              <div
                key={`${day}-${time}`}
                className="grid-cell"
                onClick={() => addClass(dayIndex, time)}
                style={{
                  gridColumn: dayIndex + 2,
                  gridRow: timeIndex + 2,
                }}
              />
            ))}
          </React.Fragment>
        ))}

        {events.map((evt) => {
          const dayIndex = DAYS.indexOf(evt.day);
          // 데이터 오류 방지
          if (dayIndex === -1) return null; 

          return (
            <div
              key={evt.id}
              className="event-card"
              onClick={(e) => {
                e.stopPropagation();
                removeClass(evt.id);
              }}
              style={{
                gridColumn: dayIndex + 2,
                gridRow: `${evt.time - 9 + 2} / span ${evt.duration}`,
                backgroundColor: evt.color,
              }}
            >
              <span>{evt.name}</span>
              <span className="event-place">{evt.place}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}