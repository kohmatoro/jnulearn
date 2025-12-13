export default function SearchBar({ value, onChange }) {
  return (
    <div className="search-bar">
      <input
        placeholder="강의명 / 교수명 / 키워드를 검색하세요."
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      <button aria-label="검색">
        <img src="/icons/search.svg" alt="검색" className="icon-img" />
      </button>
    </div>
  );
}