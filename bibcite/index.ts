import { BibController } from './bibController';
import { Citation } from './citation';
import { References } from './references';

customElements.define('bib-config', BibController);
customElements.define('bib-cite', Citation);
customElements.define('bib-references', References);
