import Cite from 'citation-js';

export class Bibliography extends HTMLElement {
	constructor(){
		super();
	}

	connectedCallback() {
		console.log('connected Callback of Bib called')
	}

	disconnectedCallback(){
		console.log('disconnected Callback of bib called')
	}

	static get observedAttributes() {
		return ['bib'];
  	}

	attributeChangedCallback(name, oldValue, newValue){
		console.log('bib attributeChangedCallback')
		const dispatch_dict = {
			'bib': this.update_bib,
		}
		dispatch_dict[name](oldValue, newValue);
	}

	set bib(value) {
		this.bib = Cite(value)
	}
	update_bib(oldValue, newValue) {
	
	}

}


