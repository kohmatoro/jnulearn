import { useState, useMemo } from "react";
import lectures from "../data/lectures.json";

export default function RecommendPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [targetCredits, setTargetCredits] = useState("");
  const [searchResults, setSearchResults] = useState([]);

  const getValue = (lec, keys) => {
    for (const key of keys) {
      if (lec[key] !== undefined && lec[key] !== null) return lec[key];
    }
    return "";
  };

  const normalize = (v) => (v || "").replace(/\s+/g, "").replace(/\//g, "").toUpperCase();
  const toNumber = (v) => {
    const n = Number(String(v).replace(/[^0-9.-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  // 인기강의: 담은 인원 많은 순 상위 10개
  const popularLectures = useMemo(() => {
    return [...lectures]
      .sort((a, b) => {
        const enrolledA = toNumber(getValue(a, ["담은 인원", "담은인원", "담 은 인원"]));
        const enrolledB = toNumber(getValue(b, ["담은 인원", "담은인원", "담 은 인원"]));
        return enrolledB - enrolledA;
      })
      .slice(0, 10);
  }, []);

  // 꿀강의: 교양과목만, S/U 우선 → 경쟁률 낮은순 → 담은인원 많은순
  const easyLectures = useMemo(() => {
    return [...lectures]
      .filter((lec) => {
        const category = normalize(getValue(lec, ["이수구분", " 이수구분"]));
        return category.includes("교양");
      })
      .sort((a, b) => {
        const noteA = normalize(getValue(a, ["비고", " 비고"]));
        const noteB = normalize(getValue(b, ["비고", " 비고"]));
        const suA = noteA.includes("S/U") ? 1 : 0;
        const suB = noteB.includes("S/U") ? 1 : 0;

        const enrolledA = toNumber(getValue(a, ["담은 인원", "담은인원", "담 은 인원"]));
        const enrolledB = toNumber(getValue(b, ["담은 인원", "담은인원", "담 은 인원"]));
        const capA = toNumber(getValue(a, ["정원", " 정원"]));
        const capB = toNumber(getValue(b, ["정원", " 정원"]));
        const ratioA = capA > 0 ? enrolledA / capA : enrolledA;
        const ratioB = capB > 0 ? enrolledB / capB : enrolledB;

        if (suB !== suA) return suB - suA;
        if (ratioA !== ratioB) return ratioA - ratioB;
        return enrolledB - enrolledA;
      })
      .slice(0, 10);
  }, []);

  // 학년별 추천 교양: 각 학년별 교양 과목 중 경쟁률 낮고 인기 있는 것
  const liberalByGrade = useMemo(() => {
    const result = {};
    [1, 2, 3, 4].forEach((grade) => {
      result[grade] = lectures
        .filter((lec) => {
          const year = toNumber(getValue(lec, ["학년", "학 년"]));
          const category = normalize(getValue(lec, ["이수구분", " 이수구분"]));
          return year === grade && category.includes("교양");
        })
        .sort((a, b) => {
          const enrolledA = toNumber(getValue(a, ["담은 인원", "담은인원", "담 은 인원"]));
          const enrolledB = toNumber(getValue(b, ["담은 인원", "담은인원", "담 은 인원"]));
          const capA = toNumber(getValue(a, ["정원", " 정원"]));
          const capB = toNumber(getValue(b, ["정원", " 정원"]));
          const ratioA = capA > 0 ? enrolledA / capA : enrolledA;
          const ratioB = capB > 0 ? enrolledB / capB : enrolledB;

          if (ratioA !== ratioB) return ratioA - ratioB; // 경쟁률 낮은순
          return enrolledB - enrolledA; // 인기순
        })
        .slice(0, 3);
    });
    return result;
  }, []);

  // 강의 추천: 같은 학점+이수구분, 시간 겹침 적음, 경쟁률 낮음
  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const found = lectures.find((lec) => {
      const title = getValue(lec, ["과목명", " 과목명"]);
      return title.toLowerCase().includes(searchQuery.toLowerCase());
    });

    if (!found) {
      setSearchResults([]);
      return;
    }

    const lecCredit = toNumber(getValue(found, ["학점", " 학점"]));
    const lecCategory = normalize(getValue(found, ["이수구분", " 이수구분"]));
    const lecTime = getValue(found, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"]);
    const lecTitle = getValue(found, ["과목명", " 과목명"]);

    const similar = lectures
      .filter((lec) => {
        const title = getValue(lec, ["과목명", " 과목명"]);
        if (title === lecTitle) return false;

        const credit = toNumber(getValue(lec, ["학점", " 학점"]));
        const category = normalize(getValue(lec, ["이수구분", " 이수구분"]));

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

        if (timeOverlapA !== timeOverlapB) return timeOverlapA - timeOverlapB;
        return ratioA - ratioB;
      })
      .slice(0, 5);

    setSearchResults(similar);
  };

  // 학점조합: 목표 학점에 맞는 강의 조합 생성
  const generateCombinations = () => {
    const target = toNumber(targetCredits);
    if (target < 3 || target > 24) return [];

    // 꿀강의 우선으로 조합
    const candidates = [...easyLectures].slice(0, 20);
    const combinations = [];

    // 간단한 조합 알고리즘 (3개 조합)
    for (let i = 0; i < candidates.length - 2; i++) {
      for (let j = i + 1; j < candidates.length - 1; j++) {
        for (let k = j + 1; k < candidates.length; k++) {
          const sum =
            toNumber(getValue(candidates[i], ["학점", " 학점"])) +
            toNumber(getValue(candidates[j], ["학점", " 학점"])) +
            toNumber(getValue(candidates[k], ["학점", " 학점"]));

          if (sum === target) {
            combinations.push([candidates[i], candidates[j], candidates[k]]);
            if (combinations.length >= 3) return combinations;
          }
        }
      }
    }

    return combinations;
  };

  const creditCombinations = useMemo(() => {
    if (!targetCredits) return [];
    return generateCombinations();
  }, [targetCredits]);

  return (
    <div className="recommend-wrapper">
      {/* 좌측 컨테이너 */}
      <div className="recommend-left">
        {/* 인기강의 */}
        <div className="recommend-card">
          <h2>인기강의</h2>
          {popularLectures.slice(0, 5).map((lec, idx) => (
            <p key={idx}>
              {getValue(lec, ["과목명", " 과목명"])} ({getValue(lec, ["담당교수", "담당 교수"])})
            </p>
          ))}
        </div>

        {/* 꿀강의 */}
        <div className="recommend-card">
          <h2>꿀강의</h2>
          {easyLectures.slice(0, 5).map((lec, idx) => (
            <p key={idx}>
              {getValue(lec, ["과목명", " 과목명"])} ({getValue(lec, ["담당교수", "담당 교수"])})
              {normalize(getValue(lec, ["비고", " 비고"])).includes("S/U") && " [S/U]"}
            </p>
          ))}
        </div>

        {/* 학년별 추천 교양 */}
        <div className="recommend-card">
          <h2>학년별 추천 교양</h2>

          {[1, 2, 3, 4].map((grade) => (
            <div key={grade}>
              <h3>{grade}학년</h3>
              {liberalByGrade[grade]?.slice(0, 2).map((lec, idx) => (
                <p key={idx}>
                  {getValue(lec, ["과목명", " 과목명"])}
                </p>
              )) || <p>추천 강의 없음</p>}
            </div>
          ))}

          <p style={{ marginTop: "10px" }}>원하는 강의를 선택해 시간표에 추가하세요.</p>
        </div>
      </div>

      {/* 우측 컨테이너 */}
      <div className="recommend-right">
        {/* 강의 추천 */}
        <div className="recommend-card">
          <h2>강의 추천</h2>

          <div className="search-bar">
            <input
              placeholder="과목을 검색하세요. 추천 강의를 알려드립니다."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch}>🔍</button>
          </div>

          {searchResults.length > 0 ? (
            <div>
              <p style={{ fontWeight: "bold", marginTop: "10px" }}>추천 강의:</p>
              {searchResults.map((lec, idx) => (
                <p key={idx}>• {getValue(lec, ["과목명", " 과목명"])}</p>
              ))}
            </div>
          ) : searchQuery ? (
            <p>검색 결과가 없습니다.</p>
          ) : (
            <p>과목을 검색하면 추천 강의를 알려드립니다.</p>
          )}
        </div>

        {/* 학점조합 */}
        <div className="recommend-card">
          <h2>학점조합</h2>

          <div className="search-bar">
            <input
              placeholder="원하는 학점을 입력하세요 (예: 18)"
              value={targetCredits}
              onChange={(e) => setTargetCredits(e.target.value)}
              type="number"
            />
            <button onClick={() => setTargetCredits(targetCredits)}>🔍</button>
          </div>

          {creditCombinations.length > 0 ? (
            <div>
              <p style={{ fontWeight: "bold", marginTop: "10px" }}>{targetCredits}학점 조합:</p>
              {creditCombinations.map((combo, idx) => (
                <p key={idx}>
                  조합 {idx + 1}: {combo.map((lec) => getValue(lec, ["과목명", " 과목명"])).join(" / ")}
                </p>
              ))}
            </div>
          ) : targetCredits ? (
            <p>해당 학점에 맞는 조합을 찾을 수 없습니다.</p>
          ) : (
            <p>원하는 학점을 입력하면 추천 조합을 알려드립니다.</p>
          )}

          {creditCombinations.length > 0 && (
            <div className="card-icons">
              <button className="icon-btn">📅</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}