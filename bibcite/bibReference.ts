import { Data } from "csl-json";
import { BibController } from "./bibController";
import { CiteStyle } from "./styles/types";

type Reference = { index: number; csl_data: Data };

export class BibReference extends HTMLElement {
  _citeStyle: CiteStyle;
  _myController: BibController;
  _usedReferences: Reference[];

  set myController(value: BibController) {
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

  set citeStyle(style: CiteStyle) {
    console.log("[Reference] set citeStyle");
    this._citeStyle = style;
    if (this._usedReferences) this.render();
  }
  render() {
    console.log("[Reference] rendering");
    this.innerHTML = this._citeStyle.metaReference(
      this._usedReferences
        .map((ref) =>
          this._citeStyle.metaBibEntry(
            this._citeStyle.bib_entry(ref.csl_data),
            this._citeStyle.identifier(ref.csl_data, ref.index, "raw-cite")
          )
        )
        .join("")
    );
  }

  set usedReferences(references: Reference[]) {
    console.log("[Reference] set usedReferences", references);
    this._usedReferences = references;
    if (this._citeStyle) this.render();
  }
}
