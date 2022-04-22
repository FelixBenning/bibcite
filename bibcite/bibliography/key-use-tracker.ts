import { Citation } from "../citation";

type KeyGroup = { index: number; citations: Citation[] };

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

export class CitationKeyUse {
  _used_keys: Map<string, KeyGroup>;
  _length: number = 0;

  constructor(used_keys: Map<string, KeyGroup>) {
    this._used_keys = used_keys;
  }

  add(ci: Citation): { need_ref_update: boolean } {
    if (this._used_keys.has(ci.key)) {
      const entry = this._used_keys.get(ci.key);
      entry.citations.push(ci); // add citations to entry
      ci.bibIndex = entry.index;
      return { need_ref_update: false };
    } else {
      this._length += 1;
      const entry = {
        index: this._length,
        citations: [ci],
      };
      this._used_keys.set(ci.key, entry);
      return { need_ref_update: true };
    }
  }

  remove(ci: Citation): { index: number; need_ref_update: boolean } {
    const ci_list = this._used_keys.get(ci.key).citations;
    if (ci_list.length <= 1) {
      this._used_keys.delete(ci.key);
      return { index: 0, need_ref_update: true };
    } else {
      const idx = ci_list.indexOf(ci);
      ci_list.splice(idx, 1); // remove citation from list
      return { index: idx, need_ref_update: false };
    }
  }
  has(key: string) {
    return this._used_keys.has(key);
  }

  get() {
    return this._used_keys;
  }
}

export class BibSortedCitationKeyUse extends CitationKeyUse {
  _key_order: Map<string, number>;
  constructor(
    used_keys: Map<string, KeyGroup>,
    key_order: Map<string, number>
  ) {
    super(used_keys);
    this._key_order = key_order;
    this.sort_used_keys();
  }

  sort_used_keys() {
    const sorted = [...this._used_keys].sort(
      ([key1, _1], [key2, _2]) =>
        this._key_order.get(key1) - this._key_order.get(key2)
    );
    sorted.forEach(([_, entry], idx) => {
      entry.index = idx;
      entry.citations.forEach((ci) => (ci.bibIndex = idx));
    });
    this._used_keys = new Map(sorted);
  }

  add(ci: Citation) {
    const result = super.add(ci);
    if (result.need_ref_update) {
      this.sort_used_keys();
    }
    return result;
  }

  remove(ci: Citation) {
    const result = super.remove(ci);
    if (result.need_ref_update) {
      this.sort_used_keys();
    }
    return result;
  }
}

export class InsertionSortedCitationKeyUse extends CitationKeyUse {
  _safe_to_append_key = (_: Citation) => true; // no order issues at first

  constructor(used_keys: Map<string, KeyGroup>) {
    super(used_keys);
    this.sort_used_keys();
  }

  sort_used_keys() {
    // sort lists of citations for every key
    this._used_keys.forEach((entry) => entry.citations.sort(docPosComp).at(0));
    const sorted = [...this._used_keys].sort(
      ([_key1, keyGroup1], [_key2, keyGroup2]) =>
        docPosComp(
          // compare document position of first citation (i.e. .at(0))
          keyGroup1.citations.at(0),
          keyGroup2.citations.at(0)
        )
    );

    sorted.forEach(([_, entry], idx) => (entry.index = idx));
    this._length = sorted.length;
    if (this._length == 0) {
      this._safe_to_append_key = (_: Citation) => true;
    } else {
      this._safe_to_append_key = (other) =>
        docPosComp(sorted.at(-1)[1].citations.at(0), other) < 0;
    }
    this._used_keys = new Map(sorted);

    // tell citations new index
    this._used_keys.forEach((entry) =>
      entry.citations.forEach((c) => (c.bibIndex = entry.index))
    );
  }

  add(ci: Citation) {
    const update = super.add(ci).need_ref_update;
    if (update) {
      if (this._safe_to_append_key(ci)) {
        this._safe_to_append_key = (other) => docPosComp(ci, other) < 0;
      } else {
        this.sort_used_keys();
      }
    }
    return { need_ref_update: update };
  }

  remove(ci: Citation) {
    const idx = super.remove(ci).index;

    if (idx == 0) {
      this.sort_used_keys();
    }
    return { index: idx, need_ref_update: idx == 0 };
  }
}
