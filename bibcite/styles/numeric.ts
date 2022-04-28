import { Data } from "csl-json";
import { CiteStyle } from "./types";
import { insertion } from "../sorting";

export const numeric: CiteStyle = {
  name: "numeric",
  order: { comparison: insertion, inform_citations: true },
  enclosing: ["[", "]"],
  multiSeparator: ",",
  identifier: (index: number, _: Data) => String(index),
  bib_entry: (index: number, bib_data: Data) => `
    <tr>
      <td>[${index}]</td>
      <td>
        <h3>${bib_data.title}</h3>
        <span>${bib_data.author.map((p) => p.family).join(", ")}</span>
        <span>(${bib_data.issued["date-parts"][0][0]})</span>
      </td>
    </tr>
  `,
  reference: (content: string) =>
    `<h2>References</h2>
  <table>
    ${content}
  </table>
  `,
};
