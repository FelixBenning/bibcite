import { BibController } from "./bibController";

export class Citation extends HTMLElement {
  _index;
  _myController: BibController;
  _connected: boolean;

  constructor() {
    super();
  }

  set myController(value: BibController) {
    this._myController = value;
  }

  set index(value) {
    this._index = value;
    this.innerHTML = value + 1;
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

  connectedCallback() {
    // attributeChangedCallback happens before connection to DOM
    // need to register when connected for correct bubbling
    if (this.getAttribute("key")) this.triggerCitationAdded();
    this._connected = true;
  }
  disconnectedCallback() {
    if (this.getAttribute("key")) this.triggerCitationRemoved();
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
  }

  static get observedAttributes() {
    return ["key"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `Citation.attributeChangedCallback(${name}, ${oldValue}, ${newValue})`
    );
    if (name == "key") {
      // if an old value exists we need to unregister from the bibliography
      if (oldValue) this.triggerCitationRemoved();
      // and register with the new value if it exists (see connectedCallback)
      if (this._connected && newValue) this.triggerCitationAdded();
    }
  }
}
