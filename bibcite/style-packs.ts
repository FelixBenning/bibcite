import { Data, Person } from "csl-json";
import { BibOrder, insertion, nameYearTitle } from "./sorting";

export type CiteStyle = {
  name: string;
  order: BibOrder;
  identifier: (index: number, bib_data: Data) => string;
  bib_entry: (index: number, bib_data: Data) => string;
};

export const numeric: CiteStyle = {
  name: "numeric",
  order: { comparison: insertion, inform_citations: true },
  identifier: (index: number, _: Data) => String(index),
  bib_entry: (index: number, bib_data: Data) => `
    <tr>
      <td>[${index}]</td>
      <td>
        <h3>${bib_data.title}</h3>
        <span>${bib_data.author.join(",")}</span><span>(${
    bib_data.issued["date-parts"][0]
  })</span>
      </td>
    </tr>
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

function alphabetic_identifier(_: number, bib_data: Data): string {
  return letters(bib_data.author) + bib_data.issued["date-parts"][0].slice(-2);
}

export const alphabetic: CiteStyle = {
  name: "alphabetic",
  order: { comparison: nameYearTitle, inform_citations: false },
  identifier: alphabetic_identifier,
  bib_entry: (index: number, bib_data: Data) => `
    <tr>
      <td>[${alphabetic_identifier(index, bib_data)}]</td>
      <td>
        <h3>${bib_data.title}</h3>
        <span>${bib_data.author.join(",")}
        </span><span>(${bib_data.issued["date-parts"][0]})</span>
      </td>
    </tr>
  `,
};

export const styles = {
  numeric: numeric,
  alphabetic: alphabetic,
};
