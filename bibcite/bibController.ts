import { Bibliography } from "./bibliography";

export class BibController extends HTMLElement {
  _scope; // only control citations which are children of this scope
  bibliography: Promise<Bibliography>;

  constructor() {
    super();
  }

  listeners = {
    // addEventListener used on these in connectedCallback
    async CitationAdded(event: CustomEvent) {
      console.log("[BibController] caught CitationAdded event");
      const bib = await this.bibliography;

      // so that the Citation can fire CitationRemoved on me even when disconnected
      event.detail.element.myController = this;
      event.stopImmediatePropagation(); // monotheism

      bib.registerCitation(event.detail.element);
    },
    async CitationRemoved(event: CustomEvent) {
      console.log("[BibController] caught CitationRemoved event");
      const bib = await this.bibliography;
      bib.unregisterCitation(event.detail.element);
    },
    async ReferenceAdded(event: CustomEvent) {
      console.log("[BibController] caught ReferenceAdded event");
      const bib = await this.bibliography;

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
    return ["bib", "sorting", "citation-style"];
  }

  set innerHTML(value: string) {
    console.log("[BibController] set innerHTML");
    super.innerHTML = value;
    this.make_bib();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(
      `[BibController] attributeChangedCallback(${name}, ${oldValue}, ${newValue})`
    );
    if (!this.bibliography) {
      this.bibliography = this.make_bib();
    }
    this.bibliography[name] = newValue;
  }

  async make_bib(): Promise<Bibliography> {
    console.log("[BibController] Making Bibliography");
    const bib = this.getAttribute("bib");
    // TODO: add option for bib to be callable?
    if (bib) {
      console.log("|- bib attribute present -> fetching");
      const response = await fetch(bib);
      return new Bibliography(await response.json());
    } else {
      console.log("|- bib attribute missing -> waiting for innerHTML");
      const htmlLoaded = new Promise((resolve, _) => {
        document.addEventListener("DOMContentLoaded", () =>
          resolve(this.innerHTML)
        );
      });
      return new Bibliography(await htmlLoaded.then(JSON.parse));
    }
  }
}
