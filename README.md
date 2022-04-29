
# Bibcite

BibTeX or BibLaTeX like citation for HTML.

> Brand new and (probably) full of bugs

## Browser Usage


1. Export your library from your favorite reference management software (e.g.
[Zotero][zotero]) in the CSL-JSON format ([Detailed
Explanation][export-csl-explanation]).
2. Obtain the Javascript file of Bibcite ([See
Releases][releases])
3. Assuming you have an exported `csl-json` file, which we are going to call
`references.json` from now on (but you can use any other filename). And a link
to the JS file of `bibcite` (here called `bibcite.js`) you can do the following in
an html file

    ```html
    <head>
      <script src="bibcite.js"></script>
      <bib-config bib="references.json"></bib-config>
    </head>
    <body>
      <p>
        This is an example of parenthical citation:
        <bib-cite key="id in references.json"></bib-cite>
      </p>

      <bib-references></bib-references>
    </body>
    ```

### Configuration Options

1. At the moment there are two citation-styles `alphabetic`(default) and
`numeric` you can select them like this:

	```html
	<bib-config bib="references.json" citation-style="numeric"></bib-config>
	```

2. There are three types of citations inspired by BibLaTeX `\textcite`,
`\parencite` and `\rawcite`. You can set the `type` of `bib-cite` to either
	`paren-cite` (default) `text-cite` or `raw-cite`, e.g.

	```html
	<bib-cite key="id_key" type="text-cite"></bib-cite>
	```

## Node Module

You can find [`bibcite` on npm][npm-bibcite].

### Custom Styles

There will be a way to do customization in the future. Styles are Typescript
types

```typescript
type CiteStyle = {
  name: string;
  order: BibOrder;
  enclosing: [string, string];
  multiSeparator: string;
  identifier: (index: number, bib_data: Data, citeType: CiteType) => string;
  bib_entry: (index: number, bib_data: Data) => string;
  reference: (content: string) => string;
};
```

so the numeric style for example is implemented like this:

```typescript
export const numeric: CiteStyle = {
  name: "numeric",
  order: { comparison: insertion, inform_citations: true },
  enclosing: ["[", "]"],
  multiSeparator: ",",
  identifier: (index: number, _: Data) => String(index),
  bib_entry: (index: number, bib_data: Data) => `
    <tr>
      <td>[${index}]</td>
      <td>
        <h3>${bib_data.title}</h3>
        <span>${bib_data.author.map((p) => p.family).join(", ")}</span>
        <span>(${bib_data.issued["date-parts"][0][0]})</span>
      </td>
    </tr>
  `,
  reference: (content: string) =>
    `<h2>References</h2>
  <table>
    ${content}
  </table>
  `,
};
```

I still need to figure out how to do plugin loading here though.

[zotero]: https://www.zotero.org/
[export-csl-explanation]: https://github.com/FelixBenning/bibcite/blob/main/docs/export-csl-json.md
[releases]: https://github.com/FelixBenning/bibcite/blob/releases
[npm-bibcite]: https://www.npmjs.com/package/bibcite
