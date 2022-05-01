import { Data } from "csl-json";
import { BibController } from "./bibController";
import { CiteStyle, CiteType, ensureCiteType } from "./styles/types";
import { et_al_ify } from "./styles/helpers";
import { adjacent_before, adjacent_after } from "./white-space-helper";

export class Citation extends HTMLElement {
  _myController: BibController;
  _connected: boolean;
  _bibIndex: number; // index provided by Bibliography if inform_citations in BibOrder of CiteStyle
  _bibData: Data;
  _citeStyle: CiteStyle;
  _citeType: CiteType; // e.g. text-cite: like Author (Year) found... / paren-cite: the sky is blue (Author Year)
  _adjBefore: Citation;
  _adjAfter: Citation;

  constructor() {
    super();
  }

  set myController(value: BibController) {
    this._myController = value;
  }

  set bibIndex(value) {
    this._bibIndex = value;
    if (this.sufficient_information()) this.render();
  }
  set citeStyle(citeStyle: CiteStyle) {
    this._citeStyle = citeStyle;
    if (this.sufficient_information()) this.render();
  }
  set bibData(bibData: Data) {
    this._bibData = bibData;
    if (this.sufficient_information()) this.render();
  }

  sufficient_information(): boolean {
    return (
      Boolean(this._citeStyle) &&
      Boolean(this._bibData) &&
      (Boolean(this._bibIndex) || !this._citeStyle.order.inform_citations)
    );
  }

  get key() {
    return this.getAttribute("key");
  }

  get citeType(): CiteType {
    if (!this._citeType) {
      this.citeType = this.getAttribute("type");
    }
    return this._citeType;
  }

  set citeType(value: string | undefined) {
    this._citeType = ensureCiteType(value);
  }
  render_text_cite() {
    return (
      `<a href=#${this.key}>` +
      et_al_ify(this._bibData.author) +
      " " +
      this._citeStyle.enclosing[0] +
      this._citeStyle.identifier(this._bibData, this._bibIndex, this.citeType) +
      this._citeStyle.enclosing[1] +
      `</a>`
    );
  }
  render_raw_cite() {
    return (
      `<a href=#${this.key}>` +
      this._citeStyle.identifier(this._bibData, this._bibIndex, this.citeType) +
      "</a>"
    );
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

  set adjBefore(value: Citation) {
    this._adjBefore = value;
    if (this.sufficient_information()) this.render();
  }

  set adjAfter(value: Citation) {
    this._adjAfter = value;
    if (this.sufficient_information()) this.render();
  }

  connectedCallback() {
    this.adjBefore = adjacent_before<Citation>(this);
    this.adjAfter = adjacent_after<Citation>(this);
    if (this._adjBefore) {
      this._adjBefore.adjAfter = this;
    }
    if (this._adjAfter) {
      this._adjAfter.adjBefore = this;
    }

    // attributeChangedCallback happens before connection to DOM
    // need to register when connected for correct bubbling
    if (this.key) this.triggerCitationAdded();
    this._connected = true;
  }
  disconnectedCallback() {
    if (this.key) this.triggerCitationRemoved();
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
      bubbles: false, // dispatched on myController
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
    console.log(
      `[Citation] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`
    );
    if (name === "key") {
      // if an old value exists we need to unregister from the bibliography
      if (oldValue) this.triggerCitationRemoved();
      // and register with the new value if it exists (see connectedCallback)
      if (this._connected && newValue) this.triggerCitationAdded();
    } else if (name === "type") {
      this.citeType = newValue;
      if (this.sufficient_information()) this.render();
    }
  }
}
