import { Data } from "csl-json";
import { nameYearTitle } from "../order";
import { CiteStyle } from "./types";
import { alphabetic_identifier } from "./helpers";

export const alphabetic: CiteStyle = {
  name: "alphabetic",
  order: { comparison: nameYearTitle, inform_citations: false },
  identifier: alphabetic_identifier,
  enclosing: ["[", "]"],
  multiSeparator: ";",
  bib_entry: (index: number, bib_data: Data) => `
    <tr style="vertical-align:top">
      <td>[${alphabetic_identifier(index, bib_data)}]</td>
      <td><strong>${bib_data.title}</strong>
        <p>
          <span>${bib_data.author.map((p) => p.family).join(", ")}
          </span><span>(${bib_data.issued["date-parts"][0][0]})</span>
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
