import { defineConfig } from "vitepress";

export default defineConfig({
  title: "Modal Kit",
  description: "Accessible modal engine with adapters and themes.",
  base: "/modal-kit/",
  themeConfig: {
    socialLinks: [{ icon: "github", link: "https://github.com/AdamZouli/modal-kit" }],
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
