import { CiteStyle } from "./types";
import {
  alphabetic_identifier,
  defaultBibEntry,
  tabularBibEntry,
  tabularReferences,
} from "./helpers";
import { Data } from "csl-json";

export const alphabetic: CiteStyle = {
  name: "alphabetic",
  order: {
    comparison: (c1: Data, c2: Data) =>
      alphabetic_identifier(c1).localeCompare(alphabetic_identifier(c2)),
    inform_citations: false,
  },
  identifier: alphabetic_identifier,
  enclosing: ["[", "]"],
  multiSeparator: ";",
  bibEntry: defaultBibEntry,
  metaBibEntry: tabularBibEntry,
  metaReference: tabularReferences,
};
