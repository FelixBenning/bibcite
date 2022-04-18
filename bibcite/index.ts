import {Bibliography} from './bibliography';
import { RawCitation, ParenCitation, TextCitation } from './citation';

customElements.define('bib-config', Bibliography);


customElements.define('raw-cite', RawCitation, { extends: 'cite'});
customElements.define('paren-cite', ParenCitation, { extends: 'cite'});
customElements.define('text-cite', TextCitation, { extends: 'cite'});
