// AVOID DOM RELATED STUFF HERE! -> allow use in build-time mechanism

import { Data } from "csl-json";
import { Citation } from "../citation";
import { BibReference } from "../bibReference";
import { comparisons } from "./sorting";
import { UsedKeys, SortedUsedKeys } from "./key-use-tracker";

export class Bibliography {
  _bib: Map<string, Data>; // hashed and sorted CSL-json data
  _reference_lists: BibReference[] = []; // list of <bib-reference> elements
  _sorting = comparisons["nameYearTitle"];
  _citationStyle = "numeric";
  _used_keys: UsedKeys;
  _identifier: (d: Data) => string = (csl_data) => "";

  constructor(csl_json: Data[]) {
    this._bib = this.sort_and_hash(csl_json, this._sorting);
    console.log("[Bibliography] Sorted & Hashed CSL:", this._bib);

    if (this.sorting.name === "insertion") {
      this._used_keys = new SortedUsedKeys(new Map());
    } else {
      this._used_keys = new UsedKeys(new Map());
    }
  }

  sort_and_hash(csl_json: Data[], comparison) {
    return new Map(
      csl_json
        // sort function should be argument of this function and be better
        .sort((a, b) => comparison(a, b))
        .map((citation) => [citation.id, citation])
    );
  }

  set sorting(value: string | ((c1: Data, c2: Data) => number)) {
    const new_sorting: (c1: Data, c2: Data) => number =
      typeof value === "string" ? comparisons[value] : value;

    if (this.sorting === new_sorting) {
      return;
    } else if (new_sorting.name === "insertion") {
      // we need to track insertion order
      this._used_keys = new SortedUsedKeys(this._used_keys.get());
    } else if (this.sorting.name == "insertion") {
      // we can stop keeping track
      this._used_keys = new UsedKeys(this._used_keys.get());
    }
    this._bib = this.sort_and_hash(this.bib, new_sorting);
    this._sorting = new_sorting;
  }
  get sorting(): (c1: Data, c2: Data) => number {
    return this._sorting;
  }

  registerCitation(ci: Citation) {
    if (this._used_keys.add(ci).need_ref_update) {
      for (const bib_ref of this._reference_lists) {
        bib_ref.update(this.used_references());
      }
    }
    ci.citationStyle = this._citationStyle;
    ci.bibInfo = this._bib[ci.key];
    console.log(`[Bibliography] Registered ${ci.key}`);
  }

  unregisterCitation(ci: Citation) {
    if (this._used_keys.remove(ci).need_ref_update) {
      for (const bib_ref of this._reference_lists) {
        bib_ref.update(this.used_references());
      }
    }
  }

  used_references(): { identifier: string; csl_data: Data }[] {
    if (this.sorting.name === "insertion") {
      return Array.from(this._used_keys.get()).map(([key, entry]) => {
        return { identifier: entry.id, csl_data: this._bib[key] };
      });
    } else {
      return Array.from(this._bib)
        .filter(([key, _]) => this._used_keys.has(key))
        .map(([_, csl_data]) => {
          return { identifier: this._identifier(csl_data), csl_data: csl_data };
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
    this._bib = this.sort_and_hash(value, this._sorting);
  }

  get bib() {
    return Array.from(this._bib.values());
  }
}
