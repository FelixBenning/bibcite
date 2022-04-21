import { BibController } from "./bibController";

export class BibReference extends HTMLElement {
  _myController: BibController;
  set myController(value:BibController){
    this._myController = value;
  }

  connectedCallback() {
    const event = new CustomEvent("ReferenceAdded", {
      bubbles: true,
      detail: { element: this },
    });
    this.dispatchEvent(event);
  }
  disconnectedCallback(){
    const event = new CustomEvent("ReferenceRemoved", {
      bubbles: false,
      detail: {element: this},
    });
    this._myController.dispatchEvent(event);
  }

}
