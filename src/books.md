---
title: Goodread books
---

# books

I scraped the data from Goodreads.com. Goodreads no longer has an API and its data export no longer includes the book data. The data is augmented using the OpenLibrary API to add more semantic information.

```js
const books = FileAttachment("./data/books.json").json();
```

```js
import { LocCategoryMap } from "./utils/locCategoryMap.js";
import {
  coverImage,
  myRating,
  dateRead,
  readAfter,
  avgRating,
  publicationDate,
  readBook,
  hasRating,
  initial,
  fictionNonFiction,
} from "./utils/bookUtils.js";
import { range, rollups, min, max, mean, extent } from "npm:d3-array";
import { utcFormat } from "npm:d3-time-format";
```

```js
// Shared with the Favorite Authors scale below: viridis green at t = 0.75, and
// a lightened form of its blue at t = 0.25. The blue is lightened because
// #3b528b only reaches 2.2:1 against the dark theme background; at this
// lightness it clears 3:1 on both themes, which neither the original nor the
// paler variants manage.
const viridisGreen = "#5ec962";
const lightBlue = "#658ced";
```

```js
// display(books[0]);
```

```js
const ratingStars = (d, selector = myRating) =>
  range(0, selector(d))
    .map((s) => "★")
    .concat(range(selector(d), 5).map((s) => "☆"))
    .join("");
```

```js
const tipTitle = (d) =>
  [
    d["Title"],
    `by ${d["Author"]}`,
    publicationDate(d),
    d["lc_class_name"],
    ratingStars(d),
  ].join("\n\n");
```

---

## Recent favorites

<br>

```js
const favYearInput = view(
  Inputs.range(yearRange, { value: 2021, step: 1, label: "Books read since" })
);
```

<div class="recent-favorites" style="overflow: scroll; max-height: 430px">
    ${books.filter(d => myRating(d) === 5).filter(coverImage).filter(readAfter(favYearInput - 1)).map(book => 
        html`<a href="${book.url}" target="_blank">
            <img src="${coverImage(book)}" 
            alt="${book["Title"]} by ${book["Author"]}" 
            height="110">
        </a>`
    )}
</div>

<br>

## List of all books

```js
view(
  Inputs.table(books, {
    columns: [
      "Title",
      "Author",
      "My Rating",
      "Average Rating",
      "Date Read",
      "locNumber",
      "Year Published",
      "lc_class_name",
      "Number of Pages",
    ],
    width: {
      // Title runs to 131 characters at the extreme, but the median is 20 and
      // the 75th percentile 34, so this reads in full for most of the list.
      Title: 300,
      Author: 180,
      // Holds five stars plus the header without collapsing on narrow screens.
      "My Rating": 90,
    },
    format: {
      "My Rating": (d) => ratingStars(d, (d) => d),
      "Year Published": (d) => new Date(d).getFullYear(),
      "Date Read": (d) => utcFormat("%b %y")(new Date(d)),
    },
    header: {
      "Number of Pages": "# pages",
      lc_class_name: "LoC class",
      "Average Rating": "Avg. rate",
      "Year Published": "Pub. year",
      "Date Read": "Month read",
      "locNumber": "LoC #"
    },
  })
);
```

```js
const yearRange = extent(books.map((d) => dateRead(d).getFullYear()));
```

```js
const timelineBooks = books.filter(readAfter(startYearInput - 1));

const uniqueClasses = Array.from(
  new Set(timelineBooks.map((d) => d["lc_class"]))
);
const fClasses = d3.sort(uniqueClasses.filter((c) => c.startsWith("P")));
const nfClasses = d3.sort(uniqueClasses.filter((c) => !c.startsWith("P")));
const sortedClasses = nfClasses.concat(fClasses);

const fictionCategories = timelineBooks
  .map((d) => d["lc_class"])
  .filter((d) => d.startsWith("P"));

const TimelinePlot = (myWidth) => {
  const plot = Plot.plot({
    // insetTop: 5,
    marginBottom: 40,
    marginLeft: 50,
    width: myWidth,
    height: 600,

    marks: [
      Plot.tickX(timelineBooks, {
        x: (d) => dateRead(d),
        y: "lc_class",
        //  y: "lc_number",
        stroke: "lc_class",
        //fill: "lc_class",
        //fillOpacity: 0.4,
        strokeOpacity: myRating,
        strokeWidth: 2,
        opacity: 0.9,

        r: (d) => d["my_rate"],
        title: (d) =>
          [
            d["Title"],
            `by ${d["Author"]}`,
            d["lc_class_name"],
            ratingStars(d),
          ].join("\n\n"),
        tip: true,
      }),
      // Plot.ruleX([0]),
      Plot.ruleY([0]),
      Plot.rect([0], {
        x1: (d) => min(timelineBooks, dateRead),
        x2: (d) => max(timelineBooks, dateRead),
        y1: (d) => min(fictionCategories),
        y2: (d) => max(fictionCategories),
        //fill: '#555',
        fill: "#f0ddb6",
        opacity: 0.12,
        stroke: "#dbab4b",
        label: "fiction",
        tip: true,
      }),
      Plot.tip([`Fiction`], {
        x: (d) => min(timelineBooks, dateRead),
        y: (d) => min(fictionCategories),
        dy: -10,
        dx: 20,
        anchor: "bottom",
      }),
    ],
    y: {
      tickFormat: (d) => d,
      domain: sortedClasses,
    },
    // r: {
    //   type: "pow",
    //   range: [1, 8],
    // },
    x: {
      nice: true,
    },
    color: {
      legend: "swatches",
      columns: 3,
      scheme: "viridis",
      domain: sortedClasses,
      // The fallback has to sit inside the interpolation: a template literal is
      // always a truthy string, so a trailing `|| "N/A"` could never fire and
      // unmapped classes rendered as the literal text "undefined (N/A)".
      tickFormat: (d) =>
        `${LocCategoryMap[d]?.substring(0, 70) ?? "N/A"} (${d})`,
    },
  });

  return plot;
};
```

```js
const timelinePlot = resize((width) => TimelinePlot(width));
```

```js
// ClassificationLegend(timelinePlot)
```

---

## Books by Library of Congress classification over time

Books read binned based on the Library of Congress classification category over time. Each row is one catagory (in case of fictions, sub category).

<sm>LoC classification number is what being used in libraries to sort books and unlike ISBN that is just a code is assigned based on the book content.</sm>

<br>

```js
const startYearInput = view(
  Inputs.range(yearRange, { value: 2018, step: 1, label: "Books read since" })
);
```

<br>

<div class="w-full">${timelinePlot}</div>

## My rating vs Average rating

```js
const showExtremes = view(
  Inputs.toggle({ value: false, label: "Only show large differences" })
);
```

<br>

```js
const ratingDiff = (d) => myRating(d) - avgRating(d);
```

```js
const ratingBooks = books
  .filter(myRating)
  .filter((d) => (showExtremes ? Math.abs(ratingDiff(d)) > 0.8 : true));

const RatingPlot = (myWidth) =>
  Plot.plot({
    marginLeft: 25,
    marginBottom: 150,
    marks: [
      Plot.link(ratingBooks, {
        x1: (d) => d["Title"],
        x1: (d) => d["Title"],
        y2: ratingDiff,
        y1: 0,
        // Blue and green from viridis, matching the Favorite Authors scale,
        // rather than red/green (the pairing most affected by common forms of
        // colour blindness).
        stroke: (d) => (ratingDiff(d) < 0 ? lightBlue : viridisGreen),
        markerEnd: "arrow",
        strokeWidth: 1,
        thresholds: 10,
        tickFormat: (d, i) => (myWidth > 500 || i % 2 === 0 ? d : ""),
        title: (d) =>
          `${d["Title"]} \n ${d["Author"]} \n My rate: ${myRating(
            d
          )} \n avg rate: ${avgRating(d)} \n diff ${d3.format("+.1f")(
            ratingDiff(d)
          )}`,
        opacity: 0.6,
        label: false,
        tip: true,
      }),
    ],
    sort: "x",
    x: {
      domain: d3
        .sort(ratingBooks, (d) => -ratingDiff(d))
        .map((d) => d["Title"]),
      tickFormat: (d, i) =>
        i % (myWidth > 800 || showExtremes ? 2 : 4) === 0
          ? d.substring(0, 30)
          : null,
      tickRotate: 90,
      ticks: 10,
    },
    y: {
      domain: extent(ratingBooks, ratingDiff).map((d) =>
        d > 0 ? Math.ceil(d) : Math.floor(d)
      ),
      grid: true,
    },

    width: myWidth,
  });
```

```js
const ratingPlot = resize((width) => RatingPlot(width));
```

<div class="w-full">${ratingPlot}</div>

---

### Publication Date

<br>

```js
const pubStartYearInput = view(
  Inputs.range(yearRange, { value: 2002, step: 1, label: "Books read since" })
);
```

<br>

```js
const pubBooks = books
  .filter(readBook)
  .filter(readAfter(pubStartYearInput - 1));

const PublicationPlot = (myWidth) =>
  Plot.plot({
    width: myWidth,
    height: 800,
    marks: [
      Plot.dot(pubBooks, {
        x: dateRead,
        y: publicationDate,
        fill: fictionNonFiction,
        stroke: fictionNonFiction,
        fillOpacity: 0.4,
        strokeOpacity: 0.6,
        strokeWidth: 0.9,
        r: (d) => d["my_rate"],
        //fill: 'red',
        title: (d) => tipTitle(d),
        tip: true,
        //dx: 20,
      }),
      Plot.dot(pubBooks, {
        x: (d) => max(pubBooks, dateRead),
        y: publicationDate,
        fill: fictionNonFiction,
        //stroke: fictionNonFiction,
        fillOpacity: 0.6,
        // strokeOpacity: 0.5,
        // strokeWidth: 2,
        r: 2.5,
        title: (d) => tipTitle(d),
        dx: myWidth * 0.075,
      }),
    ],
    y: {
      tickFormat: (d) => `${d}`,
      // nice: true,
      label: "first publication year",
      domain: [1800, d3.max(books, publicationDate)],
      grid: true,
    },
    r: {
      type: "pow",
      range: [1, 8],
    },
    x: {
      nice: true,
    },
    color: {
      legend: true,
      domain: ["Fiction", "Non-fiction", "Unknown"],
      range: ["blue", "green", "gray"],
      title: "is fiction?",
    },
  });
```

```js
const publicationPlot = resize((width) => PublicationPlot(width));
```

<div class="w-full">${publicationPlot}</div>

---

## Favorite Authors

```js
const booksGroupedByAuthor = rollups(
  books.filter(hasRating),
  authorScore,
  (d) => d["Author"]
); // .map(([key, value]) => value)

const authorsDomain = d3
  .sort(booksGroupedByAuthor, (d) => -d[1])
  .filter((d) => d[1] > 6)
  .map((d) => d[0]); //.slice(0, 50)
```

```js
const authorScore = (v) => v.length * d3.median(v, myRating) + v.length * 1.5;
```

```js
const AuthorsPlot = (myWidth) =>
  Plot.plot({
    width: myWidth,
    marginBottom: 150,
    x: {
      tickFormat: (d, i) => (myWidth > 500 || i % 2 === 0 ? d : ""),
      tickRotate: 90,
      label: "Author name",
      domain: authorsDomain,
      tickSize: 4,
    },
    y: {
      label: "# of books by same author colored by rating",
      ticks: 8,
    },
    color: {
      //legend: "swatches",
      legend: true,
      type: "ordinal",
      // Ratings only ever run 2-5 in the data, so a 1-star slot would be dead.
      // Descending so the legend leads with 5 stars.
      domain: range(5, 1, -1),
      // Four equally spaced samples from the middle 50% of viridis
      // (t = 0.75, 0.583, 0.417, 0.25), running green through teal to blue.
      // This skips the near-black purple at the bottom of the scheme and the
      // intense yellow at the top. Reversed to match the descending domain, so
      // 5 stars stays green.
      range: ["#5ec962", "#20a486", "#287c8e", "#3b528b"],
      // Filled stars only; the legend is a key, so the unfilled remainder that
      // ratingStars adds is just noise here.
      tickFormat: (d) => "★".repeat(d),
    },
    marks: [
      Plot.barY(
        books.filter(hasRating),
        Plot.groupX(
          {
            y: "count",
          },
          {
            x: "Author",
            fill: myRating,
            title: (d) =>
              `${d["Author"]} \n ${d["Title"]} \n rate: ${ratingStars(d)}\n\n`,
            sort: {
              x: "-data",
              reduce: (D) => authorScore(D.flat()),
            },

            tip: true,
          }
        )
      ),
      Plot.ruleY([0]),
    ],
  });
```

```js
const authorsPlot = resize((width) => AuthorsPlot(width));
```

<div class="w-full">${authorsPlot}</div>
