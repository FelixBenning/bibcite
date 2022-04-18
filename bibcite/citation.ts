export class Citation extends HTMLElement {
  _index;

  constructor(){
    super();
  }
  
  set index(value){
    this._index = value;
    this.innerHTML = value+1;
  }
  get index(){
    return this._index;
  }

  set key(value) {
    this.setAttribute("key", value);
  }
  get key() {
    return this.getAttribute("key");
  }

  static get observedAttributes() {
    return ["key"];
  }

  attributeChangedCallback(name, oldValue, newValue) {
    console.log(`Citation.attributeChangedCallback(${name}, ${oldValue}, ${newValue})`);
    if (oldValue) {
      const event = new CustomEvent("CitationRemoved", {detail: {"element": this}});
      document.dispatchEvent(event);
    }
    if (newValue) {
      const event = new CustomEvent("CitationAdded", {detail: {"element": this}, bubbles: true});
      document.dispatchEvent(event);
    }
  }
}

