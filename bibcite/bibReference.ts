import { Data } from "csl-json";
import { BibController } from "./bibController";
import { BibStyle } from "./style-packs";

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

  set citeStyle(style:BibStyle){

  }

  update(used_references: {index: number, csl_data: Data}[]){

  }

}
