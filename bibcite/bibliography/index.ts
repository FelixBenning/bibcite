// AVOID DOM RELATED STUFF HERE! -> allow use in build-time mechanism

import { Data } from "csl-json";
import { Citation } from "../citation";
import { BibReference } from "../bibReference";
import {
  CitationKeyUse,
  BibSortedCitationKeyUse,
  InsertionSortedCitationKeyUse,
} from "./key-use-tracker";

export class Bibliography {
  _bib: Map<string, Data>; // hashed and sorted CSL-json data
  _reference_lists: BibReference[] = []; // list of <bib-reference> elements
  _cite_key_use: CitationKeyUse;
  _sorting: {
    comparison: (c1: Data, c2: Data) => number;
    inform_citations: boolean;
  };

  constructor(csl_json: Data[], sorting: (c1: Data, c2: Data) => number) {
    this._sorting = { comparison: sorting, inform_citations: false };
    this._bib = this.sort_and_hash(csl_json, this._sorting.comparison);
    console.log("[Bibliography] Sorted & Hashed CSL:", this._bib);

    if (this._sorting.comparison.name === "insertion") {
      this._cite_key_use = new InsertionSortedCitationKeyUse(new Map());
    } else if (this._sorting.inform_citations) {
      this._cite_key_use = new BibSortedCitationKeyUse(
        new Map(),
        new Map(Array.from(this._bib.keys()).map((k, idx) => [k, idx]))
      );
    } else {
      this._cite_key_use = new CitationKeyUse(new Map());
    }
  }

  sort_and_hash(csl_json: Data[], comparison:(c1:Data,c2:Data)=>number) {
    return new Map(
      csl_json
        // sort function should be argument of this function and be better
        .sort((a, b) => comparison(a, b))
        .map((citation) => [citation.id, citation])
    );
  }

  set sorting(new_sorting: {
      comparison: (c1: Data, c2: Data) => number;
      inform_citations: boolean;
    }) {
    this._bib = this.sort_and_hash(this.bib, new_sorting.comparison);
    if (
      new_sorting.comparison.name === "insertion" &&
      this._sorting.comparison.name != "insertion"
    ) {
      // we need to track insertion order
      this._cite_key_use = new InsertionSortedCitationKeyUse(
        this._cite_key_use.get()
      );
    } else if (new_sorting.inform_citations) {
      this._cite_key_use = new BibSortedCitationKeyUse(
        this._cite_key_use.get(),
        new Map(Array.from(this._bib.keys()).map((k, idx) => [k, idx]))
      );
    } else {
      // we can stop keeping track
      this._cite_key_use = new CitationKeyUse(this._cite_key_use.get());
    }
    this._sorting = new_sorting;
  }

  registerCitation(ci: Citation) {
    if (this._cite_key_use.add(ci).need_ref_update) {
      for (const bib_ref of this._reference_lists) {
        bib_ref.update(this.used_references());
      }
    }
    ci.bibInfo = this._bib[ci.key];
    console.log(`[Bibliography] Registered ${ci.key}`);
  }

  unregisterCitation(ci: Citation) {
    if (this._cite_key_use.remove(ci).need_ref_update) {
      for (const bib_ref of this._reference_lists) {
        bib_ref.update(this.used_references());
      }
    }
  }

  used_references(): { index: string; csl_data: Data }[] {
    if (this._sorting.comparison.name === "insertion") {
      return Array.from(this._cite_key_use.get()).map(([key, entry]) => {
        return { index: entry.id, csl_data: this._bib[key] };
      });
    } else {
      return Array.from(this._bib)
        .filter(([key, _]) => this._cite_key_use.has(key))
        .map(([_, csl_data], idx) => {
          return { index: String(idx), csl_data: csl_data };
        });
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
    this._bib = this.sort_and_hash(value, this._sorting.comparison);
  }
}
