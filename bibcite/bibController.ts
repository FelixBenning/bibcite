import { Bibliography } from "./bibliography";


export class BibController extends HTMLElement {
  bibliography: Promise<Bibliography>;

  constructor() {
    super();
  }

  listeners = {// addEventListener in connectedCallback
    async CitationAdded(event: CustomEvent) {
      const bib = await this.bibliography;
      bib.registerCitation(event.detail.element);
    },
    async CitationRemoved(event: CustomEvent) {
      const bib = await this.bibliography;
      bib.unregisterCitation(event.detail.element.index);
    },
  };

  connectedCallback() {
    console.log('connected Callback')
    if(! this.bibliography) {
      this.bibliography = this.make_bib();
    }
    for (const [functionName, callback] of Object.entries(this.listeners)) {
      console.log(`addEventListener: ${functionName}`);
      document.addEventListener(functionName, callback.bind(this));
    }
  }

  disconnectedCallback() {
    console.log("disconnected Callback of bib called");
  }

  static get observedAttributes() {
    return ["bib", "sorting", "citation-style"];
  }

  set innerHTML(value: string) {
    console.log('set innerHTML')
    this.make_bib(); // TODO: should be update (ignores value at the moment)
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`attributeChangedCallback(${name}, ${oldValue}, ${newValue})`);
    if(!this.bibliography) {
      this.bibliography = this.make_bib();
    }
    this.bibliography[name] = newValue;
  }

  async make_bib(): Promise<Bibliography> {
    console.log('Making Bibliography')
    const bib = this.getAttribute('bib');
    // TODO: add option for bib to be callable?
    if (bib) {
      console.log('bib attribute present -> fetching')
      const response = await fetch(bib)
      return new Bibliography(await response.json());
    } else {
      console.log('bib attribute missing -> waiting for innerHTML')
      const htmlLoaded = new Promise((resolve, reject) => {
        document.addEventListener('DOMContentLoaded', () => resolve(this.innerHTML))
      })
      return new Bibliography(await htmlLoaded.then(JSON.parse));
    }
  }
}
