export const coverImage = d => d?.cover?.medium
export const myRating = d => parseInt(d["My Rating"])
export const  dateRead = d => new Date(d["Date Read"]) // || d["Date Added"])
export const readAfter = (year) => {
    return d => new Date(d["date_read"]).getFullYear() > year
}

export const avgRating = (d) =>  parseFloat(d['Average Rating'])
export const publicationDate = d => parseInt(d["Original Publication Year"])
export const readBook = d => validDate(dateRead(d))
export const validDate = d => d instanceof Date && !isNaN(d)
export const hasRating = d => d["My Rating"] > 0
export const initial = d => d?.split(' ').map(d => d[0]).join('.')