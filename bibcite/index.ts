import { BibController } from "./bibController";
import { Citation } from "./citation";
import { BibReference } from "./bibReference";

customElements.define("bib-config", BibController);
customElements.define("bib-cite", Citation);
customElements.define("bib-references", BibReference);
