import { alphabetic } from "./alphabetic";
import { authorYear } from "./author-year";
import { numeric } from "./numeric";
import { CiteStyle } from "./types";

export let styles = new Map<string, CiteStyle>();
export const fallbackStyle = alphabetic;

export function addStyle(sty: CiteStyle) {
  styles.set(sty.name, sty);
}

// default styles
addStyle(numeric);
addStyle(alphabetic);
addStyle(authorYear);
