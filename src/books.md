---
title: Goodread books
---

# My books

I have scraped the data from Goodreads.com. Goodreads no longer has an API and its data export no longer includes the useful data. The data is augmented using the OpenLibrary API to add more semantic information.

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
  fictionNonFiction
} from "./utils/bookUtils.js";
// import { ClassificationLegend } from "./components/classificationLegend.js"
import { range, rollups, min, max, mean, extent } from "npm:d3-array";
// import { rollups } from "npm:d3-array";
```

```js
// display(books[0]);
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

## Some favorites

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

<br>

## List of all books


```js
  Inputs.table(books)
```

```js
const yearRange = extent(books.map(d => dateRead(d).getFullYear() ))
```



```js



const timelineBooks = books.filter(readAfter(startYearInput - 1))

const uniqueClasses = Array.from(new Set(timelineBooks.map(d => d['lc_class'])))
const fClasses = d3.sort(uniqueClasses.filter(c => c.startsWith('P')))
const nfClasses = d3.sort(uniqueClasses.filter(c => !c.startsWith('P')))
const sortedClasses = nfClasses.concat(fClasses)


const fictionCategories = timelineBooks.map(d => d['lc_class']).filter(d =>   d.startsWith('P'))



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
      Plot.rect([0],{
        x1: d => min(timelineBooks, dateRead),
        x2: d => max(timelineBooks, dateRead),
        y1: d => min(fictionCategories),
        y2: d => max(fictionCategories),
        //fill: '#555',
        fill: '#f0ddb6',
        opacity: 0.12,
        stroke: '#dbab4b',
        label: 'fiction',
        tip: true,
      }),
Plot.tip(
      [`Fiction`],
      {x: d =>  min(timelineBooks, dateRead), y: d => min(fictionCategories), dy: -10, dx: 20, anchor: "bottom"}
    ),      
          

    ],
    y: {
      tickFormat: d =>  d,
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
      scheme: 'viridis',
      domain: sortedClasses,
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

## Books by Library of Congress classification over time

Books read binned based on the Library of Congress classification category over time. Each row is one catagory (in case of fictions, sub category).

<sm>LoC classification number is what being used in libraries to sort books and unlike ISBN that is just a code is assigned based on the book content.</sm>

<br>

```js
   const startYearInput = view(Inputs.range(yearRange, {value: 2018, step: 1,  label: 'Books read since'}))
   // const gain = view(Inputs.range([0, 11], {value: 5, step: 0.1, label: "Gain"}))
```
<br>

<div class="w-full">${timelinePlot}</div>

## My rating vs Average rating

```js
   const showExtremes = view(Inputs.toggle({value: false, label: 'Only show large differences'}))
   // const gain = view(Inputs.range([0, 11], {value: 5, step: 0.1, label: "Gain"}))
```
<br>

```js
const ratingBooks = books.filter(myRating).filter(d => showExtremes ? Math.abs(myRating(d) - avgRating(d)) > 0.8 : true )

const RatingPlot = (myWidth) =>
  Plot.plot({
    marginLeft: 10,
    marginBottom: 150,
    marks: [
      Plot.link(
        ratingBooks, 
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
        .sort(ratingBooks, (d) => avgRating(d) - myRating(d))
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
   const pubStartYearInput = view(Inputs.range(yearRange, {value: 2002, step: 1,  label: 'Books read since'}))
```
<br>


```js
const pubBooks = books.filter(readBook).filter(readAfter(pubStartYearInput - 1))

const PublicationPlot = (myWidth) =>
  Plot.plot({
    // insetTop: 35,
    // marginBottom: 100,
    //marginLeft: 50,
    width: myWidth,
    height: 800,
    marks: [
      Plot.dot(pubBooks, {
        x: dateRead,
        y: publicationDate, // "lc_class",// d => { /*console.log('d', d);*/ return parseInt(d["my_rate"])},
        // stroke: "lc_class",
        //stroke: "gray",
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
        x: d => max(pubBooks, dateRead),
        //x2: d => max(pubBooks, dateRead),
        y: publicationDate, // "lc_class",// d => { /*console.log('d', d);*/ return parseInt(d["my_rate"])},
        // stroke: "lc_class",
        //stroke: "gray",
        fill: fictionNonFiction,
        //stroke: fictionNonFiction,
        fillOpacity: 0.6,
        strokeOpacity: 0.5,
        strokeWidth: 2,
        r: 3,
        //r: (d) => d["my_rate"],
        //fill: 'red',
        title: (d) => tipTitle(d),
        tip: true,
        dx: myWidth * 0.07
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
      // opacity: 0.5,
      // scheme: 'ylorrd',
      domain: ['Fiction', 'Non-fiction', 'Unknown'],
      range: ['blue', 'green', 'gray'],
      title: 'is fiction?'      
    }
    
  });
```

```js
const publicationPlot = resize((width) => PublicationPlot(width));
```

<div class="w-full">${publicationPlot}</div>

---

```js
  const booksGroupedByAuthor =  rollups(
    books.filter(hasRating), 
    authorScore,
    d => d["Author"]) // .map(([key, value]) => value)

  const authorsDomain = d3.sort(booksGroupedByAuthor, d => -d[1]).filter(d => d[1] > 5).map(d => d[0]).slice(0, 50)
  // console.log(booksGroupedByAuthor, authorsDomain, authorsDomain.length)
    
```

```js
 const authorScore = v => v.length * d3.median(v, myRating) + v.length * 1.5 
```

## Favorite Authors

```js
Plot.plot({
  width: 900,
  marginBottom: 150,
  x: {
    //tickFormat: (d, i) => i % 2 === 0 ? d : '',
    tickRotate: 90,
    label: 'Author name',
    // domain: d3.sort(books.filter(hasRating), myRating).map(d => d["Author"]).reverse(), // sort by one rating
    //domain: books.filter(hasRating).map(d => d["Author"]),
    domain: authorsDomain,
    tickSize: 4,
    // filter: d => { console.log(d); return 1}
    // limit: 20
  },
  y: {
    label: '# of books by same author colored by rating',
    ticks: 8,

  },
  color: {
    //legend: "swatches",
    legend: true,
    type: 'ordinal',
    scheme: 'ylorrd',
    domain: range(1, 6),
  },
  marks: [
    Plot.barY(books.filter(hasRating), 
          Plot.groupX(
            {
              y: "count",
             // sort: { y: 'x', reduce: d => { console.log('sort', d)}}

            //filter: g => {console.log('filter', g); return g.length > 1},

            // kind of works but not for authors with different book ratings
              // filter: 
               
              //   (D) => { 
              //      console.log('filter', D);
              //      const books = D.flat()
              //      console.log(books)
              //      const weightedAvg = books.length * d3.median(books, myRating)
              //      return weightedAvg > 4
              //   }
              // ,

            },
            {
              x: "Author",
              fill: myRating,
              // z: myRating,
              // y: d => parseInt(d["Number of Pages"]),
              title: (d) => `${d["Author"]} \n ${d["Title"]} \n rate: ${ratingStars(d)}\n\n`,
              //sort: {x: g => { console.log('sort', g); return g.length }},//d3.median(g, d => myRating(d))}},
              // sort: d => { console.log(d);},
              // sort: {x: 'y', reduce: "median", order: "descending", limit: 50},
              sort: {
                x: '-data',
                reduce: D => authorScore(D.flat())
                  
              },
              // filter: {
              //   x: 'x',
              //   reduce: (D) => { 
              //      console.log('filter', D);
              //      const books = D.flat()
              //      const weightedAvg = books.length * d3.median(books, myRating)
              //      return weightedAvg > 3 
              //   }
              // },

              tip: true,
              //filter: d => {console.log('filter', d); return true}

            }),
            
    ),
    Plot.ruleY([0])
  ],
})
```
