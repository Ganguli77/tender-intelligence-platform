import { Link } from "react-router-dom";
import PlaceholderPage from "./PlaceholderPage";

export default function TenderListPage() {
  return (
    <PlaceholderPage
      eyebrow="Protected marketplace"
      title="Tenders"
      description="Build tender search, filters, saved items, AI scores, pagination, and comparison workflows on this route."
      actions={
        <Link className="button button--primary" to="/tenders/add">
          Add Tender
        </Link>
      }
    />
  );
}
