import { useState } from "react";
import SearchBar from "../components/SearchBar";
import LectureCard from "../components/LectureCard";
import lectures from "../data/lectures.json";

export default function LecturePage() {
  const [query, setQuery] = useState("");

  // 검색 필터링
  const filteredLectures = lectures.filter((lec) =>
    lec["과목명"].toLowerCase().includes(query.toLowerCase()) ||
    lec["담당교수"].toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="lecture-wrapper">

      {/* 🔥 전체 필터 박스 + 검색창 (피그마 동일 디자인) */}
      <div className="filter-search-row">

        {/* 필터 박스 */}
        <div className="filter-box">
          <div className="filter-line">
            <span className="filter-title">학년:</span>
            <label>1학년 <input type="checkbox" /></label>
            <label>2학년 <input type="checkbox" /></label>
            <label>3학년 <input type="checkbox" /></label>
            <label>4학년 <input type="checkbox" /></label>

            <span className="filter-title" style={{ marginLeft: "40px" }}>이수구분:</span>
            <label>전필 <input type="checkbox" /></label>
            <label>전선 <input type="checkbox" /></label>
            <label>교양 <input type="checkbox" /></label>
            <label>S/U <input type="checkbox" /></label>

            <span className="filter-title" style={{ marginLeft: "40px" }}>정렬:</span>
            <select className="sort-select">
                <option>인기순 ▼</option>
            </select>
          </div>

          <div className="filter-line">
            <span className="filter-title">요일:</span>
            {["월","화","수","목","금"].map((d)=>(
              <label key={d}>{d} <input type="checkbox" /></label>
            ))}

            <span className="filter-title" style={{ marginLeft: "40px" }}>학점:</span>
            {[1,2,3].map((c)=>(
              <label key={c}>{c} <input type="checkbox" /></label>
            ))}
          </div>
        </div>

        {/* 오른쪽 검색창 */}
        <div className="search-box">
          <SearchBar value={query} onChange={setQuery} />
        </div>

      </div>

      {/* 🔥 강의 카드 리스트 */}
      <div className="lecture-list">
        {filteredLectures.length > 0 ? (
          filteredLectures.map((lec, idx) => (
            <LectureCard
              key={idx}
              title={lec["과목명"]}
              professor={lec["담당교수"]}
              time={lec["강의실 및 시간"]}
            />
          ))
        ) : (
          <div style={{ padding: "20px", color: "#999" }}>검색 결과가 없습니다.</div>
        )}
      </div>

    </div>
  );
}
