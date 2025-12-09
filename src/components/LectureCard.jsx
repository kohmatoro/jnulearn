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
        <button className="icon-btn">📅</button>
        <button className="icon-btn">👤</button>
      </div>
    </div>
  );
}