import { Data } from "csl-json";
import { BibController } from "./bibController";

export class Citation extends HTMLElement {
  _myController: BibController;
  _index:number; // id provided by Bibliography (DOM position relative to other Citations)
  _connected: boolean;
  _identifier: string;
  _bibInfo:Data;
  _info: {identifier:string, bibInfo:Data};

  constructor() {
    super();
  }

  set identifier(value:string){
    this._identifier = value;
  }
  set myController(value: BibController) {
    this._myController = value;
  }

  set index(value) {
    this._index = value;
    this.setAttribute('id', `cite_${value}`);
  }
  get index() {
    return this._index;
  }

  set key(value) {
    this.setAttribute("key", value);
  }
  get key() {
    return this.getAttribute("key");
  }
  set citationStyle(value:string){
    this.classList.add(value);
  }

  set bibInfo(info:Data){
    this._bibInfo = info;
    this.innerHTML = `
      <span slot="identifier">${this._identifier}</span>
      <span slot="author">${info.author.map(p => p.family).slice(0, /*TODO: how many authors*/1)}</span>
      <span slot="year">${info.issued["date-parts"][0]}</span>
      <span slot="title">${info.title}</span>
      <span slot="publisher">${info.publisher}</span>
      <span slot="doi">${info.DOI}</span>
    ` 
    this.attachShadow({mode: "open"});
    this.shadowRoot.innerHTML = `
      <a href=#${this.key}>
        <slot name='author'></slot>,
        <slot name='year'></slot>
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
    this._index = undefined;
    this.removeAttribute('id');
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
