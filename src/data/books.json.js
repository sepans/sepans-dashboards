 import { readFileSync } from "fs"
import { csvParse } from "d3-dsv"
import { json } from "d3-fetch"


import { LocCategoryMap } from "../utils/locCategoryMap.js"
// import * as util from "../utils/locCategoryMap"
// console.log('uuuutil !!', util)


 const goodreadsDataRaw = readFileSync("src/data/goodreads.csv",  "utf-8")





const goodreadsData =  csvParse(goodreadsDataRaw)

const openLibraryApi = (isbn) => `https://openlibrary.org/api/books?bibkeys=ISBN:${isbn}&format=json&jscmd=data`
const extractIsbn = (d) => d?.ISBN?.replace(/[\=]*\"/g,'')
const extractLICClass = (code) => code?.match(/(^[A-Z]+)+/i)?.[0] || 'N/A'
const dateRead = d => new Date(d["Date Read"] || d["Date Added"])

const olBookData = await Promise.all(goodreadsData.map(async(grData, i) => {
    const isbn = extractIsbn(grData)
  
    const openLibraryDataResponse = await json(openLibraryApi(isbn))
    //console.log(openLibraryDataResponse)
    const isbnKeys = Object.keys(openLibraryDataResponse)
    
    const openLibraryData = isbnKeys.length ? openLibraryDataResponse[isbnKeys[0]] : {}
    // console.log( {...grData, ...openLibraryData})
    const lc_class = extractLICClass(openLibraryData.classifications?.lc_classifications?.[0])
    const lc_class_name = LocCategoryMap[lc_class]
    const extracted = {
     date_read: dateRead(grData),
     year_published: parseInt(grData["Year Published"]),
     my_rate: grData["My Rating"],          
     lc_class,
     lc_class_name,
     
   }
    return {...grData, ...extracted, ...openLibraryData}
  }))

process.stdout.write(JSON.stringify(olBookData))