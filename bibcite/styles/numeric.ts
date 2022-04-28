import { Data } from "csl-json";
import { CiteStyle } from "./types";
import { insertion } from "../order";

export const numeric: CiteStyle = {
  name: "numeric",
  order: { comparison: insertion, inform_citations: true },
  enclosing: ["[", "]"],
  multiSeparator: ",",
  identifier: (index: number, _: Data) => String(index),
  bib_entry: (index: number, bib_data: Data) => `
    <tr style="vertical-align:top">
      <td>[${index}]</td>
      <td><strong>${bib_data.title}</strong>
      <p>
        <span>${bib_data.author.map((p) => p.family).join(", ")}</span>
        <span>(${bib_data.issued["date-parts"][0][0]})</span>
      </p>
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
