import { useState, useMemo } from "react";
import SearchBar from "../components/SearchBar";
import LectureCard from "../components/LectureCard";
import lectures from "../data/lectures.json";

export default function LecturePage() {
  const [query, setQuery] = useState("");
  const [selectedGrades, setSelectedGrades] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedDays, setSelectedDays] = useState([]);
  const [selectedCredits, setSelectedCredits] = useState([]);
  const [sortOption, setSortOption] = useState("경쟁률 낮은순");

  const gradeOptions = ["1", "2", "3", "4", "5"];
  // 전공=전공필수+전공선택 전체, 교양=교양 과목
  const categoryOptions = ["전공", "교양"];
  const dayOptions = ["월", "화", "수", "목", "금"];
  const creditOptions = ["1", "2", "3", "4"];

  const getValue = (lec, keys) => {
    for (const key of keys) {
      if (lec[key] !== undefined && lec[key] !== null) return lec[key];
    }
    return "";
  };

  const toggleSelection = (value, selected, setter) => {
    if (selected.includes(value)) {
      setter(selected.filter((v) => v !== value));
    } else {
      setter([...selected, value]);
    }
  };

  const normalize = (v) => (v || "").replace(/\s+/g, "").replace(/\//g, "").toUpperCase();
  const toNumber = (v) => {
    const n = Number(String(v).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const getSimilarLectures = (lecture) => {
    const lecCredit = toNumber(getValue(lecture, ["학점", " 학점"]));
    const lecCategory = normalize(getValue(lecture, ["이수구분", " 이수구분"]));
    const lecTime = getValue(lecture, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"]);
    const lecTitle = getValue(lecture, ["과목명", " 과목명"]);

    const similar = lectures
      .filter((lec) => {
        const title = getValue(lec, ["과목명", " 과목명"]);
        if (title === lecTitle) return false; // 자신 제외

        const credit = toNumber(getValue(lec, ["학점", " 학점"]));
        const category = normalize(getValue(lec, ["이수구분", " 이수구분"]));

        // 기본 조건: 학점 같음 + 이수구분 같음
        return credit === lecCredit && category === lecCategory;
      })
      .sort((a, b) => {
        const timeA = getValue(a, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"]);
        const timeB = getValue(b, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"]);

        const timeOverlapA = (timeA + lecTime).split(lecTime[0] || "X").length;
        const timeOverlapB = (timeB + lecTime).split(lecTime[0] || "X").length;

        const capA = toNumber(getValue(a, ["정원", " 정원"]));
        const enrolledA = toNumber(getValue(a, ["담은 인원", "담은인원", "담 은 인원"]));
        const ratioA = capA > 0 ? enrolledA / capA : enrolledA;

        const capB = toNumber(getValue(b, ["정원", " 정원"]));
        const enrolledB = toNumber(getValue(b, ["담은 인원", "담은인원", "담 은 인원"]));
        const ratioB = capB > 0 ? enrolledB / capB : enrolledB;

        // 시간 겹침 적음 우선, 그 다음 경쟁률 낮음
        if (timeOverlapA !== timeOverlapB) return timeOverlapA - timeOverlapB;
        return ratioA - ratioB;
      })
      .slice(0, 3); // 상위 3개

    return similar;
  };

  // 검색 필터링 - useMemo로 최적화
  const filteredLectures = useMemo(() => {
    return lectures.filter((lec) => {
      const title = getValue(lec, ["과목명", " 과목명"]);
      const prof = getValue(lec, ["담당교수", "담당 교수"]);
      const timeInfo = getValue(lec, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"]);
      const yearRaw = getValue(lec, ["학년", "학 년"]);
      const categoryRaw = getValue(lec, ["이수구분", " 이수구분"]);
      const creditRaw = getValue(lec, ["학점", " 학점"]);

      const q = query.toLowerCase();
      const matchesQuery =
        String(title).toLowerCase().includes(q) ||
        String(prof).toLowerCase().includes(q);

      const lecGrade = String(yearRaw || "");
      const matchesGrade =
        selectedGrades.length === 0 || selectedGrades.includes(lecGrade);

      const lecCategory = normalize(categoryRaw);
      const isMajor = lecCategory.startsWith("전공");
      const isMajorRequired = lecCategory === "전공필수";
      const isLiberal = lecCategory.includes("교양");

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((cat) => {
          const sel = normalize(cat);
          if (sel === "전공") return isMajor;
          if (sel === "교양") return isLiberal;
          return lecCategory === sel;
        });

      const lecTime = timeInfo || "";
      const matchesDay =
        selectedDays.length === 0 ||
        selectedDays.some((day) => lecTime.includes(day));

      const lecCredit = String(creditRaw || "");
      const matchesCredit =
        selectedCredits.length === 0 || selectedCredits.includes(lecCredit);

      return (
        matchesQuery &&
        matchesGrade &&
        matchesCategory &&
        matchesDay &&
        matchesCredit
      );
    });
  }, [query, selectedGrades, selectedCategories, selectedDays, selectedCredits]);

  const sortedLectures = useMemo(() => {
    return [...filteredLectures].sort((a, b) => {
    const val = (lec, keys) => getValue(lec, keys);
    const enrolledA = toNumber(val(a, ["담은 인원", "담은인원", "담 은 인원"]));
    const enrolledB = toNumber(val(b, ["담은 인원", "담은인원", "담 은 인원"]));
    const capA = toNumber(val(a, ["정원", " 정원"]));
    const capB = toNumber(val(b, ["정원", " 정원"]));
    const ratioA = capA > 0 ? enrolledA / capA : enrolledA;
    const ratioB = capB > 0 ? enrolledB / capB : enrolledB;
    const noteA = normalize(val(a, ["비고", " 비고"]));
    const noteB = normalize(val(b, ["비고", " 비고"]));

    switch (sortOption) {
      case "경쟁률 높은순":
        return ratioB - ratioA;
      case "경쟁률 낮은순":
        return ratioA - ratioB;
      case "담은인원 많은 순":
        return enrolledB - enrolledA;
      case "담은인원 적은 순":
        return enrolledA - enrolledB;
      default:
        return 0;
    }
    });
  }, [filteredLectures, sortOption]);

  return (
    <div className="lecture-wrapper">

      {/* 🔥 전체 필터 박스 + 검색창 (피그마 동일 디자인) */}
      <div className="filter-search-row">

        {/* 필터 박스 */}
        <div className="filter-box">
          <div className="filter-line">
            <span className="filter-title">학년:</span>
            {gradeOptions.map((grade) => (
              <label key={grade}>
                {grade}학년 <input
                  type="checkbox"
                  checked={selectedGrades.includes(grade)}
                  onChange={() => toggleSelection(grade, selectedGrades, setSelectedGrades)}
                />
              </label>
            ))}

            <span className="filter-title" style={{ marginLeft: "40px" }}>이수구분:</span>
            {categoryOptions.map((cat) => (
              <label key={cat}>
                {cat} <input
                  type="checkbox"
                  checked={selectedCategories.includes(cat)}
                  onChange={() => toggleSelection(cat, selectedCategories, setSelectedCategories)}
                />
              </label>
            ))}

            <span className="filter-title" style={{ marginLeft: "40px" }}>정렬:</span>
            <select
              className="sort-select"
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value)}
            >
                <option value="경쟁률 낮은순">경쟁률 낮은순 ▼</option>
                <option value="경쟁률 높은순">경쟁률 높은순 ▲</option>
                <option value="담은인원 많은 순">담은인원 많은 순 ▲</option>
                <option value="담은인원 적은 순">담은인원 적은 순 ▼</option>
            </select>
          </div>

          <div className="filter-line">
            <span className="filter-title">요일:</span>
            {dayOptions.map((d) => (
              <label key={d}>
                {d} <input
                  type="checkbox"
                  checked={selectedDays.includes(d)}
                  onChange={() => toggleSelection(d, selectedDays, setSelectedDays)}
                />
              </label>
            ))}

            <span className="filter-title" style={{ marginLeft: "40px" }}>학점:</span>
            {creditOptions.map((c) => (
              <label key={c}>
                {c} <input
                  type="checkbox"
                  checked={selectedCredits.includes(c)}
                  onChange={() => toggleSelection(c, selectedCredits, setSelectedCredits)}
                />
              </label>
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
        {sortedLectures.length > 0 ? (
          sortedLectures.slice(0, 50).map((lec, idx) => (
            <LectureCard
              key={getValue(lec, ["수강반번호", "수강 반번호"]) || idx}
              title={getValue(lec, ["과목명", " 과목명"])}
              professor={getValue(lec, ["담당교수", "담당 교수"])}
              time={getValue(lec, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"])}
              credit={getValue(lec, ["학점", " 학점"])}
              year={getValue(lec, ["학년", "학 년"])}
              category={getValue(lec, ["이수구분", " 이수구분"])}
              capacity={getValue(lec, ["정원", " 정원"])}
              enrolled={getValue(lec, ["담은 인원", "담은인원"]) || getValue(lec, ["담 은 인원"])}
              note={getValue(lec, ["비고", " 비고"])}
              courseId={getValue(lec, ["수강반번호", "수강 반번호"])}
              similarLectures={[]}
            />
          ))
        ) : (
          <div style={{ padding: "20px", color: "#999" }}>검색 결과가 없습니다.</div>
        )}
      </div>

    </div>
  );
}
