// AVOID DOM RELATED STUFF HERE! -> allow use in build-time mechanism

import { Data } from "csl-json";
import { Citation } from "../citation";
import { References } from "../references";
import { sortingFunctions } from "./sorting";

function docPosComp(a: HTMLElement, b: HTMLElement) {
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
  _reference_lists: References[] = []; // list of reference-lists
  _sorting = sortingFunctions["nameYearTitle"];
  _citationStyle = "numeric";
  _used_keys: Map<string, { pos_id: string; citations: Citation[] }> = new Map();
  _safe_to_append_key = (_: Citation) => true; // no order issues at first

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
    // sort lists of citations for every key
    this._used_keys.forEach((entry) => entry.citations.sort(docPosComp).at(0));
    const sorted = [...this._used_keys].sort((a, b) =>
      docPosComp(
        // compare document position of first citation (i.e. .at(0))
        (<{ pos_id: string; citations: Citation[] }>a.at(1)).citations.at(0),
        (<{ pos_id: string; citations: Citation[] }>b.at(1)).citations.at(0)
      )
    );

    sorted.forEach((value, idx) => (value[1].pos_id = String(idx)));
    this._used_keys = new Map(sorted);

    // tell citations new identifier
    this._used_keys.forEach((entry) =>
      entry.citations.forEach((c) => (c.identifier = entry.pos_id))
    );

    // renew references
    for (const references of this._reference_lists){
      references
    }

  }

  registerCitation(ci: Citation) {
    if (this._used_keys.has(ci.key)) {
      const entry = this._used_keys.get(ci.key);
      entry.citations.push(ci); // add citations to entry
      ci.identifier = entry.pos_id;
    } else if (this._safe_to_append_key(ci)) {
      const entry = {
        pos_id: String(this.sort_used_keys.length),
        citations: [ci],
      };
      this._used_keys.set(ci.key, entry);
      this._safe_to_append_key = (other) => docPosComp(ci, other) < 0;
    } else {
      const entry = {
        pos_id: String(this.sort_used_keys.length),
        citations: [ci],
      };
      this._used_keys.set(ci.key, entry);
      this.sort_used_keys();
    }

    ci.citationStyle = this._citationStyle;
    ci.bibInfo = this._bib[ci.key];
    console.log(`[Bibliography] Registered ${ci.key}`);
  }

  unregisterCitation(ci: Citation) {
    const ci_list = this._used_keys.get(ci.key).citations
    const idx = ci_list.indexOf(ci);
    ci_list.splice(idx, 1); // remove citation from list
    if (idx == 0 /* this was the first occurance*/) {
      this.sort_used_keys()
    }
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
