import { Data } from "csl-json";
import { BibController } from "./bibController";
import {
  CiteStyle,
  CiteType,
  ensureCiteType,
  et_al_ify,
  isCiteType,
} from "./style-packs";

export class Citation extends HTMLElement {
  _myController: BibController;
  _connected: boolean;
  _bibIndex: number; // index provided by Bibliography if inform_citations in BibOrder of CiteStyle
  _bibData: Data;
  _citeStyle: CiteStyle;
  _citeType: CiteType;

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

  sufficient_information() {
    return (
      this._citeStyle &&
      this._bibData &&
      (this._bibIndex || this._citeStyle.order.inform_citations)
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

  render() {
    switch (this.citeType) {
      case "text-cite":
        this.innerHTML = `<a href=#${this.key}>
          ${et_al_ify(this._bibData.author)}
          ${this._citeStyle.enclosing[0]}${this._citeStyle.identifier(
          this._bibIndex,
          this._bibData,
          this.citeType
        )}${this._citeStyle.enclosing[1]}
          </a>`;
        break;
      case "raw-cite": // Fallthrough
      case "paren-cite":
        this.innerHTML = `<a href=#${this.key}>
            ${this._citeStyle.identifier(
              this._bibIndex,
              this._bibData,
              this.citeType
            )}
          </a>`;
        break;
    }
  }

  connectedCallback() {
    // attributeChangedCallback happens before connection to DOM
    // need to register when connected for correct bubbling
    if (this.key) this.triggerCitationAdded();
    this._connected = true;
  }
  disconnectedCallback() {
    if (this.key) this.triggerCitationRemoved();
    this._connected = false;
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
