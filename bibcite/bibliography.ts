import { parse } from 'astrocite-bibtex';

console.log(parse(`
@book{mas-colellMicroeconomicTheory1995,
  title = {Microeconomic Theory},
  author = {{Mas-Colell}, Andreu and Whinston, Michael Dennis and Green, Jerry R.},
  year = {1995},
  volume = {1},
  publisher = {{Oxford university press New York}},
  file = {C\:\\Users\\felix\\paper\\1995_Mas-Colell et al\\Mas-Colell et al_1995_Microeconomic theory.pdf}
}
`))

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
		this.bib = parse(value)
	}
	update_bib(oldValue, newValue) {
	
	}

}


