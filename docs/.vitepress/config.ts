import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Modal Kit",
  description: "Accessible modal engine with adapters and themes.",
  base: "/modal-kit/",
  themeConfig: {
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "API", link: "/api" },
      { text: "Themes", link: "/themes" },
      { text: "Examples", link: "/examples" }
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "API", link: "/api" },
          { text: "Themes", link: "/themes" },
          { text: "Examples", link: "/examples" }
        ]
      }
    ]
  }
});
