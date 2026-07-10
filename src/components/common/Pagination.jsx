import { ChevronLeft, ChevronRight } from "lucide-react";

import "./Pagination.css";

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set([1, totalPages, currentPage]);

  if (currentPage > 1) {
    pages.add(currentPage - 1);
  }

  if (currentPage < totalPages) {
    pages.add(currentPage + 1);
  }

  return Array.from(pages)
    .sort((a, b) => a - b)
    .reduce((items, page, index, orderedPages) => {
      if (index > 0 && page - orderedPages[index - 1] > 1) {
        items.push("ellipsis");
      }

      items.push(page);
      return items;
    }, []);
}

export default function Pagination({ currentPage, totalPages, onPageChange }) {
  if (totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(currentPage, totalPages);

  return (
    <nav className="pagination" aria-label="Tender results pages">
      <button
        className="pagination__button"
        type="button"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft size={17} />
        Previous
      </button>

      <div className="pagination__pages">
        {pages.map((page, index) =>
          page === "ellipsis" ? (
            <span className="pagination__ellipsis" key={`ellipsis-${index}`}>
              ...
            </span>
          ) : (
            <button
              className={`pagination__page${currentPage === page ? " pagination__page--active" : ""}`}
              type="button"
              key={page}
              onClick={() => onPageChange(page)}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </button>
          )
        )}
      </div>

      <button
        className="pagination__button"
        type="button"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        aria-label="Next page"
      >
        Next
        <ChevronRight size={17} />
      </button>
    </nav>
  );
}
