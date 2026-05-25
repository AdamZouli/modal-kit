import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Modal Kit",
  description: "Accessible modal engine with adapters and themes.",
  base: "/modal-kit/",
  head: [["link", { rel: "icon", type: "image/svg+xml", href: "/modal-kit/favicon.svg" }]],
  themeConfig: {
    socialLinks: [{ icon: "github", link: "https://github.com/AdamZouli/modal-kit" }],
    nav: [
      { text: "Guide", link: "/getting-started" },
      { text: "Theme Gallery", link: "/themes" },
      { text: "Live Examples", link: "./examples/theme-gallery.html", target: "_self" },
      { text: "API", link: "/api" }
    ],
    sidebar: [
      {
        text: "Guide",
        items: [
          { text: "Getting Started", link: "/getting-started" },
          { text: "Theme Gallery", link: "/themes" },
          { text: "API", link: "/api" }
        ]
      }
    ],
    editLink: {
      pattern: "https://github.com/AdamZouli/modal-kit/edit/main/docs/:path",
      text: "Edit this page on GitHub"
    },
    footer: {
      message: "Released under the MIT License.",
      copyright: "Copyright 2026"
    }
  }
});
