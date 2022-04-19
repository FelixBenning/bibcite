import { Data, Person } from "csl-json";
import { Citation } from "./citation";

function authorsAlphabeticalComparison(
  authors_1: Person[],
  authors_2: Person[]
) {
  let cmp = authors_1[0].family.localeCompare(authors_2[0].family);
  // TODO: imporve sorting
  // if (cmp !=0 ) {
  return cmp;
  // }
  // cmp = authors_1[0].given.localeCompare(authors_2[0].given)
}

export class Bibliography {
  _bib: { [k: string]: Data };
  _citations: Citation[] = []; // list of citations

  // key pointing to idx of first citation using it
  _key_use: Map<string, number[]> = new Map();

  constructor(csl_json: Data[]) {
    this._bib = Object.fromEntries(
      csl_json
        .sort((a, b) => authorsAlphabeticalComparison(a.author, b.author))
        .map((citation) => [citation.id, citation])
    );
    console.log("Parsed CSL:", this._bib);
  }

  sorting = {
    use: function () {
      console.log("Sort by use");
    },
    alphabet: function () {},
  };

  citation_style = {
    numeric: function () {
      const css = document.createElement("link");
      css.href = "/css/numeric.css";
      css.type = "text/css";
      css.rel = "stylesheet";
      document.head.appendChild(css);
    },
  };

  registerCitation(citationElement) {
    if (
      this._citations.length == 0 ||
      this._citations.at(-1).compareDocumentPosition(citationElement) ==
        Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      //append
      citationElement.index = this._citations.length; // previous length is index of new
      this._citations.push(citationElement);
      console.log(`registered ${citationElement.key}`);
    } else {
      // insertion
      /*TODO*/
      console.log("random insertion not implemented yet");
    }
    // get might return undefined, the comparison is false, if is true
    // (in that case this is the first citation using it, it should be registered)
    if (
      !(this._key_use.get(citationElement.key) >= citationElement.index)
    ) {
      this._key_use[citationElement.key] = citationElement.index;
    }
  }

  unregisterCitation(index) {
    /* TODO */
  }

  set bib(value) {
    this._bib = value;
  }

  get bib() {
    return this._bib;
  }

  provide_reference(key) {
    return this._bib[key];
  }
}
