 import { readFileSync } from "fs"
import { csvParse } from "d3-dsv"
import { json } from "d3-fetch"


import { LocCategoryMap } from "../utils/locCategoryMap.js"


 const goodreadsDataRaw = readFileSync("src/data/goodreads.csv",  "utf-8")

 const noLocListRaw = readFileSync("src/data/no-loc-list.csv",  "utf-8")




const goodreadsData =  csvParse(goodreadsDataRaw)
const noLocList =  csvParse(noLocListRaw)


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
      }
      
      let lc_class = extractLICClass(locNumber)
      const lc_class_name = LocCategoryMap[lc_class]
      const extracted = {
        date_read: dateRead(grData),
        year_published: parseInt(grData["Year Published"]),
        my_rate: grData["My Rating"],          
        lc_class,
        lc_class_name,
        
      }
      // if(grData['Author'].includes('Cixin')) {
      //   console.log(grData["Title"], lc_class)
      // }

     
      return {...grData, ...extracted, ...openLibraryData}
    }))
}
catch(e) {
  console.log('Exception !!!! ', e)
}

process.stdout.write(JSON.stringify(olBookData))