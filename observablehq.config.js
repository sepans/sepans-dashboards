// See https://observablehq.com/framework/config for documentation.
export default {
  // The project’s title; used in the sidebar and webpage titles.
  title: "sepans dashboards",

  // The pages and sections in the sidebar. If you don’t specify this option,
  // all pages will be listed in alphabetical order. Listing pages explicitly
  // lets you organize them into sections and have unlisted pages.
  // pages: [
  //   {
  //     name: "Examples",
  //     pages: [
  //       {name: "Dashboard", path: "/example-dashboard"},
  //       {name: "Report", path: "/example-report"}
  //     ]
  //   }
  // ],

  // Content to add to the head of the page, e.g. for a favicon:
  head: '<link rel="icon" href="sepans-logo.png" type="image/png" sizes="66x64">',

  // The path to the source root.
  root: "src",

  // Custom stylesheet; re-imports the default theme, then overrides fonts and
  // adds page-specific styles. See src/style.css.
  style: "style.css",

  // There is only one page, so the sidebar has nothing to navigate to.
  sidebar: false,

  // Some additional configuration options and their defaults:
  // theme: "default", // try "light", "dark", "slate", etc.
  // header: "", // what to show in the header (HTML)
  // footer: "Built with Observable.", // what to show in the footer (HTML)
  // toc: true, // whether to show the table of contents
  // pager: true, // whether to show previous & next links in the footer
  // output: "dist", // path to the output root for build
  // search: true, // activate search
  // linkify: true, // convert URLs in Markdown to links
  // typographer: false, // smart quotes and other typographic improvements
  // preserveIndex: false, // drop /index from URLs (replaces cleanUrls)
  // preserveExtension: false, // drop .html from URLs (replaces cleanUrls)
};
