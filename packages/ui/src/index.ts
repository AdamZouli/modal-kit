export const modalClassNames = {
  root: "mk-modal",
  overlay: "mk-modal__overlay",
  panel: "mk-modal__panel",
  header: "mk-modal__header",
  icon: "mk-modal__icon",
  text: "mk-modal__text",
  title: "mk-modal__title",
  description: "mk-modal__description",
  details: "mk-modal__details",
  actions: "mk-modal__actions",
  button: "mk-modal__button",
  confirmButton: "mk-modal__button--confirm",
  cancelButton: "mk-modal__button--cancel",
  confirmVariant: "mk-modal--confirm"
} as const;

export const themeClassNames = {
  brutalist: "mk-theme-brutalist",
  retro: "mk-theme-retro",
  swiss: "mk-theme-swiss",
  cyber: "mk-theme-cyber",
  paper: "mk-theme-paper",
  glass: "mk-theme-glass",
  y2k: "mk-theme-y2k",
  mono: "mk-theme-mono",
  bauhaus: "mk-theme-bauhaus",
  noir: "mk-theme-noir",
  pastel: "mk-theme-pastel",
  terminal: "mk-theme-terminal",
  candy: "mk-theme-candy",
  nature: "mk-theme-nature",
  futurist: "mk-theme-futurist",
  gothic: "mk-theme-gothic"
} as const;

export type ModalTheme = keyof typeof themeClassNames;
