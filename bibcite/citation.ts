export abstract class Citation extends HTMLElement {
  _index;

  constructor(){
    super();
  }
  
  set index(value){
    this._index = value;
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


const event_test = new CustomEvent('testEvent', {'detail': "test event detail"})
document.dispatchEvent(event_test)

function testEventHandler(event){
  console.log(event.detail)
}
document.addEventListener('testEvent', testEventHandler)

export class RawCitation extends Citation {}

export class ParenCitation extends Citation {}

export class TextCitation extends Citation {}