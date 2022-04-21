// AVOID DOM RELATED STUFF HERE! -> allow use in build-time mechanism

import { Data } from "csl-json";
import { Citation } from "../citation";
import { References } from "../references";
import { sortingFunctions } from "./sorting";
import { CitationList } from "../CitationList";

function docPosComparison(a: HTMLElement, b: HTMLElement) {
  switch (a.compareDocumentPosition(b)) {
    case Node.DOCUMENT_POSITION_FOLLOWING:
      return -1;
    case Node.DOCUMENT_POSITION_PRECEDING:
      return 1;
    default:
      return 0;
  }
}

export class Bibliography {
  _bib: { [k: string]: Data }; // hashed and sorted CSL-json data
  _citations: CitationList<Citation> = new CitationList<Citation>(); // list of citations
  _reference_lists: References[] = []; // list of reference-lists
  _sorting = sortingFunctions["nameYearTitle"];
  _citationStyle = "numeric";
  _used_keys: Map<string, Citation[]> = new Map<string, Citation[]>();
  _safe_to_append_key = (_: Citation) => true; // no order issues at first

  // // key pointing to idx of first citation using it
  // _key_use: Map<string, number[]> = new Map();

  constructor(csl_json: Data[]) {
    this._bib = this.sort_and_hash(csl_json, this._sorting);
    console.log("[Bibliography] Sorted & Hashed CSL:", this._bib);
  }

  sort_and_hash(csl_json: Data[], comparison) {
    return Object.fromEntries(
      csl_json
        // sort function should be argument of this function and be better
        .sort((a, b) => comparison(a, b))
        .map((citation) => [citation.id, citation])
    );
  }

  set sorting(value) {
    if (typeof value === "string") {
      this._sorting = sortingFunctions[value];
    } else {
      this._sorting = value;
    }
    this._bib = this.sort_and_hash(this.bib, this._sorting);
  }
  get sorting() {
    return this._sorting;
  }

  sort_used_keys() {
    this._used_keys.forEach((ci) => ci.sort(docPosComparison)); // sort lists of citations
    const sorted = [...this._used_keys].sort((a, b) =>
      docPosComparison((<Citation[]>a.at(1)).at(0), (<Citation[]>b.at(1)).at(0))
    );

    // make references new
    // tell citations new identifier

    return new Map<string, Citation[]>(sorted);
  }

  registerCitation(ci: Citation) {
    if (this._used_keys.has(ci.key)) {
      this._used_keys.get(ci.key).push(ci);
    } else if (this._safe_to_append_key(ci)) {
      this._used_keys.set(ci.key, [ci]);
      this._safe_to_append_key = (other) => docPosComparison(ci, other) < 0;
    } else {
      this._used_keys.set(ci.key, [ci]);
      this.sort_used_keys();
    }

    this._citations.push(ci);

    ci.citationStyle = this._citationStyle;
    ci.info = {
      identifier: ci.index.toString(),
      bibInfo: this._bib[ci.key],
    };
    console.log(`[Bibliography] Registered ${ci.key}`);
  }

  unregisterCitation(citationElement: Citation) {
    // remove from citations list
    this._citations.remove(citationElement);
  }

  registerReferenceList(referenceElement) {
    this._reference_lists.push(referenceElement);
    console.log("[Bibliography] Registered ReferenceList");
  }
  unregisterReferenceList(referenceElement) {
    this._reference_lists = this._reference_lists.filter(
      (l) => l != referenceElement
    );
    console.log("[Bibliography] Unregistered ReferenceList");
  }

  set bib(value: Data[]) {
    this._bib = this.sort_and_hash(value, this._sorting);
  }

  get bib() {
    return Object.values(this._bib);
  }

  provide_reference(key) {
    return this._bib[key];
  }
}
