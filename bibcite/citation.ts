abstract class Citation extends HTMLSpanElement {

  static get observedAttributes() {
    return ["keys"];
  }
  set keys(values) {
    this.setAttribute("keys", values.join(','));
  }
  get keys() {
    return this.getAttribute("keys").split(",").map((k) => k.trim());
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