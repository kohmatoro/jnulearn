export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        placeholder="강의명 / 교수명 / 키워드를 검색하세요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button>🔍</button>
    </div>
  );
}