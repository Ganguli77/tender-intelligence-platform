import { motion } from "framer-motion";
import { CalendarDays, Download, RotateCcw, Search } from "lucide-react";

const tenderTypes = ["Open", "Limited", "EOI"];
const sortOptions = [
  { value: "closingDate", label: "Closing Date (Soonest)" },
  { value: "aiScore", label: "AI Score" },
  { value: "value", label: "Value" },
];

export default function TenderFilters({
  filters,
  options,
  loading,
  onFilterChange,
  onReset,
  onSearch,
  onExport,
}) {
  return (
    <motion.section
      className="premium-filter-card"
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      aria-label="Advanced tender filters"
    >
      <label className="premium-field premium-field-search">
        <span>Search</span>
        <div>
          <Search size={18} />
          <input
            type="search"
            placeholder="Search by title, department, keyword..."
            value={filters.searchTerm}
            onChange={(event) => onFilterChange("searchTerm", event.target.value)}
          />
        </div>
      </label>

      <label className="premium-field">
        <span>Category</span>
        <select value={filters.category} onChange={(event) => onFilterChange("category", event.target.value)}>
          <option value="">All Categories</option>
          {options.categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="premium-field">
        <span>Department</span>
        <select value={filters.department} onChange={(event) => onFilterChange("department", event.target.value)}>
          <option value="">All Departments</option>
          {options.departments.map((department) => (
            <option key={department} value={department}>
              {department}
            </option>
          ))}
        </select>
      </label>

      <label className="premium-field">
        <span>Location</span>
        <select value={filters.location} onChange={(event) => onFilterChange("location", event.target.value)}>
          <option value="">All Locations</option>
          {options.locations.map((location) => (
            <option key={location} value={location}>
              {location}
            </option>
          ))}
        </select>
      </label>

      <div className="premium-field">
        <span>Value Range (₹)</span>
        <div className="premium-range-inputs">
          <input
            type="number"
            min="0"
            placeholder="Min"
            value={filters.minValue}
            onChange={(event) => onFilterChange("minValue", event.target.value)}
          />
          <i />
          <input
            type="number"
            min="0"
            placeholder="Max"
            value={filters.maxValue}
            onChange={(event) => onFilterChange("maxValue", event.target.value)}
          />
        </div>
      </div>

      <div className="premium-field">
        <span>Closing Date</span>
        <div className="premium-date-range">
          <CalendarDays size={17} />
          <input
            type="date"
            aria-label="Closing date from"
            value={filters.closingFrom}
            onChange={(event) => onFilterChange("closingFrom", event.target.value)}
          />
          <input
            type="date"
            aria-label="Closing date to"
            value={filters.closingTo}
            onChange={(event) => onFilterChange("closingTo", event.target.value)}
          />
        </div>
      </div>

      <label className="premium-field">
        <span>Tender Type</span>
        <select value={filters.tenderType} onChange={(event) => onFilterChange("tenderType", event.target.value)}>
          <option value="">All Types</option>
          {tenderTypes.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="premium-field">
        <span>Sort By</span>
        <select value={filters.sortBy} onChange={(event) => onFilterChange("sortBy", event.target.value)}>
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <div className="premium-filter-actions">
        <button type="button" className="premium-outline-button" onClick={onReset}>
          <RotateCcw size={16} />
          Reset
        </button>
        <button type="button" className="premium-primary-button" onClick={onSearch} disabled={loading}>
          <Search size={17} />
          Search
        </button>
        <button type="button" className="premium-outline-button" onClick={onExport}>
          <Download size={16} />
          Export
        </button>
      </div>
    </motion.section>
  );
}
