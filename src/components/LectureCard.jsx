export default function LectureCard({ title, professor, time }) {
  return (
    <div className="lecture-card">
      <div className="lecture-title">{title}</div>

      <div className="lecture-info">
        <b>교수</b> {professor} &nbsp;&nbsp;
        <b>시간 / 강의실</b> {time}
      </div>

      <div className="lecture-tags">
        <span>비슷한 강의 추천</span>
        <span>알고리즘</span>
        <span>운영체제</span>
        <span>데이터통신</span>
      </div>

      <div className="card-icons">
        <button className="icon-btn">📅</button>
        <button className="icon-btn">👤</button>
      </div>
    </div>
  );
}