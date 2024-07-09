---
title: Goodread books
---

# Books

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
} from "./utils/bookUtils.js";
// import { ClassificationLegend } from "./components/classificationLegend.js"
import { range } from "npm:d3-array";
```

```js
display(books[0]);
```

```js
const ratingStars = (d) =>
  range(0, myRating(d))
    .map((s) => "★")
    .concat(range(myRating(d), 5).map((s) => "☆"))
    .join("");
```

```js
const tipTitle = (d) => [
            d["Title"],
            `by ${d["Author"]}`,
            publicationDate(d),
            d["lc_class_name"],
            ratingStars(d),
          ].join("\n\n")
```

---

## Some faviorates

<br>

<div style="overflow: scroll; max-height: 330px">
    ${books.filter(d => myRating(d) === 5).filter(coverImage).map(book => 
        html`<a href="${book.url}" target="_blank">
            <img src="${coverImage(book)}" 
            alt="${book["Title"]} by ${book["Author"]}" 
            height="110">
        </a>`
    )}
</div>

```js
const TimelinePlot = (myWidth) => {
  const plot = Plot.plot({
    insetTop: 35,
    marginBottom: 100,
    marginLeft: 50,
    width: myWidth,
    height: 800,
    caption: "recent books by category over time",
    marks: [
      Plot.dot(books.filter(readAfter(2018)), {
        x: (d) => dateRead(d),
        y: "lc_class",
        stroke: "lc_class",
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
    ],
    y: {
      tickFormat: (d) => d,
    },
    r: {
      type: "pow",
      range: [1, 5],
    },
    x: {
      nice: true,
    },
    color: {
      // color: plot.scale("color"),
      legend: "swatches",
      columns: 3,
      tickFormat: (d) =>
        `${LocCategoryMap[d]?.substring(0, 70)} (${d})` || "N/A",
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

## Books by Library of Congress Classification over time

<br>

<div class="w-full">${timelinePlot}</div>

## My rating vs Average rating

```js
const RatingPlot = (myWidth) =>
  Plot.plot({
    caption: "All five starts by page",
    marginLeft: 10,
    marginBottom: 150,
    marks: [
      Plot.link(
        books.filter(myRating), //.sort((a, b) => { return numberOfPages(b) - numberOfPages(a)}),
        {
          x1: (d) => d["Title"], 
          x1: (d) => d["Title"], 
          y2: (d) => myRating(d) - avgRating(d),
          y1: 0,
          stroke: (d) => (myRating(d) - avgRating(d) < 0 ? "red" : "green"),
          markerEnd: "arrow",
          //   stroke: 'black',
          strokeWidth: 1,
          thresholds: 10,
          title: (d) =>
            `${d["Title"]} \n ${d["Author"]} \n My rate: ${myRating(
              d
            )} \n avg rate: ${avgRating(d)} \n diff ${d3.format("+.1f")(
              myRating(d) - avgRating(d)
            )}`,
          opacity: 0.6,
          label: false,
          tip: true,
          
        }
      ),
    ],
    sort: "x",
    x: {
      domain: d3
        .sort(books.filter(myRating), (d) => avgRating(d) - myRating(d))
        .map((d) => d["Title"]),
      tickFormat:  (d, i) => (width > 600 &&  i % 2 === 0) ? d.substring(0, 30) : null,
      tickRotate: 90,
      ticks: 10,
    },
    y: {
      domain: [-4, 4],
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
const PublicationPlot = (myWidth) =>
  Plot.plot({
    // insetTop: 35,
    // marginBottom: 100,
    // marginLeft: 30,
    width: myWidth,
    height: 800,
    // caption: 'recent books by category over time',
    marks: [
      Plot.dot(books.filter(readBook), {
        x: dateRead,
        y: publicationDate, // "lc_class",// d => { /*console.log('d', d);*/ return parseInt(d["my_rate"])},
        // stroke: "lc_class",
        stroke: "gray",
        r: (d) => d["my_rate"],
        //fill: 'red',
        title: (d) => tipTitle(d),
        tip: true,
      }),
    ],
    y: {
      tickFormat: (d) => `${d}`,
      // nice: true,
      label: "first publication year",
      domain: [1800, d3.max(books, publicationDate)],
    },
    r: {
      type: "pow",
      range: [1, 5],
    },
    x: {
      nice: true,
    },
  });
```

```js
const publicationPlot = resize((width) => PublicationPlot(width));
```

<div class="w-full">${publicationPlot}</div>

---

```js
Plot.plot({
  width: 900,
  marginBottom: 150,
  x: {
    tickFormat: d => d,
    tickRotate: 90,
    label: 'Author name',
    // domain: d3.sort(books.filter(hasRating), myRating).map(d => d["Author"]).reverse(), // sort by one rating
    //domain: books.filter(hasRating).map(d => d["Author"]),
  },
  y: {
    label: '# of books by same author colored by rating',
    ticks: 8,
  },
  color: {
    legend: true,
    scheme: 'ylorrd',
    domain: [1, 5],
  },
  marks: [
    Plot.barY(books.filter(hasRating), 
          Plot.groupX(
            {y: "count",
             // filter: g => {console.log('filter', g); return g.length > 1}
                //g => { return g.length },//d3.median(g, d => myRating(d))}
            },
            {
              x: "Author",
              fill: myRating,
              // z: myRating,
              // y: d => parseInt(d["Number of Pages"]),
              title: (d) => `${d["Author"]} \n ${d["Title"]} \n rate: ${ratingStars(d)}\n\n`,
              //sort: {x: g => { console.log('sort', g); return g.length }},//d3.median(g, d => myRating(d))}},
              sort: {x: 'y', reduce: "median", order: "descending", limit: 50},
              tip: true,
              //filter: d => {console.log('filter', d); return true}

            }),
            
    ),
    Plot.ruleY([0])
  ],
})
```