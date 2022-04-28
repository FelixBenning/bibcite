import { Data, Person } from "csl-json";

export function alphabetic_identifier(_: number, bibData: Data): string {
  return (
    letters(bibData.author) +
    bibData.issued["date-parts"][0][0].toString().slice(-2)
  );
}

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

export function et_al_ify(authors: Person[]): string {
  const names = authors.map(
    (p) => p["non-dropping-particle"] || "" + " " + p.family
  );
  return names[0] + (names.length > 1 ? " et al." : "");
}
