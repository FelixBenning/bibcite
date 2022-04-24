
# Bibcite

> Brand new and (probably) full of bugs

Provided you have a `CSL-JSON` file of your references (i.e. `references.json`)
you can do the following:

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

## Configuration Options

1. At the moment there are two citation-styles `alphabetic`(default) and
`numeric` you can select them like this:

	```html
	<bib-config bib="references.json" citation-style="numeric"></bib-config>
	```

2. There are three types of citations inspired by BibLaTeX `\textcite`,
`\parencite` and `\rawcite`. You can set the `type` of `bib-cite` to either
	`paren-cite` (default) `text-cite` or `raw-cite`, i.e.

	```html
	<bib-cite key="id_key" type="text-cite"></bib-cite>
	```

## Custom Styles

There will be a way to do customization in the future. Styles are types

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