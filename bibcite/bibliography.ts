import { Data, Person } from "csl-json";
import { Citation } from "./citation";

function authorsAlphabeticalComparison(
  authors_1: Person[],
  authors_2: Person[]
) {
  let cmp = authors_1[0].family.localeCompare(authors_2[0].family);
  // TODO: imporve sorting
  // if (cmp !=0 ) {
  return cmp;
  // }
  // cmp = authors_1[0].given.localeCompare(authors_2[0].given)
}

export class Bibliography extends HTMLElement {
  _bib: Promise<{ [k: string]: Data }> = new Promise((_, reject) => {
    reject("No bib yet!");
  });
  _citations: Citation[] = []; // list of citations

  // key pointing to idx of first citation using it
  _first_key_use: Map<string, number> = new Map();

  constructor() {
    super();
  }

  sorting = {
    use: function () {
      console.log("Sort by use");
    },
    alphabet: function () {},
  };

  citation_style = {
    numeric: function () {
      const css = document.createElement("link");
      css.href = "/css/numeric.css";
      css.type = "text/css";
      css.rel = "stylesheet";
      document.head.appendChild(css);
    },
  };

  listeners = {
    CitationAdded(event: CustomEvent) {
      this.registerCitation(event.detail.element);
    },
    CitationRemoved(event: CustomEvent) {
      this.unregisterCitation(event.detail.element.index);
    },
  };

  connectedCallback() {
    for (const [functionName, callback] of Object.entries(this.listeners)) {
      console.log(`addEventListener: ${functionName}`);
      document.addEventListener(functionName, callback.bind(this));
    }
  }

  registerCitation(citationElement) {
    if (
      this._citations.length == 0 ||
      this._citations.at(-1).compareDocumentPosition(citationElement) ==
        Node.DOCUMENT_POSITION_FOLLOWING
    ) {
      //append
      citationElement.index = this._citations.length; // previous length is index of new
      this._citations.push(citationElement);
      console.log(`registered ${citationElement.key}`);
    } else {
      // insertion
      /*TODO*/
      console.log("random insertion not implemented yet");
    }
    // get might return undefined, the comparison is false, if is true
    // (in that case this is the first citation using it, it should be registered)
    if (
      !(this._first_key_use.get(citationElement.key) >= citationElement.index)
    ) {
      this._first_key_use[citationElement.key] = citationElement.index;
    }
  }

  unregisterCitation(index) {
    /* TODO */
  }

  disconnectedCallback() {
    console.log("disconnected Callback of bib called");
  }

  static get observedAttributes() {
    return ["bib", "sorting", "citation-style"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`attributeChangedCallback(${name}, ${oldValue}, ${newValue})`);
    const dispatch_dict = {
      bib: (_, new_val) => {
        this._bib = CSL_from_bib(new_val);
        console.log('Parsed CSL:', this._bib);
      },
      sorting: (_, new_val) => this.sorting[new_val](),
      "citation-style": (_, new_val) => this.citation_style[new_val](),
    };
    dispatch_dict[name](oldValue, newValue);
  }

  set bib(value: Promise<{ [k: string]: Data }>) {
    this._bib = value;
  }

  get bib() {
    return this._bib;
  }

  async provide_reference(key) {
    return (await this._bib)[key];
  }
}

async function CSL_from_bib(bib): Promise<{[k:string]: Data}> {
  let csl_list: Data[];
  if (typeof bib === "function") {
    csl_list = await bib();
  } else if (bib) {
    // seems to be an url
    csl_list = await fetch(bib).then((resp) => resp.json());
  } else {
    // empty bib_field
    csl_list = JSON.parse(this.innerHTML);
  }
  return Object.fromEntries(
    csl_list
      .sort((a, b) => authorsAlphabeticalComparison(a.author, b.author))
      .map((citation) => [citation.id, citation])
  );
}
