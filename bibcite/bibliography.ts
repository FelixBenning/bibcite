import { parse } from "astrocite-bibtex";
import { Data } from "csl-json";

function dict_parse(citation_string) {
  return Object.fromEntries(
    parse(citation_string).map((citation) => [citation.id, citation])
  );
}
export class Bibliography extends HTMLElement {
  _bib: Promise<{ [k: string]: Data }> = new Promise((_, reject) => {
    reject("No bib yet!");
  });

  constructor() {
    super();
  }

  connectedCallback() {
    console.log("connected Callback of Bib called");
  }

  disconnectedCallback() {
    console.log("disconnected Callback of bib called");
  }

  static get observedAttributes() {
    return ["bib"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log("bib attributeChangedCallback");
    const dispatch_dict = {
      bib: (_, new_val) => this.update_bib(new_val),
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

  update_bib(bib_url) {
    if (bib_url) {
      // bib file
      this._bib = fetch(bib_url)
        .then((resp) => resp.text())
        .then(dict_parse)
        .then((r) => {
          console.log(r);
          return r;
        });
    } else {
      // inner HTML instead of bib file
      this.bib = new Promise((resolve, _) => {
        resolve(dict_parse(this.innerHTML));
      });
    }
  }
}
