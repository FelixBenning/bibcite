export class SortedArray<T extends HTMLElement> extends Array<T> {
  /**
   * returns index of the last element preceding value
   */
  bisect(value: T): number {
    let low: number = 0;
    let high: number = this.length;
    let mid: number;
    while (low < high) {
      mid = (low + high) >>> 1; // floor(average(low, high))
      const cmp = this.at(mid).compareDocumentPosition(value);
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
      super.splice(this.bisect(item), 0, item);
    }
    return this.length;
  }

  /**
   * Attempts to prepend the items to the array if that does not destroy order
   * otherwise fallback to insert
   * @param items Items to prepend
   * @returns new length of the array
   */
  unshift(...items: T[]): number {
    //reverse because [3,4,5].unshift([1,2]) should be fast
    // so we first have to prepend 2
    for (const item of items.reverse()) {
      if (
        this.length == 0 ||
        this.at(0).compareDocumentPosition(item) ==
          Node.DOCUMENT_POSITION_PRECEDING
      ) {
        super.unshift(item);
      } else {
        this.insert(item);
      }
    }
    return this.length;
  }

  /**
   * Attempts to append the items first (checking if that ensures the right order)
   * otherwise fallback to insert
   * @param items Items to append
   * @returns new length of the array
   */
  push(...items: T[]): number {
    for (const item of items) {
      if (
        this.length == 0 ||
        this.at(-1).compareDocumentPosition(item) ==
          Node.DOCUMENT_POSITION_FOLLOWING
      ) {
        super.push(item); // can just append because value follows last one
      } else {
        // need to actually find right position
        this.insert(item);
      }
    }
    return this.length;
  }
}
