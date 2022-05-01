import { nameYearTitle } from "../order";
import { CiteStyle, CiteType } from "./types";
import { authorYearBibEntry, et_al_ify, paragraphBibEntry } from "./helpers";
import { Data } from "csl-json";

export const authorYear: CiteStyle = {
  name: "author-year",
  order: { comparison: nameYearTitle, inform_citations: false },
  identifier: (bib_data:Data, _index:number, citeType:CiteType) => {
    const year:string = String(bib_data.issued["date-parts"][0][0]);
    if(citeType==="text-cite"){
      return year;
    }
    return et_al_ify(bib_data.author) + year;
  },
  enclosing: ["(", ")"],
  multiSeparator: ";",
  bib_entry: authorYearBibEntry,
  metaBibEntry: paragraphBibEntry,
  metaReference: (content:string) => `<h2>References</h2>${content}`,
};