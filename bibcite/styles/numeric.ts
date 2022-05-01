import { Data } from "csl-json";
import { CiteStyle } from "./types";
import { insertion } from "../order";
import { defaultBibEntry, tabularBibEntry } from "./helpers";

export const numeric: CiteStyle = {
  name: "numeric",
  order: { comparison: insertion, inform_citations: true },
  enclosing: ["[", "]"],
  multiSeparator: ",",
  identifier: (_: Data, index: number) => String(index),
  bib_entry: defaultBibEntry,
  metaBibEntry: tabularBibEntry,
  metaReference: (content: string) =>
    `<h2>References</h2>
  <table>
    ${content}
  </table>
  `,
};
