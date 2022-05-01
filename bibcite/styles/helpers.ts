import { Data, Person } from "csl-json";

export function alphabetic_identifier(bibData: Data): string {
  return (
    letters(bibData.author) +
    bibData.issued["date-parts"][0][0].toString().slice(-2)
  );
}

function letters(authors: Person[]) {
  switch (authors.length) {
    case 0:
      return "?";
    case 1:
      return authors.at(0).family.slice(0, 3).toUpperCase();
    default:
      return authors
        .map((p) => p.family.at(0))
        .join("")
        .toUpperCase();
  }
}

export function et_al_ify(authors: Person[]): string {
  const names = authors.map(
    (p) => p["non-dropping-particle"] || "" + " " + p.family
  );
  return names[0] + (names.length > 1 ? " et al." : "");
}

export function tabularBibEntry(bibEntry: string, identifier: string) {
  return `<tr style="vertical-align:top">
      <td>[${identifier}]</td>
      <td>${bibEntry}</td>
  </tr>
  `;
}

export function paragraphBibEntry(bibEntry: string) {
  return `<p>${bibEntry}</p>`;
}

export function defaultBibEntry(csl_data: Data) {
  return `<strong>${csl_data.title}</strong> ${directLink(csl_data)}
    <br>
      <span>${author_list(csl_data.author)}</span>
      <span>(${csl_data.issued["date-parts"][0][0]})</span>
    <br>
      <span>${where_to_find(csl_data)}
    `;
}

function author_list(authors: Person[]): string {
  if (!authors) return "";
  if (authors.length == 1) return full_name(authors.at(0));
  let nameList = authors.map((p) => full_name(p));
  return [nameList.slice(0, -1).join(", "), nameList.at(-1)].join(" and ");
}

function where_to_find(csl_data: Data): string {
  let result = "";
  if (csl_data["container-title"]) {
    let addInfo = [];
    if(csl_data.volume){
      addInfo.push(`Volume: ${csl_data.volume}`)
    }
    if (csl_data.issue) {
      addInfo.push(`Issue: ${csl_data.issue}`);
    }
    if (csl_data.locator) {
      console.log("locator");
    }
    result +=
      "In: " +
      csl_data["container-title"] +
      (addInfo.length ? " [" + addInfo.join(", ") + "]" : "") +
      "\n";
  }
  if (csl_data["collection-title"]) {
    result += "In: " + csl_data["collection-title"] + "\n";
  }
  if (csl_data.DOI) {
    result += `DOI: <a href="https://doi.org/${csl_data.DOI}">${csl_data.DOI}</a>\n`;
  } else {
    if (csl_data.ISBN) {
      result += `ISBN: ${csl_data.ISBN}\n`;
    } else if (csl_data.URL) {
      result += `URL: <a href="${csl_data.URL}>${shortenURL(csl_data.URL)}</a>`;
      result += csl_data.accessed
        ? `(last accessed: ${csl_data.accessed["date-parts"][0]
            .map((n) => String(n))
            .join("-")})`
        : "";
      result += "\n";
    }
  }
  return result.trim().replace("\n", "<br>");
}

function shortenURL(url: string): string {
  return url.replace(/^[a-z]+:\/\//i, "");
}

function full_name(p: Person): string {
  return (
    (p.given ? p.given + " " : "") +
      (p["non-dropping-particle"] ? p["non-dropping-particle"] + " " : "") +
      (p["dropping-particle"] ? p["dropping-particle"] + " " : "") +
      (p.family ? p.family : "") +
      (p.suffix ? " " + p.suffix : "").trim() || p.literal
  );
}

function directLink(csl_data: Data): string | null {
  if (csl_data.DOI) {
    return `<a href="https://doi.org/${csl_data.DOI}">[DOI]</a>`;
  } else if (csl_data.URL) {
    return `<a href="${csl_data.URL}>[${linkType(csl_data.URL)}]</a>`;
  }
  return "";
}

function linkType(url: string): string {
  if (url.endsWith("pdf")) {
    return "PDF";
  } else if (url.includes("arxiv")) {
    return "ARXIV";
  } else if (url.endsWith("html")) {
    return "HTML";
  } else if (url.match("doi.org/(.+)$")) {
    return "DOI";
  }
  return "link";
}
