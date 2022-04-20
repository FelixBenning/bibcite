import { Citation } from "./citation";

export class CitationList<T extends Citation> {
  // key pointing to idx of first citation using it
  _citations: Array<T>;
  _key_use: Map<string, Citation[]>; // fast key to citations mapping
  

  constructor(){
    this._citations = new Array<T>();
    this._key_use= new Map();
  }

  /**
   * returns index of the last element preceding value
   */
  bisect(value: T): number {
    let low: number = 0;
    let high: number = this._citations.length;
    let mid: number;
    while (low < high) {
      mid = (low + high) >>> 1; // floor(average(low, high))
      const cmp = this._citations.at(mid).compareDocumentPosition(value);
      // if value is after mid, increase lower bound to mid
      low = cmp == Node.DOCUMENT_POSITION_FOLLOWING ? mid : low;
      // if value is before mid, reduce upper bound to mid
      high = cmp == Node.DOCUMENT_POSITION_PRECEDING ? mid : high;
    }
    return mid;
  }

  /**
   * Inserts items into SortedArray
   * @param items to be inserted
   * @returns new length of the array
   */
  insert(...items: T[]): number {
    for (const item of items) {
      const prec_index = this.bisect(item);
      item.index = prec_index +1;
      this._citations.splice(prec_index, 0, item);
      for(const following_item of this._citations.slice(prec_index +2, -1)){
        following_item.index += 1; // tell following items to shuffle right 
      }
      const usage_list = this._key_use.get(item.key);
      if (usage_list) {
        // TODO: replace with bisection insert
        usage_list.push(item);
        usage_list.sort((a,b) => a.index - b.index);
      } else if (typeof usage_list == "undefined") {
        this._key_use.set(item.key, [item]);
      } else {
        /* Since we use _key_use to generate the Reference list, there should never
          be an empty usage_list. If this clause happens we likely have not
          cleaned up on a deletion event properly */
        console.error(
          `[CitationList] An empty (or otherwise falsy) usage_list was found at ${item.key}.`
        );
      }
    }
    return this._citations.length;
  }

  remove(...items: T[]): number {
    for(const item of items) {
      // usage list
      const usage_list = this._key_use.get(item.key)
      if(usage_list.length <= 1) {
        // do not leave empty list
        this._key_use.delete(item.key);
      } else {
        usage_list.splice(usage_list.indexOf(item), 1);
      }
      const pos = item.index;
      this._citations.splice(pos, 1); // remove one item at index pos
      for (const following_member of this._citations.slice(pos, -1)){
        following_member.index -= 1; // reduce index of all following
      }
    }
    return this._citations.length;
  }


  /**
   * Attempts to append the items first (checking if that ensures the right order)
   * otherwise fallback to insert
   * @param items Items to append (will be sorted in-place!)
   * @returns new length of the array
   */
  push(...items: T[]): number {
    if (
      this._citations.length == 0 ||
      this._citations.at(-1).compareDocumentPosition(items.sort().at(0)) ==
        Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      for (const [idx, item] of items.entries()) {
        item.index = this._citations.length + idx;
      }
      this._citations.push(...items); // can just append because value follows last one
    } else {
      // need to actually find right position
      this.insert(...items);
    }
    return this._citations.length;
  }
}
