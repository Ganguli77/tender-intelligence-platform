import { ChevronLeft, ChevronRight } from "lucide-react";

function buildPages(currentPage, totalPages) {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1);
  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  if (start > 2) pages.push("start-ellipsis");
  for (let page = start; page <= end; page += 1) pages.push(page);
  if (end < totalPages - 1) pages.push("end-ellipsis");
  pages.push(totalPages);
  return pages;
}

export default function TenderPagination({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
}) {
  const start = totalItems ? (currentPage - 1) * pageSize + 1 : 0;
  const end = Math.min(currentPage * pageSize, totalItems);
  const pages = buildPages(currentPage, totalPages);

  return (
    <footer className="premium-pagination">
      <span>
        Showing {start} to {end} of {totalItems.toLocaleString("en-IN")} results
      </span>

      <div className="premium-page-buttons" aria-label="Pagination">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage <= 1} aria-label="Previous page">
          <ChevronLeft size={17} />
        </button>
        {pages.map((page) =>
          typeof page === "number" ? (
            <button
              key={page}
              type="button"
              className={page === currentPage ? "is-active" : ""}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ) : (
            <span key={page}>...</span>
          )
        )}
        <button
          type="button"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
        >
          <ChevronRight size={17} />
        </button>
      </div>

      <label>
        <select value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
          {[10, 20, 50].map((size) => (
            <option key={size} value={size}>
              {size} per page
            </option>
          ))}
        </select>
      </label>
    </footer>
  );
}
