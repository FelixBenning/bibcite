import { Data } from "csl-json";
import { nameYearTitle } from "../order";
import { CiteStyle } from "./types";
import { alphabetic_identifier, defaultBibEntry, tabularBibEntry } from "./helpers";

export const alphabetic: CiteStyle = {
  name: "alphabetic",
  order: { comparison: nameYearTitle, inform_citations: false },
  identifier: alphabetic_identifier,
  enclosing: ["[", "]"],
  multiSeparator: ";",
  bib_entry: defaultBibEntry,
  metaBibEntry: tabularBibEntry,
  metaReference: (content: string) =>
    `<h2>References</h2>
  <table>
    ${content}
  </table>
  `,
};
