/**
 *  Compare with https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Whitespace#whitespace_helper_functions
 *
 * Throughout, whitespace is defined as one of the characters
 *  "\t" TAB \u0009
 *  "\n" LF  \u000A
 *  "\r" CR  \u000D
 *  " "  SPC \u0020
 *
 * This does not use Javascript's "\s" because that includes non-breaking
 * spaces (and also some other characters).
 */

/**
 * Determine whether a node's text content is entirely whitespace.
 *
 * @param nod  A node implementing the |CharacterData| interface (i.e.,
 *             a |Text|, |Comment|, or |CDATASection| node
 * @return     True if all of the text content of |nod| is whitespace,
 *             otherwise false.
 */
function is_all_ws(nod: Node): boolean {
  // Use ECMA-262 Edition 3 String and RegExp features
  return !/[^\t\n\r ]/.test(nod.textContent);
}

/**
 * Determine if a node should be ignored by the iterator functions.
 *
 * @param nod  An object implementing the DOM1 |Node| interface.
 * @return     true if the node is:
 *                1) A |Text| node that is all whitespace
 *                2) A |Comment| node
 *             and otherwise false.
 */

function is_ignorable(nod: Node): boolean {
  return (
    nod.nodeType == 8 || // A comment node
    (nod.nodeType == 3 && is_all_ws(nod))
  ); // a text node, all ws
}

/**
 * Version of |previousSibling| that skips nodes that are entirely
 * whitespace or comments.  (Normally |previousSibling| is a property
 * of all DOM nodes that gives the sibling node, the node that is
 * a child of the same parent, that occurs immediately before the
 * reference node.)
 *
 * @param sib  The reference node.
 * @return     Either:
 *               0) The closest previous sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               1) null if no such node exists.
 */
function node_before(sib: Node): Node {
  while ((sib = sib.previousSibling)) {
    if (!is_ignorable(sib)) return sib;
  }
  return null;
}

/**
 * Version of |nextSibling| that skips nodes that are entirely
 * whitespace or comments.
 *
 * @param sib  The reference node.
 * @return     Either:
 *               1) The closest next sibling to |sib| that is not
 *                  ignorable according to |is_ignorable|, or
 *               2) null if no such node exists.
 */
function node_after(sib: Node): Node {
  while ((sib = sib.nextSibling)) {
    if (!is_ignorable(sib)) return sib;
  }
  return null;
}

function isElement(node: Node): node is Element {
  return node?.nodeType === Node.ELEMENT_NODE;
}

export function adjacent_before<T extends Element>(sib: T): T {
  const prev_node = node_before(sib);
  if(isElement(prev_node)) {
    if(prev_node.tagName === sib.tagName) {
      return <T> prev_node;
    }
  }
  return null;
}
export function adjacent_after<T extends Element>(sib: T): T {
  const prev_node = node_after(sib);
  if(isElement(prev_node)) {
    if(prev_node.tagName === sib.tagName) {
      return <T> prev_node;
    }
  }
  return null;
}
