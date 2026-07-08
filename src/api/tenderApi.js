import {
  createTender,
  deleteTenderById,
  getTender,
  getTenders,
  updateTenderById,
} from "./tenders";

export { createTender, getTenders };

export const getTenderById = getTender;
export const updateTender = updateTenderById;
export const deleteTender = deleteTenderById;
