import { alphabetic } from "./alphabetic";
import { numeric } from "./numeric";
import { CiteStyle } from "./types";



export let styles = new Map<string, CiteStyle>();
export const fallbackStyle = alphabetic;

export function addStyle(name:string, definition:CiteStyle){
  styles.set(name, definition);
}

// default styles
addStyle("numeric", numeric);
addStyle("alphabetic", alphabetic);
