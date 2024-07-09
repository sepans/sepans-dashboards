import { LocCategoryMap } from "../utils/locCategoryMap"

export const ClassificationLegend = (plot) => Plot.legend({
    color: plot.scale("color"),
    legend: "swatches",
    columns: 3,
    tickFormat: d => { return LocCategoryMap[d]?.substring(0, 70) || 
      'N/A'}
})