import { Data } from "csl-json";
import { CiteStyle } from "./types";
import { insertion } from "../order";
import { defaultBibEntry, tabularBibEntry, tabularReferences } from "./helpers";

export const numeric: CiteStyle = {
  name: "numeric",
  order: { comparison: insertion, inform_citations: true },
  enclosing: ["[", "]"],
  multiSeparator: ",",
  identifier: (_: Data, index: number) => String(index),
  bibEntry: defaultBibEntry,
  metaBibEntry: tabularBibEntry,
  metaReference: tabularReferences
};
