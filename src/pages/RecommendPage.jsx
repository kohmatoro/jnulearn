import { useState, useMemo } from "react";
import lectures from "../data/lectures.json";

export default function RecommendPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [targetCredits, setTargetCredits] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [desiredCoursesText, setDesiredCoursesText] = useState("");
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [selectedComboIndex, setSelectedComboIndex] = useState(null);
  const [selectedLectureTitle, setSelectedLectureTitle] = useState("");
  const [modalSource, setModalSource] = useState(""); // 'combo' | 'lecture'

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

  // Parse time strings like "월3,4 / 수2" into discrete slots: ["월3","월4","수2"]
  const parseTimeSlots = (raw) => {
    const s = String(raw || "").replace(/\s+/g, "");
    if (!s) return [];
    const days = ["월", "화", "수", "목", "금", "토", "일"];
    const slots = [];
    // Split by separators
    const parts = s.split(/[,/()]/).filter(Boolean);
    for (const part of parts) {
      // Find day character
      const day = days.find((d) => part.includes(d));
      if (!day) continue;
      const idx = part.indexOf(day);
      const rest = part.slice(idx + day.length);
      // Handle ranges like 3-5 or list like 3,4
      const rangeMatch = rest.match(/(\d+)-(\d+)/);
      if (rangeMatch) {
        const a = Number(rangeMatch[1]);
        const b = Number(rangeMatch[2]);
        for (let i = a; i <= b; i++) slots.push(`${day}${i}`);
        continue;
      }
      const nums = rest.split(/[^0-9]+/).filter(Boolean).map((x) => Number(x));
      if (nums.length) {
        nums.forEach((n) => slots.push(`${day}${n}`));
      } else {
        // Fallback: if no explicit numbers, treat whole part as a single block
        slots.push(`${day}`);
      }
    }
    return Array.from(new Set(slots));
  };

  const isConflict = (aRaw, bRaw) => {
    const a = parseTimeSlots(aRaw);
    const b = parseTimeSlots(bRaw);
    if (!a.length || !b.length) return false;
    const set = new Set(a);
    for (const x of b) {
      if (set.has(x)) return true;
    }
    return false;
  };

  const popularLectures = useMemo(() => {
    const sorted = [...lectures]
      .sort((a, b) => {
        const enrolledA = toNumber(getValue(a, ["담은 인원", "담은인원", "담 은 인원"]));
        const enrolledB = toNumber(getValue(b, ["담은 인원", "담은인원", "담 은 인원"]));
        return enrolledB - enrolledA;
      })
      .slice(0, 20);
    
    return sorted.sort(() => Math.random() - 0.5).slice(0, 10);
  }, []);

  const easyLectures = useMemo(() => {
    const sorted = [...lectures]
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
      .slice(0, 20);
    
    return sorted.sort(() => Math.random() - 0.5).slice(0, 10);
  }, []);

  // 학년별 추천 교양 섹션은 제거되었습니다

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
    const lecProfessor = (getValue(found, ["담당교수", "담당 교수"]) || "").toLowerCase();
    const lecNote = normalize(getValue(found, ["비고", " 비고"]));

    // Feature-based similarity scoring with time conflict filtering
    const featureTokens = (lec) => {
      const title = (getValue(lec, ["과목명", " 과목명"]) || "").toLowerCase();
      const professor = (getValue(lec, ["담당교수", "담당 교수"]) || "").toLowerCase();
      const category = normalize(getValue(lec, ["이수구분", " 이수구분"])) || "";
      const note = normalize(getValue(lec, ["비고", " 비고"])) || "";
      const words = new Set([
        ...title.split(/[^a-z0-9가-힣]+/).filter(Boolean),
        ...professor.split(/[^a-z0-9가-힣]+/).filter(Boolean),
        category,
      ]);
      if (note.includes("S/U")) words.add("su");
      return words;
    };

    const jaccard = (a, b) => {
      const inter = new Set([...a].filter((x) => b.has(x)));
      const union = new Set([...a, ...b]);
      return union.size ? inter.size / union.size : 0;
    };

    const easeScore = (lec) => {
      const cap = toNumber(getValue(lec, ["정원", " 정원"]));
      const enrolled = toNumber(getValue(lec, ["담은 인원", "담은인원", "담 은 인원"]));
      const ratio = cap > 0 ? enrolled / cap : enrolled;
      const note = normalize(getValue(lec, ["비고", " 비고"])) || "";
      return (note.includes("S/U") ? 0.2 : 0) + (isFinite(ratio) ? Math.max(0, 0.2 - ratio * 0.2) : 0);
    };

    const similar = lectures
      .filter((lec) => {
        const title = getValue(lec, ["과목명", " 과목명"]);
        if (title === lecTitle) return false;
        // Match by category and same credit first to keep relevance
        const credit = toNumber(getValue(lec, ["학점", " 학점"]));
        const category = normalize(getValue(lec, ["이수구분", " 이수구분"]));
        if (!(credit === lecCredit && category === lecCategory)) return false;
        // Exclude exact time conflicts
        const timeB = getValue(lec, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"]);
        if (isConflict(lecTime, timeB)) return false;
        return true;
      })
      .map((lec) => {
        const sim = jaccard(featureTokens(found), featureTokens(lec));
        const ease = easeScore(lec);
        // Diversity: penalize same professor heavily
        const prof = (getValue(lec, ["담당교수", "담당 교수"]) || "").toLowerCase();
        const sameProf = prof && lecProfessor && prof === lecProfessor ? -0.2 : 0;
        return { lec, score: sim * 0.6 + ease * 0.3 + sameProf * 0.1 };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)
      .map((x) => x.lec);

    setSearchResults(similar);
  };

  const generateCombinations = () => {
    const target = toNumber(targetCredits);
    if (!target || target < 1 || target > 30) return [];

    // 원하는 과목들 파싱 (콤마로 구분)
    const desiredTitles = desiredCoursesText
      .split(/[,\n]/)
      .map((t) => t.trim())
      .filter(Boolean);

    const titleOf = (lec) => getValue(lec, ["과목명", " 과목명"]).trim();

    const desiredLectures = [];
    const desiredSet = new Set();
    if (desiredTitles.length) {
      for (const t of desiredTitles) {
        const found = lectures.find((lec) => titleOf(lec).includes(t));
        if (found) {
          desiredLectures.push(found);
          desiredSet.add(titleOf(found));
        }
      }
    }

    // Expand candidates: pick broader set of easy lectures and suitable categories
    const pool = lectures
      .filter((lec) => {
        const category = normalize(getValue(lec, ["이수구분", " 이수구분"]));
        const credit = toNumber(getValue(lec, ["학점", " 학점"]));
        // Include 교양 + 일부 선택/일반선택, and credits 1-4
        return (category.includes("교양") || category.includes("선택")) && credit >= 1 && credit <= 4;
      })
      .sort((a, b) => {
        // Prefer SU and lower enrolled/cap ratio first for easier combos
        const noteA = normalize(getValue(a, ["비고", " 비고"]));
        const noteB = normalize(getValue(b, ["비고", " 비고"]));
        const suA = noteA.includes("S/U") ? 1 : 0;
        const suB = noteB.includes("S/U") ? 1 : 0;
        const capA = toNumber(getValue(a, ["정원", " 정원"]));
        const capB = toNumber(getValue(b, ["정원", " 정원"]));
        const enrolledA = toNumber(getValue(a, ["담은 인원", "담은인원", "담 은 인원"]));
        const enrolledB = toNumber(getValue(b, ["담은 인원", "담은인원", "담 은 인원"]));
        const ratioA = capA > 0 ? enrolledA / capA : enrolledA;
        const ratioB = capB > 0 ? enrolledB / capB : enrolledB;
        if (suB !== suA) return suB - suA; // SU first
        if (ratioA !== ratioB) return ratioA - ratioB; // less crowded first
        return enrolledB - enrolledA;
      })
      .slice(0, 200); // cap pool for performance

    const timeOf = (lec) => getValue(lec, ["강의실 및 시간", " 강의실 및 시간", "강의실및시간"]);
    const creditOf = (lec) => toNumber(getValue(lec, ["학점", " 학점"]));

    const results = [];
    const maxResults = 5; // 요청에 따라 최대 5개 조합

    // Backtracking with pruning and time-conflict check
    const dfs = (startIdx, sum, chosen) => {
      if (sum === target) {
        results.push([...chosen]);
        return results.length >= maxResults;
      }
      if (sum > target) return false;
      // Heuristic: if even adding minimal credits can't reach target, prune
      const minCred = 1;
      if (sum + minCred > target && sum !== target) return false;

      for (let i = startIdx; i < pool.length; i++) {
        const lec = pool[i];
        // 중복 과목 방지
        if (chosen.some((c) => titleOf(c) === titleOf(lec))) continue;
        const c = creditOf(lec);
        if (sum + c > target) continue;

        // time conflict check
        const t = timeOf(lec);
        let conflict = false;
        for (const picked of chosen) {
          if (isConflict(t, timeOf(picked))) {
            conflict = true;
            break;
          }
        }
        if (conflict) continue;

        chosen.push(lec);
        const stop = dfs(i + 1, sum + c, chosen);
        chosen.pop();
        if (stop) return true;
      }
      return false;
    };

    // 먼저 원하는 과목들을 포함하도록 시작 상태 구성
    const preChosen = [];
    let preSum = 0;
    for (const lec of desiredLectures) {
      // 시간/중복 체크는 간단히 진행
      if (preChosen.some((c) => titleOf(c) === titleOf(lec))) continue;
      if (preChosen.some((c) => isConflict(timeOf(c), timeOf(lec)))) continue;
      preChosen.push(lec);
      preSum += creditOf(lec);
    }
    if (preSum > target) return []; // 원하는 과목 합이 목표 초과 시 결과 없음
    dfs(0, preSum, preChosen);

    // Sort results by ease and time spread
    const comboScore = (combo) => {
      let suCount = 0;
      let crowd = 0;
      const seenSlots = new Set();
      let spread = 0;
      combo.forEach((lec) => {
        const note = normalize(getValue(lec, ["비고", " 비고"]));
        if (note.includes("S/U")) suCount++;
        const cap = toNumber(getValue(lec, ["정원", " 정원"]));
        const enrolled = toNumber(getValue(lec, ["담은 인원", "담은인원", "담 은 인원"]));
        const ratio = cap > 0 ? enrolled / cap : enrolled;
        crowd += ratio;
        parseTimeSlots(timeOf(lec)).forEach((s) => seenSlots.add(s));
      });
      spread = seenSlots.size; // more distinct slots → better spread
      return suCount * 2 + spread * 0.2 - crowd * 0.1;
    };

    return results
      .sort((a, b) => comboScore(b) - comboScore(a))
      .slice(0, maxResults);
  };

  const creditCombinations = useMemo(() => {
    if (!targetCredits) return [];
    return generateCombinations();
  }, [targetCredits, desiredCoursesText]);

  return (
    <div className="recommend-wrapper">
      <div className="recommend-left">
        <div className="recommend-card">
          <h2>인기강의</h2>
          {popularLectures.slice(0, 5).map((lec, idx) => (
            <p
              key={idx}
              style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedLectureTitle(getValue(lec, ["과목명", " 과목명"]) || "");
                setModalSource("lecture");
                setShowTimetableModal(true);
              }}
            >
              {getValue(lec, ["과목명", " 과목명"])} ({getValue(lec, ["담당교수", "담당 교수"])} )
            </p>
          ))}
        </div>

        <div className="recommend-card">
          <h2>꿀강의</h2>
          {easyLectures.slice(0, 5).map((lec, idx) => (
            <p
              key={idx}
              style={{ cursor: "pointer" }}
              onClick={() => {
                setSelectedLectureTitle(getValue(lec, ["과목명", " 과목명"]) || "");
                setModalSource("lecture");
                setShowTimetableModal(true);
              }}
            >
              {getValue(lec, ["과목명", " 과목명"])} ({getValue(lec, ["담당교수", "담당 교수"])} )
              {normalize(getValue(lec, ["비고", " 비고"])).includes("S/U") && " [S/U]"}
            </p>
          ))}
        </div>

        {/* 학년별 추천 교양 섹션 제거 */}
      </div>

      <div className="recommend-right">
        <div className="recommend-card">
          <h2>강의 추천</h2>

          <div className="search-bar">
            <input
              placeholder="과목을 검색하세요. 추천 강의를 알려드립니다."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            />
            <button onClick={handleSearch} aria-label="검색">
              <img src="/icons/search.svg" alt="검색" className="icon-img" />
            </button>
          </div>

          {searchResults.length > 0 ? (
            <div>
              <p style={{ fontWeight: "bold", marginTop: "10px" }}>추천 강의:</p>
              {searchResults.slice(0, 5).map((lec, idx) => (
                <p
                  key={idx}
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    setSelectedLectureTitle(getValue(lec, ["과목명", " 과목명"]) || "");
                    setModalSource("lecture");
                    setShowTimetableModal(true);
                  }}
                >
                  • {getValue(lec, ["과목명", " 과목명"])}
                </p>
              ))}
            </div>
          ) : searchQuery ? (
            <p>검색 결과가 없습니다.</p>
          ) : (
            <p>과목을 검색하면 추천 강의를 알려드립니다.</p>
          )}
        </div>

        <div className="recommend-card">
          <h2>학점조합</h2>

          <div className="search-bar">
            <input
              placeholder="원하는 학점을 입력하세요 (예: 18)"
              value={targetCredits}
              onChange={(e) => setTargetCredits(e.target.value)}
              type="number"
            />
            <button onClick={() => setTargetCredits(targetCredits)} aria-label="조합 검색">
              <img src="/icons/search.svg" alt="검색" className="icon-img" />
            </button>
          </div>

          <div className="search-bar" style={{ marginTop: 10 }}>
            <input
              placeholder="원하는 과목들을 입력하세요 (콤마로 구분)"
              value={desiredCoursesText}
              onChange={(e) => setDesiredCoursesText(e.target.value)}
            />
          </div>

          {creditCombinations.length > 0 ? (
            <div>
              <p style={{ fontWeight: "bold", marginTop: "10px" }}>{targetCredits}학점 조합:</p>
              {creditCombinations.map((combo, idx) => (
                <p key={idx}>
                  <button
                    className="icon-btn"
                    onClick={() => {
                      setSelectedComboIndex(idx);
                      setSelectedLectureTitle("");
                      setModalSource("combo");
                      setShowTimetableModal(true);
                    }}
                    style={{ marginRight: 8 }}
                  >
                    조합 {idx + 1}
                  </button>
                  {combo.map((lec) => getValue(lec, ["과목명", " 과목명"])).join(" / ")}
                </p>
              ))}
            </div>
          ) : targetCredits ? (
            <p>해당 학점에 맞는 조합을 찾을 수 없습니다.</p>
          ) : (
            <p>원하는 학점을 입력하면 추천 조합을 알려드립니다.</p>
          )}

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
                {modalSource === "combo" ? (
                  <p style={{ marginTop: 8 }}>선택한 조합: 조합 {selectedComboIndex !== null ? selectedComboIndex + 1 : "-"}</p>
                ) : (
                  <p style={{ marginTop: 8 }}>선택한 강의: {selectedLectureTitle || "-"}</p>
                )}
                <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
                  <button 
                    className="icon-btn" 
                    style={{ background: "#2c2c2c", color: "white" }}
                  >
                    새 시간표 만들기
                  </button>
                  <div style={{ background: "#f1f1f1", borderRadius: 8, padding: 8 }}>
                    <p style={{ margin: 0, fontWeight: 600 }}>시간표 선택</p>
                    <ul style={{ margin: 0, paddingLeft: 18 }}>
                      <li>시간표 A</li>
                      <li>시간표 B</li>
                      <li>시간표 C</li>
                    </ul>
                  </div>
                  <button 
                    className="icon-btn" 
                    style={{ background: "#2c2c2c", color: "white" }}
                  >
                    리스트에서 선택한 후 시간표로 이동
                  </button>
                  <button className="icon-btn" onClick={() => setShowTimetableModal(false)}>닫기</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}