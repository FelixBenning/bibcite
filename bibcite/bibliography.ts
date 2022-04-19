import { Data } from "csl-json";
import { Citation } from "./citation";
import { sortingFunctions } from "./sorting";


export class Bibliography {
  _bib: { [k: string]: Data }; // hashed and sorted CSL-json data
  _citations: Citation[] = []; // list of citations
  _sorting=sortingFunctions["nameYearTitle"];

  // key pointing to idx of first citation using it
  _key_use: Map<string, number[]> = new Map();

  constructor(csl_json: Data[]) {
    this._bib = this.sort_and_hash(csl_json, this._sorting);
    console.log("Parsed CSL:", this._bib);
  }

  sort_and_hash(csl_json: Data[], comparison){
    return Object.fromEntries(
      csl_json
      // sort function should be argument of this function and be better
        .sort((a, b) => comparison(a, b))
        .map((citation) => [citation.id, citation])
    );
  }

  set sorting(value) {
    if (typeof value === 'string') {
      this._sorting = sortingFunctions[value];
    } else {
      this._sorting = value;
    }
    this._bib = this.sort_and_hash(this.bib, this._sorting);
  }
  get sorting() {
    return this._sorting;
  }


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

  set bib(value:Data[]) {
    this._bib = this.sort_and_hash(value, this._sorting);
  }

  get bib() {
    return Object.values(this._bib);
  }

  provide_reference(key) {
    return this._bib[key];
  }
}
