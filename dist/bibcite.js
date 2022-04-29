'use strict';

/*! *****************************************************************************
Copyright (c) Microsoft Corporation.

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES WITH
REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF MERCHANTABILITY
AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR ANY SPECIAL, DIRECT,
INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES WHATSOEVER RESULTING FROM
LOSS OF USE, DATA OR PROFITS, WHETHER IN AN ACTION OF CONTRACT, NEGLIGENCE OR
OTHER TORTIOUS ACTION, ARISING OUT OF OR IN CONNECTION WITH THE USE OR
PERFORMANCE OF THIS SOFTWARE.
***************************************************************************** */

function __awaiter(thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
}

function docPosComp(a, b) {
    switch (a.compareDocumentPosition(b)) {
        case Node.DOCUMENT_POSITION_FOLLOWING:
            return -1;
        case Node.DOCUMENT_POSITION_PRECEDING:
            return 1;
        default:
            return 0;
    }
}
class CitationKeyUse {
    constructor(used_keys) {
        this._length = 0;
        this._used_keys = used_keys;
    }
    add(ci) {
        if (this._used_keys.has(ci.key)) {
            const entry = this._used_keys.get(ci.key);
            entry.citations.push(ci); // add citations to entry
            ci.bibIndex = entry.index;
            return { need_ref_update: false };
        }
        else {
            this._length += 1;
            const entry = {
                index: this._length,
                citations: [ci],
            };
            this._used_keys.set(ci.key, entry);
            ci.bibIndex = entry.index;
            return { need_ref_update: true };
        }
    }
    remove(ci) {
        const ci_list = this._used_keys.get(ci.key).citations;
        if (ci_list.length <= 1) {
            this._used_keys.delete(ci.key);
            return { index: 0, need_ref_update: true };
        }
        else {
            const idx = ci_list.indexOf(ci);
            ci_list.splice(idx, 1); // remove citation from list
            return { index: idx, need_ref_update: false };
        }
    }
    has(key) {
        return this._used_keys.has(key);
    }
    get citations() {
        return Array.from(this._used_keys.values())
            .map((keyGroup) => keyGroup.citations)
            .flat(1);
    }
    get() {
        return this._used_keys;
    }
}
class BibSortedCitationKeyUse extends CitationKeyUse {
    constructor(used_keys, key_order) {
        super(used_keys);
        this._key_order = key_order;
        this.sort_used_keys();
    }
    sort_used_keys() {
        const sorted = [...this._used_keys].sort(([key1, _1], [key2, _2]) => this._key_order.get(key1) - this._key_order.get(key2));
        sorted.forEach(([_, entry], idx) => {
            entry.index = idx;
            entry.citations.forEach((ci) => (ci.bibIndex = idx));
        });
        this._used_keys = new Map(sorted);
    }
    add(ci) {
        const result = super.add(ci);
        if (result.need_ref_update) {
            this.sort_used_keys();
        }
        return result;
    }
    remove(ci) {
        const result = super.remove(ci);
        if (result.need_ref_update) {
            this.sort_used_keys();
        }
        return result;
    }
}
class InsertionSortedCitationKeyUse extends CitationKeyUse {
    constructor(used_keys) {
        super(used_keys);
        this._safe_to_append_key = (_) => true; // no order issues at first
        this.sort_used_keys();
    }
    sort_used_keys() {
        // sort lists of citations for every key
        this._used_keys.forEach((entry) => entry.citations.sort(docPosComp).at(0));
        const sorted = [...this._used_keys].sort(([_key1, keyGroup1], [_key2, keyGroup2]) => docPosComp(
        // compare document position of first citation (i.e. .at(0))
        keyGroup1.citations.at(0), keyGroup2.citations.at(0)));
        sorted.forEach(([_, entry], idx) => (entry.index = idx));
        this._length = sorted.length;
        if (this._length == 0) {
            this._safe_to_append_key = (_) => true;
        }
        else {
            this._safe_to_append_key = (other) => docPosComp(sorted.at(-1)[1].citations.at(0), other) < 0;
        }
        this._used_keys = new Map(sorted);
        // tell citations new index
        this._used_keys.forEach((entry) => entry.citations.forEach((c) => (c.bibIndex = entry.index)));
    }
    add(ci) {
        const update = super.add(ci).need_ref_update;
        if (update) {
            if (this._safe_to_append_key(ci)) {
                // a new reference was added, it was safe to append, so ci was the the
                // first usage of it and it came after all other references. The next
                // new reference needs to come after to be safe to append.
                this._safe_to_append_key = (other) => docPosComp(ci, other) < 0;
            }
            else {
                this.sort_used_keys();
            }
        }
        return { need_ref_update: update };
    }
    remove(ci) {
        const idx = super.remove(ci).index;
        if (idx == 0) {
            this.sort_used_keys();
        }
        return { index: idx, need_ref_update: idx == 0 };
    }
}

// AVOID DOM RELATED STUFF HERE! -> allow use in build-time mechanism
class Bibliography {
    constructor(csl_json, sorting) {
        this._reference_lists = []; // list of <bib-reference> elements
        this._bibOrder = { comparison: sorting, inform_citations: false };
        this.bib = csl_json;
        if (this._bibOrder.comparison.name === "insertion") {
            this._cite_key_use = new InsertionSortedCitationKeyUse(new Map());
        }
        else if (this._bibOrder.inform_citations) {
            this._cite_key_use = new BibSortedCitationKeyUse(new Map(), new Map(Array.from(this._bib.keys()).map((k, idx) => [k, idx])));
        }
        else {
            this._cite_key_use = new CitationKeyUse(new Map());
        }
    }
    sort_and_hash(csl_json, comparison) {
        return new Map(csl_json
            // sort function should be argument of this function and be better
            .sort((a, b) => comparison(a, b))
            .map((citation) => [citation.id, citation]));
    }
    set sorting(new_sorting) {
        this._bib = this.sort_and_hash(this.bib, new_sorting.comparison);
        if (new_sorting.comparison.name === "insertion" &&
            this._bibOrder.comparison.name != "insertion") {
            // we need to track insertion order
            this._cite_key_use = new InsertionSortedCitationKeyUse(this._cite_key_use.get());
        }
        else if (new_sorting.inform_citations) {
            this._cite_key_use = new BibSortedCitationKeyUse(this._cite_key_use.get(), new Map(Array.from(this._bib.keys()).map((k, idx) => [k, idx])));
        }
        else {
            // we can stop keeping track
            this._cite_key_use = new CitationKeyUse(this._cite_key_use.get());
        }
        this._bibOrder = new_sorting;
    }
    registerCitation(ci) {
        // important side-effect in if clause!
        if (this._cite_key_use.add(ci).need_ref_update) {
            for (const bib_ref of this._reference_lists) {
                bib_ref.usedReferences = this.used_references();
            }
        }
        ci.bibData = this._bib.get(ci.key);
        console.log(`[Bibliography] Registered ${ci.key}`);
    }
    unregisterCitation(ci) {
        // important side-effect in if clause!
        if (this._cite_key_use.remove(ci).need_ref_update) {
            for (const bib_ref of this._reference_lists) {
                bib_ref.usedReferences = this.used_references();
            }
        }
    }
    get citations() {
        return this._cite_key_use.citations;
    }
    used_references() {
        if (this._bibOrder.comparison.name === "insertion") {
            return Array.from(this._cite_key_use.get()).map(([key, entry]) => {
                return { index: entry.index, csl_data: this._bib.get(key) };
            });
        }
        else {
            return Array.from(this._bib)
                .filter(([key, _]) => this._cite_key_use.has(key))
                .map(([_, csl_data], idx) => {
                return { index: idx, csl_data: csl_data };
            });
        }
    }
    registerReferenceList(bibReference) {
        this._reference_lists.push(bibReference);
        bibReference.usedReferences = this.used_references();
        console.log("[Bibliography] Registered ReferenceList");
    }
    unregisterReferenceList(referenceElement) {
        this._reference_lists = this._reference_lists.filter((l) => l != referenceElement);
        console.log("[Bibliography] Unregistered ReferenceList");
    }
    set bib(value) {
        this._bib = this.sort_and_hash(value, this._bibOrder.comparison);
        console.log("[Bibliography] Sorted & Hashed CSL:", this._bib);
    }
}

function nameYearTitle(citation_1, citation_2) {
    /* NAME */
    const author_1 = citation_1.author[0];
    const author_2 = citation_2.author[0];
    // family name
    let cmp = author_1.family.localeCompare(author_2.family);
    if (cmp != 0) {
        return cmp;
    }
    // given name
    cmp = author_1.given.localeCompare(author_2.given);
    if (cmp != 0) {
        return cmp;
    }
    /* YEAR */
    const year_1 = citation_1.issued["date-parts"][0];
    const year_2 = citation_2.issued["date-parts"][0];
    cmp = year_1 - year_2;
    if (cmp != 0) {
        return cmp;
    }
    /* TITLE */
    return citation_1.title.localeCompare(citation_2.title);
}
function insertion(citation_1, citation_2) {
    return 0; // all are equivalent -> do not sort
}

function alphabetic_identifier(_, bibData) {
    return (letters(bibData.author) +
        bibData.issued["date-parts"][0][0].toString().slice(-2));
}
function letters(authors) {
    switch (authors.length) {
        case 0:
            return "?";
        case 1:
            return authors.at(0).family.slice(0, 3).toUpperCase();
        default:
            return authors
                .map((p) => p.family.at(0))
                .join("")
                .toUpperCase();
    }
}
function et_al_ify(authors) {
    const names = authors.map((p) => p["non-dropping-particle"] || "" + " " + p.family);
    return names[0] + (names.length > 1 ? " et al." : "");
}

const alphabetic = {
    name: "alphabetic",
    order: { comparison: nameYearTitle, inform_citations: false },
    identifier: alphabetic_identifier,
    enclosing: ["[", "]"],
    multiSeparator: ";",
    bib_entry: (index, bib_data) => `
    <tr style="vertical-align:top">
      <td>[${alphabetic_identifier(index, bib_data)}]</td>
      <td><strong>${bib_data.title}</strong>
        <p>
          <span>${bib_data.author.map((p) => p.family).join(", ")}
          </span><span>(${bib_data.issued["date-parts"][0][0]})</span>
        </p>
      </td>
    </tr>
  `,
    reference: (content) => `<h2>References</h2>
  <table>
    ${content}
  </table>
  `,
};

const numeric = {
    name: "numeric",
    order: { comparison: insertion, inform_citations: true },
    enclosing: ["[", "]"],
    multiSeparator: ",",
    identifier: (index, _) => String(index),
    bib_entry: (index, bib_data) => `
    <tr style="vertical-align:top">
      <td>[${index}]</td>
      <td><strong>${bib_data.title}</strong>
      <p>
        <span>${bib_data.author.map((p) => p.family).join(", ")}</span>
        <span>(${bib_data.issued["date-parts"][0][0]})</span>
      </p>
      </td>
    </tr>
  `,
    reference: (content) => `<h2>References</h2>
  <table>
    ${content}
  </table>
  `,
};

let styles = new Map();
const fallbackStyle = alphabetic;
function addStyle(sty) {
    styles.set(sty.name, sty);
}
// default styles
addStyle(numeric);
addStyle(alphabetic);

class BibController extends HTMLElement {
    constructor() {
        super();
        this.listeners = {
            // addEventListener used on these in connectedCallback
            CitationAdded(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("[BibController] caught CitationAdded event");
                    const bib = yield this.bibliography;
                    const citation = event.detail.element;
                    // so that the Citation can fire CitationRemoved on me even when disconnected
                    citation.myController = this;
                    event.stopImmediatePropagation(); // monotheism
                    citation.citeStyle = this.citeStyle;
                    bib.registerCitation(event.detail.element);
                });
            },
            CitationRemoved(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("[BibController] caught CitationRemoved event");
                    const bib = yield this.bibliography;
                    bib.unregisterCitation(event.detail.element);
                });
            },
            ReferenceAdded(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("[BibController] caught ReferenceAdded event");
                    const bib = yield this.bibliography;
                    const bibReference = event.detail.element;
                    // so that ReferenceRemoved can fire on me even when disconnected
                    bibReference.myController = this;
                    event.stopImmediatePropagation(); // monotheism
                    bibReference.citeStyle = this.citeStyle;
                    bib.registerReferenceList(event.detail.element);
                });
            },
            ReferenceRemoved(event) {
                return __awaiter(this, void 0, void 0, function* () {
                    console.log("[BibController] caught ReferenceRemoved event");
                    const bib = yield this.bibliography;
                    bib.unregisterReferenceList(event.detail.element);
                });
            },
        };
    }
    connectedCallback() {
        console.log("[BibController] connectedCallback");
        this._scope =
            this.parentElement === document.head ? document : this.parentElement;
        for (const [functionName, callback] of Object.entries(this.listeners)) {
            console.log(`|- addEventListener: ${functionName}`);
            this._scope.addEventListener(functionName, callback.bind(this));
        }
    }
    disconnectedCallback() {
        console.log("[BibController] disconnectedCallback");
        for (const [functionName, callback] of Object.entries(this.listeners)) {
            console.log(`removeEventListener: ${functionName}`);
            this._scope.removeEventListener(functionName, callback.bind(this));
        }
    }
    static get observedAttributes() {
        return ["bib", "citation-style"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`[BibController] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`);
            switch (name) {
                case "bib":
                    if (!this._bibliography) {
                        this.bibliography; // getter for the initialization side-effect
                    }
                    else {
                        (yield this.bibliography).bib = yield this.csl_from_attribute(newValue);
                    }
                    break;
                case "citation-style":
                    this.citeStyle = styles.get(newValue) || fallbackStyle;
                    break;
                default:
                    console.error(`[BibController] attributeChangedCallback(${name}, ${oldValue}, ${newValue})` +
                        `called with unknown attribute ${name}`);
            }
        });
    }
    set innerHTML(value) {
        console.log("[BibController] set innerHTML");
        super.innerHTML = value;
        if (!this.getAttribute("bib")) {
            // attribute has priority
            this.bibliography.then((res) => (res.bib = JSON.parse(value)));
        }
    }
    propagateCiteStyle(citeStyle) {
        return __awaiter(this, void 0, void 0, function* () {
            const bib = yield this.bibliography;
            bib.citations.forEach((cit) => (cit.citeStyle = citeStyle));
            bib._reference_lists.forEach((ref) => (ref.citeStyle = citeStyle));
        });
    }
    set citeStyle(value) {
        this._citeStyle = value;
        this.propagateCiteStyle(value);
    }
    get citeStyle() {
        if (!this._citeStyle) {
            // default: alphabetic
            this._citeStyle =
                styles.get(this.getAttribute("citation-style")) || fallbackStyle;
        }
        return this._citeStyle;
    }
    get bibliography() {
        if (!this._bibliography) {
            this._bibliography = this.csl_from_attribute(this.getAttribute("bib")).then((csl) => new Bibliography(csl, this.citeStyle.order.comparison));
        }
        return this._bibliography;
    }
    csl_from_attribute(bib_attr) {
        return __awaiter(this, void 0, void 0, function* () {
            // TODO: add option for bib to be callable?
            if (bib_attr) {
                console.log("|- bib attribute present -> fetching");
                const response = yield fetch(bib_attr);
                return yield response.json();
            }
            else if (document.readyState == "loading") {
                console.log("|- bib attribute missing -> waiting for innerHTML");
                return new Promise((resolve, _) => {
                    document.addEventListener("DOMContentLoaded", () => resolve(this.innerHTML));
                }).then(JSON.parse);
            }
            else {
                console.log("|- bib attribute missing -> using innerHTML");
                return JSON.parse(this.innerHTML);
            }
        });
    }
}

const citeTypes = ["text-cite", "raw-cite", "paren-cite"];
function isCiteType(test) {
    return citeTypes.includes(test);
}
function ensureCiteType(value) {
    if (isCiteType(value))
        return value;
    else if (typeof value === "undefined") {
        console.log(`Missing Citation type, fallback to "paren-cite"`);
    }
    else {
        console.error(`[Citation] Unknown Citation type ${value}, fallback to "paren-cite"`);
    }
    return "paren-cite";
}

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
function is_all_ws(nod) {
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
function is_ignorable(nod) {
    return (nod.nodeType == 8 || // A comment node
        (nod.nodeType == 3 && is_all_ws(nod))); // a text node, all ws
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
function node_before(sib) {
    while ((sib = sib.previousSibling)) {
        if (!is_ignorable(sib))
            return sib;
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
function node_after(sib) {
    while ((sib = sib.nextSibling)) {
        if (!is_ignorable(sib))
            return sib;
    }
    return null;
}
function isElement(node) {
    return (node === null || node === void 0 ? void 0 : node.nodeType) === Node.ELEMENT_NODE;
}
function adjacent_before(sib) {
    const prev_node = node_before(sib);
    if (isElement(prev_node)) {
        if (prev_node.tagName === sib.tagName) {
            return prev_node;
        }
    }
    return null;
}
function adjacent_after(sib) {
    const prev_node = node_after(sib);
    if (isElement(prev_node)) {
        if (prev_node.tagName === sib.tagName) {
            return prev_node;
        }
    }
    return null;
}

class Citation extends HTMLElement {
    constructor() {
        super();
    }
    set myController(value) {
        this._myController = value;
    }
    set bibIndex(value) {
        this._bibIndex = value;
        if (this.sufficient_information())
            this.render();
    }
    set citeStyle(citeStyle) {
        this._citeStyle = citeStyle;
        if (this.sufficient_information())
            this.render();
    }
    set bibData(bibData) {
        this._bibData = bibData;
        if (this.sufficient_information())
            this.render();
    }
    sufficient_information() {
        return (Boolean(this._citeStyle) &&
            Boolean(this._bibData) &&
            (Boolean(this._bibIndex) || !this._citeStyle.order.inform_citations));
    }
    get key() {
        return this.getAttribute("key");
    }
    get citeType() {
        if (!this._citeType) {
            this.citeType = this.getAttribute("type");
        }
        return this._citeType;
    }
    set citeType(value) {
        this._citeType = ensureCiteType(value);
    }
    render_text_cite() {
        return (`<a href=#${this.key}>` +
            et_al_ify(this._bibData.author) +
            " " +
            this._citeStyle.enclosing[0] +
            this._citeStyle.identifier(this._bibIndex, this._bibData, this.citeType) +
            this._citeStyle.enclosing[1] +
            `</a>`);
    }
    render_raw_cite() {
        return (`<a href=#${this.key}>` +
            this._citeStyle.identifier(this._bibIndex, this._bibData, this.citeType) +
            "</a>");
    }
    render_paren_cite() {
        const left_delim = this._adjBefore ? "" : this._citeStyle.enclosing[0];
        const right_delim = this._adjAfter
            ? this._citeStyle.multiSeparator
            : this._citeStyle.enclosing[1];
        return left_delim + this.render_raw_cite() + right_delim;
    }
    render() {
        this.innerHTML = this.pre_render();
    }
    pre_render() {
        switch (this.citeType) {
            case "text-cite":
                return this.render_text_cite();
            case "raw-cite":
                return this.render_raw_cite();
            case "paren-cite":
                return this.render_paren_cite();
        }
    }
    set adjBefore(value) {
        this._adjBefore = value;
        if (this.sufficient_information())
            this.render();
    }
    set adjAfter(value) {
        this._adjAfter = value;
        if (this.sufficient_information())
            this.render();
    }
    connectedCallback() {
        this.adjBefore = adjacent_before(this);
        this.adjAfter = adjacent_after(this);
        if (this._adjBefore) {
            this._adjBefore.adjAfter = this;
        }
        if (this._adjAfter) {
            this._adjAfter.adjBefore = this;
        }
        // attributeChangedCallback happens before connection to DOM
        // need to register when connected for correct bubbling
        if (this.key)
            this.triggerCitationAdded();
        this._connected = true;
    }
    disconnectedCallback() {
        if (this.key)
            this.triggerCitationRemoved();
        this._connected = false;
        // inform siblings of departure
        if (this._adjBefore) {
            this._adjBefore.adjAfter = this._adjAfter;
        }
        if (this._adjAfter) {
            this._adjAfter.adjBefore = this._adjBefore;
        }
    }
    triggerCitationAdded() {
        const event = new CustomEvent("CitationAdded", {
            bubbles: true,
            detail: { element: this },
        });
        this.dispatchEvent(event);
    }
    triggerCitationRemoved() {
        const event = new CustomEvent("CitationRemoved", {
            bubbles: false,
            detail: { element: this },
        });
        // can not be dispatched on this as we might be disconnected so bubbling won't work
        this._myController.dispatchEvent(event);
        this._bibIndex = undefined;
        this.removeAttribute("id");
    }
    static get observedAttributes() {
        return ["key", "type"];
    }
    attributeChangedCallback(name, oldValue, newValue) {
        console.log(`[Citation] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`);
        if (name === "key") {
            // if an old value exists we need to unregister from the bibliography
            if (oldValue)
                this.triggerCitationRemoved();
            // and register with the new value if it exists (see connectedCallback)
            if (this._connected && newValue)
                this.triggerCitationAdded();
        }
        else if (name === "type") {
            this.citeType = newValue;
            if (this.sufficient_information())
                this.render();
        }
    }
}

class BibReference extends HTMLElement {
    set myController(value) {
        this._myController = value;
    }
    connectedCallback() {
        const event = new CustomEvent("ReferenceAdded", {
            bubbles: true,
            detail: { element: this },
        });
        this.dispatchEvent(event);
    }
    disconnectedCallback() {
        const event = new CustomEvent("ReferenceRemoved", {
            bubbles: false,
            detail: { element: this },
        });
        this._myController.dispatchEvent(event);
    }
    set citeStyle(style) {
        console.log("[Reference] set citeStyle");
        this._citeStyle = style;
        if (this._usedReferences)
            this.render();
    }
    render() {
        console.log("[Reference] rendering");
        this.innerHTML = this._citeStyle.reference(this._usedReferences
            .map((ref) => this._citeStyle.bib_entry(ref.index, ref.csl_data))
            .join(""));
    }
    set usedReferences(references) {
        console.log("[Reference] set usedReferences", references);
        this._usedReferences = references;
        if (this._citeStyle)
            this.render();
    }
}

customElements.define("bib-config", BibController);
customElements.define("bib-cite", Citation);
customElements.define("bib-references", BibReference);
