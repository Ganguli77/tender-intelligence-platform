import { motion } from "framer-motion";
import { BriefcaseBusiness, Clock3, Sparkles, Timer, XCircle } from "lucide-react";

const tabs = [
  { id: "all", label: "All Tenders", icon: BriefcaseBusiness },
  { id: "active", label: "Active", icon: Sparkles },
  { id: "closingSoon", label: "Closing Soon", icon: Timer },
  { id: "expired", label: "Expired", icon: XCircle },
  { id: "matches", label: "My Matches", icon: Clock3 },
];

export default function TenderTabs({ activeTab, counts, onChange }) {
  return (
    <nav className="premium-tabs" aria-label="Tender status tabs">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;

        return (
          <button key={tab.id} type="button" className={isActive ? "is-active" : ""} onClick={() => onChange(tab.id)}>
            <Icon size={16} />
            <span>{tab.label}</span>
            <strong>{(counts?.[tab.id] || 0).toLocaleString("en-IN")}</strong>
            {isActive ? <motion.i layoutId="activeTenderTab" /> : null}
          </button>
        );
      })}
    </nav>
  );
}
