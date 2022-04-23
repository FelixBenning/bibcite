import { Data } from "csl-json";
import { Bibliography } from "./bibliography";
import { BibReference } from "./bibReference";
import { Citation } from "./citation";
import { CiteStyle, styles } from "./style-packs";

export class BibController extends HTMLElement {
  _scope; // only control citations which are children of this scope
  _citeStyle: CiteStyle;
  _bibliography: Promise<Bibliography>;

  constructor() {
    super();
  }

  listeners = {
    // addEventListener used on these in connectedCallback
    async CitationAdded(event: CustomEvent) {
      console.log("[BibController] caught CitationAdded event");
      const bib = await this.bibliography;
      const citation:Citation = event.detail.element;

      // so that the Citation can fire CitationRemoved on me even when disconnected
      citation.myController = this;
      event.stopImmediatePropagation(); // monotheism

      citation.citeStyle = this.citeStyle;

      bib.registerCitation(event.detail.element);
    },
    async CitationRemoved(event: CustomEvent) {
      console.log("[BibController] caught CitationRemoved event");
      const bib = await this.bibliography;
      bib.unregisterCitation(event.detail.element);
    },
    async ReferenceAdded(event: CustomEvent) {
      console.log("[BibController] caught ReferenceAdded event");
      const bib: Bibliography = await this.bibliography;
      const bibReference: BibReference = event.detail.element;

      // so that ReferenceRemoved can fire on me even when disconnected
      bibReference.myController = this;
      event.stopImmediatePropagation(); // monotheism

      bibReference.citeStyle = this.citeStyle;

      bib.registerReferenceList(event.detail.element);
    },
    async ReferenceRemoved(event: CustomEvent) {
      console.log("[BibController] caught ReferenceRemoved event");
      const bib = await this.bibliography;
      bib.unregisterReferenceList(event.detail.element);
    },
  };

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

  async attributeChangedCallback(name:string, oldValue:string, newValue:string) {
    console.log(
      `[BibController] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`
    );
    switch (name) {
      case "bib":
        if (!this._bibliography) {
          this.bibliography; // getter for the initialization side-effect
        } else {
          (await this.bibliography).bib = await this.csl_from_attribute(
            newValue
          );
        }
        break;
      case "citation-style":
        this.citeStyle = styles[newValue] || styles.alphabetic;
        break;
      default:
        console.error(
          `[BibController] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`
          +  `called with unknown attribute ${name}`
        );
    }
  }

  set innerHTML(value: string) {
    console.log("[BibController] set innerHTML");
    super.innerHTML = value;
    if (!this.getAttribute("bib")) {
      // attribute has priority
      this.bibliography.then(res=>res.bib=JSON.parse(value));
    }
  }

  async propagateCiteStyle(citeStyle: CiteStyle) {
    const bib = <Bibliography>await this.bibliography;
    bib.citations.forEach((cit) => (cit.citeStyle = citeStyle));
    bib._reference_lists.forEach((ref) => (ref.citeStyle = citeStyle));
  }

  set citeStyle(value: CiteStyle) {
    this._citeStyle = value;
    this.propagateCiteStyle(value);
  }

  get citeStyle() {
    if (!this._citeStyle) {
      // default: alphabetic
      this._citeStyle =
        styles[this.getAttribute("citation-style")] || styles.alphabetic;
    }
    return this._citeStyle;
  }

  get bibliography() {
    if (!this._bibliography) {
      this._bibliography = this.csl_from_attribute(
        this.getAttribute("bib")
      ).then(csl=> new Bibliography(csl, this.citeStyle.order.comparison));
    }
    return this._bibliography;
  }

  async csl_from_attribute(bib_attr: string): Promise<Data[]> {
    // TODO: add option for bib to be callable?
    if (bib_attr) {
      console.log("|- bib attribute present -> fetching");
      const response = await fetch(bib_attr);
      return await response.json();
    } else if (document.readyState == "loading") {
      console.log("|- bib attribute missing -> waiting for innerHTML");
      return new Promise((resolve, _) => {
        document.addEventListener("DOMContentLoaded", () =>
          resolve(this.innerHTML)
        );
      }).then(JSON.parse);
    } else {
      console.log("|- bib attribute missing -> using innerHTML");
      return JSON.parse(this.innerHTML);
    }
  }
}
