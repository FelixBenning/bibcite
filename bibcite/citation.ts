abstract class Citation extends HTMLElement {
  constructor(){
    super();
  }

  static get observedAttributes() {
    return ["key"];
  }
  set key(value) {
    this.setAttribute("key", value);
  }
  get key() {
    return this.getAttribute("key");
  }

  attributeChangedCallback(name, oldValue, newValue) {
    // const eventName = oldValue ? "onCiteKeyChanged" : "onCiteKeyCreated";
    const keys = newValue.split(",").map((k) => k.trim());
    this.innerHTML = "";
    for (const key of keys) {
      this.innerHTML += `<a href='#${key}><li>${/*TODO*/ key}</li></a>`;
    }

    // const options = { detail: [this, keys], bubbles: true };
    // const event = new CustomEvent(eventName, options);
    // document.dispatchEvent(event);
  }
}

export class RawCitation extends Citation {}

export class ParenCitation extends Citation {}

export class TextCitation extends Citation {}