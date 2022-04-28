import { Data } from "csl-json";
import { BibOrder } from "../sorting";

export const citeTypes = ["text-cite", "raw-cite", "paren-cite"] as const;
export type CiteType = typeof citeTypes[number];

export type CiteStyle = {
  name: string;
  order: BibOrder;
  enclosing: [string, string];
  multiSeparator: string;
  identifier: (index: number, bib_data: Data, citeType: CiteType) => string;
  bib_entry: (index: number, bib_data: Data) => string;
  reference: (content: string) => string;
};

export function isCiteType(test: string): test is CiteType {
  return (<readonly string[]>citeTypes).includes(test);
}

export function ensureCiteType(value: string | undefined): CiteType {
  if (isCiteType(value)) return value;
  else if (typeof value === "undefined") {
    console.log(`Missing Citation type, fallback to "paren-cite"`);
  } else {
    console.error(
      `[Citation] Unknown Citation type ${value}, fallback to "paren-cite"`
    );
  }
  return "paren-cite";
}