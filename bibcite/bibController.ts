import { Bibliography } from "./bibliography";
import { comparisons } from "./sorting";
import { CiteStyle, styles } from "./style-packs";

export class BibController extends HTMLElement {
  _scope; // only control citations which are children of this scope
  _citeStyle: CiteStyle;
  bibliography: Promise<Bibliography>;

  constructor() {
    super();
  }

  listeners = {
    // addEventListener used on these in connectedCallback
    async CitationAdded(event: CustomEvent) {
      console.log("[BibController] caught CitationAdded event");
      const bib = await this.bibliography;
      const citation = event.detail.element;

      // so that the Citation can fire CitationRemoved on me even when disconnected
      citation.myController = this;
      event.stopImmediatePropagation(); // monotheism

      citation.citationStyle = this.citation_style;

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

      // so that ReferenceRemoved can fire on me even when disconnected
      event.detail.element.myController = this;
      event.stopImmediatePropagation(); // monotheism

      bib.registerReferenceList(event.detail.element);
    },
    async ReferenceRemoved(event: CustomEvent) {
      console.log("[BibController] caught ReferenceRemoved event");
      const bib = await this.bibliography;
      bib.unregisterReferenceList(event.detail.element);
    },
  };

  connectedCallback() {
    console.log("[BibController] Connected Callback");
    if (!this.bibliography) {
      this.bibliography = this.make_bib();
    }
    this._scope =
      this.parentElement === document.head ? document : this.parentElement;
    for (const [functionName, callback] of Object.entries(this.listeners)) {
      console.log(`|- addEventListener: ${functionName}`);
      this._scope.addEventListener(functionName, callback.bind(this));
    }
  }

  disconnectedCallback() {
    console.log("[BibController] Disconnected Callback");
    for (const [functionName, callback] of Object.entries(this.listeners)) {
      console.log(`removeEventListener: ${functionName}`);
      this._scope.removeEventListener(functionName, callback.bind(this));
    }
  }

  static get observedAttributes() {
    return ["bib", "citation-style"];
  }

  set innerHTML(value: string) {
    console.log("[BibController] set innerHTML");
    super.innerHTML = value;
    this.make_bib();
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

  attributeCallbacks = {
    bib: async function (newValue) {
      if (!this.bibliography) {
        this.bibliography = this.make_bib();
      }
      (await this.bibliography).bib = newValue;
    },
    "citation-style": function (newValue) {
      this.citeStyle = styles[newValue] || styles.alphabetic;
    },
  };

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `[BibController] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`
    );
    this.attributeCallbacks[name](newValue);
  }

  async make_bib(): Promise<Bibliography> {
    console.log("[BibController] Making Bibliography");
    const bib = this.getAttribute("bib");
    // TODO: add option for bib to be callable?
    if (bib) {
      console.log("|- bib attribute present -> fetching");
      const response = await fetch(bib);
      return new Bibliography(
        await response.json(),
        this.citeStyle.order.comparison
      );
    } else {
      console.log("|- bib attribute missing -> waiting for innerHTML");
      const htmlLoaded = new Promise((resolve, _) => {
        document.addEventListener("DOMContentLoaded", () =>
          resolve(this.innerHTML)
        );
      });
      return new Bibliography(
        await htmlLoaded.then(JSON.parse),
        this.citeStyle.order.comparison
      );
    }
  }
}
