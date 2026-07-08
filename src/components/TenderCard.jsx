import { useNavigate } from "react-router-dom";
import { FaArrowRight, FaBuilding, FaCalendarAlt } from "react-icons/fa";
import "./TenderCard.css";

function formatDate(value) {
  if (!value || value === "Not specified") return "Not specified";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getTenderDescription(tender) {
  return tender.description || `Tender opportunity from ${tender.organization || "the issuing organization"}.`;
}

export default function TenderCard({
  tender,
  id,
  title,
  organization,
  org,
  deadline,
  description,
}) {
  const navigate = useNavigate();
  const cardTender = tender || {
    id,
    title,
    organization: organization || org,
    deadline,
    description,
  };

  const handleOpen = () => {
    if (cardTender.id) navigate(`/tender/${cardTender.id}`);
  };

  return (
    <button type="button" className="tender-summary-card" onClick={handleOpen}>
      <span className="tender-summary-accent" aria-hidden="true" />

      <span className="tender-summary-body">
        <span className="tender-summary-org">
          <FaBuilding />
          {cardTender.organization || "Organization not specified"}
        </span>
        <strong>{cardTender.title || "Untitled tender"}</strong>
        <span className="tender-summary-description">
          {getTenderDescription(cardTender)}
        </span>
      </span>

      <span className="tender-summary-footer">
        <span>
          <FaCalendarAlt />
          {formatDate(cardTender.deadline)}
        </span>
        <span className="tender-summary-link">
          View <FaArrowRight />
        </span>
      </span>
    </button>
  );
}
