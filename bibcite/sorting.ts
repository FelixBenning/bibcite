import { Data } from "csl-json";

export type BibOrder = {comparison: (c1:Data,c2:Data)=>number, inform_citations:boolean};

export function nameYearTitle(
  citation_1: Data,
  citation_2: Data
) {

  /* NAME */
  const author_1 = citation_1.author[0];
  const author_2 = citation_2.author[0];

  // family name
  let cmp = author_1.family.localeCompare(author_2.family);
  if (cmp !=0 ) {
    return cmp;
  }

  // given name
  cmp = author_1.given.localeCompare(author_2.given)
  if (cmp != 0) {
    return cmp;
  }

  /* YEAR */
  const year_1:number = <number><unknown> citation_1.issued["date-parts"][0];
  const year_2:number = <number><unknown> citation_2.issued["date-parts"][0];
  cmp = year_1-year_2;
  if (cmp != 0) {
    return cmp;
  }

  /* TITLE */
  return citation_1.title.localeCompare(citation_2.title);
}

export function insertion(
  citation_1: Data,
  citation_2: Data
){
  return 0; // all are equivalent -> do not sort
}

export const comparisons = {
  nameYearTitle: nameYearTitle,
  nyt: nameYearTitle,
  insertion: insertion
}