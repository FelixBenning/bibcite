import { Data, Person } from "csl-json";
import { BibOrder, insertion, nameYearTitle } from "./sorting";

export const citeTypes = ["text-cite", "raw-cite", "paren-cite"] as const;
export type CiteType = typeof citeTypes[number];

export function isCiteType(test: string): test is CiteType {
  return (<readonly string[]>citeTypes).includes(test);
}

export function et_al_ify(authors: Person[]): string {
  const names = authors.map(
    (p) => p["non-dropping-particle"] || "" + " " + p.family
  );
  return names[0] + (names.length > 1 ? " et al." : "");
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

export type CiteStyle = {
  name: string;
  order: BibOrder;
  enclosing: [string, string];
  multiSeparator: string;
  identifier: (index: number, bib_data: Data, citeType: CiteType) => string;
  bib_entry: (index: number, bib_data: Data) => string;
  reference: (content: string) => string;
};

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

function letters(authors: Person[]) {
  switch (authors.length) {
    case 0:
      return "?";
    case 1:
      return authors.at(0).family.slice(0, 3).toUpperCase();
    default:
      return authors
        .map((p) => p.family.at(0))
        .join("")
        .toUpperCase();
  }
}

function alphabetic_identifier(_: number, bibData: Data): string {
  return (
    letters(bibData.author) +
    bibData.issued["date-parts"][0][0].toString().slice(-2)
  );
}

export const alphabetic: CiteStyle = {
  name: "alphabetic",
  order: { comparison: nameYearTitle, inform_citations: false },
  identifier: alphabetic_identifier,
  enclosing: ["[", "]"],
  multiSeparator: ";",
  bib_entry: (index: number, bib_data: Data) => `
    <tr>
      <td>[${alphabetic_identifier(index, bib_data)}]</td>
      <td>
        <h3>${bib_data.title}</h3>
        <span>${bib_data.author.map((p) => p.family).join(", ")}
        </span><span>(${bib_data.issued["date-parts"][0][0]})</span>
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

export const styles = {
  numeric: numeric,
  alphabetic: alphabetic,
};
