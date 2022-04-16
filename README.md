
# Bibcite

An attempt to create a bibliography package based on the citation mechanic in
[distillpub/template](https://github.com/distillpub/template) and the BibLaTeX.
The goal ist to be able to include a `.bib` file in the BibLaTeX format
autosynced by something like Zotero and use 
```html
<cite is="text-cite" keys="firstKey,secondKey"></cite>
```

as the equivalent for `\textcite{firstKey,secondKey}` in [BibLaTeX](https://mirror.physik.tu-berlin.de/pub/CTAN/macros/latex/contrib/biblatex/doc/biblatex.pdf).

This package will be based on [citation-js](https://www.npmjs.com/package/citation-js).

As I am new to:
- Javascript
- Typescript
- rollup
- npm/Node

This is mostly a learning exercise and might not ever be finished.