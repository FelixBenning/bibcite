import { Data } from "csl-json";
import { BibOrder } from "./sorting";

export type BibStyle = {
  sorting: BibOrder;
  identifier: (index: number, bib_data: Data) => string;
  bib_entry: (index: number, bib_data: Data) => string;
};
