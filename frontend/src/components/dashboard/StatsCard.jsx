import { motion } from "framer-motion";

export default function StatsCard({ title, value, trend, icon: Icon, accent = "cyan", delay = 0 }) {
  return (
    <motion.article
      className={`dashboard-stat-card dashboard-stat-card--${accent}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, delay }}
      whileHover={{ y: -4 }}
    >
      <i aria-hidden="true">{Icon ? <Icon size={22} /> : null}</i>
      <div>
        <span>{title}</span>
        <strong>{value}</strong>
      </div>
      <small>{trend}</small>
      <svg className="dashboard-stat-spark" viewBox="0 0 160 44" aria-hidden="true">
        <path d="M2 36 C18 36 20 32 36 32 S52 22 68 25 S82 13 98 16 S112 7 128 11 S142 18 158 10" />
      </svg>
    </motion.article>
  );
}
