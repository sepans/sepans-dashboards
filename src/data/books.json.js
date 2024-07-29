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


const noLocMap = new Map(noLocList.map(e => [e["title"].toLowerCase(), e["loc"]]))
// console.log(noLocMap)

const openLibraryApi = (isbn) => `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
const extractIsbn = (d) => d?.ISBN?.replace(/[\=]*\"/g,'')
const extractLICClass = (code) => code?.match(/(^[A-Z]+)+/i)?.[0] || 'N/A'
const dateRead = d => new Date(d["Date Read"] || d["Date Added"])



let olBookData
try {

  olBookData = await Promise.all(goodreadsData.map(async(grData, i) => {
      const isbn = extractIsbn(grData)
    
      const olResponse = await fetch(openLibraryApi(isbn))
      
      if (!olResponse.ok) {
        console.log(olResponse);
        throw new Error("unable to fetch");
      }

      const openLibraryDataJson = await olResponse.json()
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
    }))
}
catch(e) {
  console.log('Exception!!!!! ', e)
}

process.stdout.write(JSON.stringify(olBookData))