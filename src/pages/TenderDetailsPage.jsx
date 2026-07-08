import { useParams } from "react-router-dom";
import PlaceholderPage from "./PlaceholderPage";

export default function TenderDetailsPage() {
  const { id } = useParams();

  return (
    <PlaceholderPage
      eyebrow="Protected detail view"
      title={`Tender Details ${id ? `#${id}` : ""}`}
      description="Show tender scope, eligibility, documents, timelines, AI summary, and bid readiness insights here."
    />
  );
}
