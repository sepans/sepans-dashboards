// this is the script to scrape goodreads rating data. scroll to the bottom of your mybooks page until
// your entire history is loaded. then copy and paste this into chrome console. it will copy your data
// in csv format into the clipboard. paste it into a file

const neededFields = ['title', 'author', 'isbn', 'isbn13','num_pages', 'avg_rating', 'rating', 'date_pub', 'date_read', 'date_added']

var table = document.getElementById('booksBody')

var reviewsJson = Array.from(table.querySelectorAll('tr')).map(review => Array.from(review.querySelectorAll('.field')).map(item => { 
    const name = item.classList[1]
    let value = item.querySelector('.value').innerText.trim().replace('\n        pp','').replace(' [edit]','') 
    if(name === 'rating') {
        value = Array.from(item.querySelectorAll('.star.on')).length
    }
    return { 
        name: name, 
        value: value
    }
}).filter(item => neededFields.include(item.name)))

var reviewArray = reviewsJson.map(review => review.map((item) => `"${Object.values(item)[1]}"`))

csvHead = reviewsJson.first().map(item =>   Object.values(item)[0]).join(',')

csvBody = reviewArray.map(review => review.join(',')).join('\n')

copy([csvHead].concat(csvBody).join('\n'))