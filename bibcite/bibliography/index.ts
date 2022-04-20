// AVOID DOM RELATED STUFF HERE! -> allow use in build-time mechanism

import { Data } from "csl-json";
import { Citation } from "../citation";
import { References } from "../references";
import { sortingFunctions } from "./sorting";


export class Bibliography {
  _bib: { [k: string]: Data }; // hashed and sorted CSL-json data
  _citations: Citation[] = []; // list of citations
  _reference_lists: References[] = []; // list of reference-lists
  _sorting=sortingFunctions["nameYearTitle"];
  _citationStyle="numeric";

  // key pointing to idx of first citation using it
  _key_use: Map<string, number[]> = new Map();

  constructor(csl_json: Data[]) {
    this._bib = this.sort_and_hash(csl_json, this._sorting);
    console.log("[Bibliography] Sorted & Hashed CSL:", this._bib);
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

  registerCitation(citationElement) {
    if (
      this._citations.length == 0 ||
      this._citations.at(-1).compareDocumentPosition(citationElement) ==
        Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      //append
      citationElement.index = this._citations.length; // previous length is index of new
      this._citations.push(citationElement);
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
    console.log(`[Bibliography] Registered ${citationElement.key}`);
  }

  unregisterCitation(index) {
    /* TODO */
  }

  registerReferenceList(referenceElement) {
    this._reference_lists.push(referenceElement);
    console.log('[Bibliography] Registered ReferenceList');
  }
  unregisterReferenceList(referenceElement) {
    this._reference_lists = this._reference_lists.filter(l => l != referenceElement );
    console.log('[Bibliography] Unregistered ReferenceList');
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
