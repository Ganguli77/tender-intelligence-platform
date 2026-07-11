import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";

export default function EmptyState({ onClearFilters, icon: Icon }) {
  return (
    <motion.section
      className="premium-empty-state"
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.25 }}
    >
      <span>{Icon ? <Icon size={34} /> : null}</span>
      <h2>No tenders found</h2>
      <p>Try removing a filter or widening the value and closing date range.</p>
      <button type="button" className="premium-primary-button" onClick={onClearFilters}>
        <RotateCcw size={17} />
        Clear Filters
      </button>
    </motion.section>
  );
}
