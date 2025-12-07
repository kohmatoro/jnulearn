export default function RecommendPage() {
  return (
    <div className="page-container">

      {/* 인기강의 */}
      <div className="lecture-card">
        <h2>인기강의</h2>
        <p>데이터베이스 — 시간표에추가</p>
        <p>데이터베이스 — 시간표에추가</p>
        <p>데이터베이스 — 시간표에추가</p>
      </div>

      {/* 꿀강의 */}
      <div className="lecture-card">
        <h2>꿀강의</h2>
        <p>데이터베이스 — 시간표에추가</p>
        <p>데이터베이스 — 시간표에추가</p>
        <p>데이터베이스 — 시간표에추가</p>
      </div>

      {/* 학년별 추천 교양 */}
      <div className="lecture-card">
        <h2>학년별 추천 교양</h2>

        <h3>1학년</h3>
        <p>데이터베이스 / 데이터베이스</p>

        <h3>2학년</h3>
        <p>데이터베이스 / 데이터베이스</p>

        <h3>3학년</h3>
        <p>데이터베이스 / 데이터베이스</p>

        <p style={{ marginTop: "10px" }}>원하는 강의를 선택해 시간표에 추가하세요.</p>
      </div>

      {/* 유사과목 */}
      <div className="lecture-card">
        <h2>유사과목</h2>

        <div className="search-bar">
          <input placeholder="과목을 검색하세요. 유사 과목을 알려드립니다." />
          <button>🔍</button>
        </div>

        <p>비슷한 강의 추천: 알고리즘 운영체제 데이터통신</p>
      </div>

      {/* 학점조합 */}
      <div className="lecture-card">
        <h2>학점조합</h2>

        <div className="search-bar">
          <input placeholder="원하는 학점을 입력하세요" />
          <button>🔍</button>
        </div>

        <p>18학점</p>

        <p>조합 1: 영어 / IoT / 데이터베이스 ...</p>
        <p>조합 2: 영어 / IoT / 데이터베이스 ...</p>

        <div className="card-icons">
          <button className="icon-btn">📅</button>
        </div>
      </div>

    </div>
  );
}