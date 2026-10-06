import { readFileSync } from "fs"
import { csvParse } from "d3-dsv"


import { LocCategoryMap } from "../utils/locCategoryMap.js"

const CSV_KEY_MAP = {
  "title": "Title",
  "author": "Author",
  "isbn": "ISBN",
  "isbn13": "ISBN13",
  "num_pages": "Number of Pages",
  "avg_rating": "Average Rating",
  "rating": "My Rating",
  "date_pub": "Year Published",
  "date_read": "Date Read",
  "date_added": "Date Added",
}


 // const goodreadsDataRaw = readFileSync("src/data/goodreads.csv",  "utf-8")
 const goodreadsDataRaw = readFileSync("src/data/goodreads-scrape.csv",  "utf-8")

 const noLocListRaw = readFileSync("src/data/no-loc-list.csv",  "utf-8")




let goodreadsData =  csvParse(goodreadsDataRaw)
const noLocList =  csvParse(noLocListRaw)

//console.log(goodreadsData)

goodreadsData = goodreadsData.map(item => {
  const newItem = {}
  Object.keys(item).forEach(key => {
    const newKey = CSV_KEY_MAP[key] 
    newItem[newKey] = item[key]
  })
  //console.log(newItem)
  return newItem
})

// Goodreads records one read date per line, so a re-read arrives as
// "Dec 08, 2023\nnot set [edit]" and an entry that was never dated arrives as
// the literal "not set". new Date() cannot parse either, which silently gave
// those books a null date_read and dropped them out of every date-based plot.
// Keep the first real date and discard the rest.
const READ_DATE = /[A-Z][a-z]{2} \d{1,2}, \d{4}|[A-Z][a-z]{2} \d{4}/
const firstReadDate = (value) => value?.match(READ_DATE)?.[0] ?? ""

goodreadsData = goodreadsData.map((item) => ({
  ...item,
  "Date Read": firstReadDate(item["Date Read"]),
}))

// The scrape reads the whole my-books table, which covers every shelf, so it
// also picks up "to read" entries. Those have neither a read date nor a
// rating. Dropping them here, before the OpenLibrary lookup, keeps them out of
// the dataset and saves a request each. A book that is rated but undated, or
// dated but unrated, still counts as read.
const isUnread = (d) => !d["Date Read"] && !parseInt(d["My Rating"])
const unread = goodreadsData.filter(isUnread)
goodreadsData = goodreadsData.filter((d) => !isUnread(d))

// stderr, so it shows in the build log without corrupting the JSON on stdout.
console.warn(
  `skipping ${unread.length} unread books: ${unread.map((d) => d["Title"]).join("; ")}`
)

const noLocMap = new Map(noLocList.map(e => [e["title"].toLowerCase(), e["loc"]]))
// console.log(noLocMap)

const openLibraryApi = (isbn) => `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
const extractIsbn = (d) => d?.ISBN?.replace(/[\=]*\"/g,'')
const extractLICClass = (code) => code?.match(/(^[A-Z]+)+/i)?.[0] || 'N/A'
const dateRead = d => new Date(d["Date Read"] || d["Date Added"])

// OpenLibrary rate-limits hard, so requests are throttled rather than fired
// all at once, and 429s are retried with exponential backoff.
const CONCURRENCY = 5
const MAX_RETRIES = 5
const REQUEST_TIMEOUT_MS = 15000

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

class HttpError extends Error {
  constructor(response, url) {
    super(`${response.status} ${response.statusText} for ${url}`)
    this.status = response.status
  }
}

// Network failures and aborted requests are transient; so are 429 and 5xx.
// Any other HTTP error means the request itself is wrong, so don't retry it.
const isTransient = (error) =>
  !(error instanceof HttpError) || error.status === 429 || error.status >= 500

const fetchJson = async (url) => {
  for (let attempt = 0; ; attempt++) {
    try {
      const response = await fetch(url, {signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS)})
      if (!response.ok) throw new HttpError(response, url)
      return await response.json()
    } catch (error) {
      if (!isTransient(error) || attempt >= MAX_RETRIES) throw error
      const delay = 2 ** attempt * 1000 + Math.random() * 1000
      console.warn(`${error.message}; retry ${attempt + 1}/${MAX_RETRIES} in ${Math.round(delay)}ms`)
      await sleep(delay)
    }
  }
}

// Map over items with at most `limit` requests in flight, preserving order.
const mapThrottled = async (items, limit, task) => {
  const results = new Array(items.length)
  let next = 0
  const worker = async () => {
    for (let i = next++; i < items.length; i = next++) {
      results[i] = await task(items[i])
    }
  }
  await Promise.all(Array.from({length: Math.min(limit, items.length)}, worker))
  return results
}



const olBookData = await mapThrottled(goodreadsData, CONCURRENCY, async (grData) => {
      const isbn = extractIsbn(grData)

      const openLibraryDataJson = await fetchJson(openLibraryApi(isbn))
      //console.log(openLibraryDataJson)
      const isbnKeys = Object.keys(openLibraryDataJson)
      const openLibraryData = isbnKeys.length ? openLibraryDataJson[isbnKeys[0]] : {}
  
      let locNumber = openLibraryData.classifications?.lc_classifications?.[0]
  
      if(!locNumber) {
        // console.log(grData["Title"], noLocMap.get(grData["Title"].toLowerCase()))
        locNumber = noLocMap.get(grData["Title"].toLowerCase())
        // if(!locNumber) {
        //   console.log(grData["Title"])
          
        // }
      }
      
      let lc_class = extractLICClass(locNumber)
      const lc_class_name = LocCategoryMap[lc_class]
      const extracted = {
        date_read: dateRead(grData),
        year_published: parseInt(grData["Year Published"]),
        my_rate: grData["My Rating"],          
        lc_class,
        lc_class_name,
        locNumber,
        
      }


     
      return {...grData, ...extracted, ...openLibraryData}
    })

process.stdout.write(JSON.stringify(olBookData))