import { Data } from "csl-json";
import { BibController } from "./bibController";
import { CiteStyle } from "./style-packs";

export class Citation extends HTMLElement {
  _myController: BibController;
  _connected: boolean;
  _bibIndex: number; // index provided by Bibliography if inform_citations in BibOrder of CiteStyle
  _bibData: Data;
  _citeStyle: CiteStyle;

  constructor() {
    super();
  }

  set myController(value: BibController) {
    this._myController = value;
  }

  set bibIndex(value) {
    this._bibIndex = value;
    this.setAttribute("id", `cite_${value}`);
    if (this._citeStyle && this._bibData) this.render();
  }
  set citeStyle(citeStyle: CiteStyle) {
    this._citeStyle = citeStyle;
    if (
      this._bibData &&
      (this._bibIndex || !this._citeStyle.order.inform_citations)
    ) {
      this.render();
    }
    this.classList.add(citeStyle.name);
  }
  set bibData(bibData: Data) {
    this._bibData = bibData;
    if (
      this._citeStyle &&
      (this._bibIndex || !this._citeStyle.order.inform_citations)
    ) {
      this.render();
    }
  }

  get key() {
    return this.getAttribute("key");
  }

  render() {
    this.innerHTML = `
    <a href=#${this.key}>
      ${this._citeStyle.identifier(this._bibIndex, this._bibData)}
    </a>
    `
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
    return ["key"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `[Citation] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`
    );
    if (name == "key") {
      // if an old value exists we need to unregister from the bibliography
      if (oldValue) this.triggerCitationRemoved();
      // and register with the new value if it exists (see connectedCallback)
      if (this._connected && newValue) this.triggerCitationAdded();
    }
  }
}
