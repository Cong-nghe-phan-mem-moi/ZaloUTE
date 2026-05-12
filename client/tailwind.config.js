/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        secondary: "#5c5f61",
        "surface-bright": "#faf8ff",
        "surface-container-low": "#f2f3ff",
        "inverse-on-surface": "#eff0fd",
        tertiary: "#a33500",
        "inverse-primary": "#b2c5ff",
        "tertiary-container": "#cc4500",
        "secondary-container": "#e0e3e6",
        "on-surface-variant": "#424655",
        outline: "#727687",
        "on-background": "#191b24",
        "surface-container-high": "#e6e7f4",
        error: "#ba1a1a",
        background: "#faf8ff",
        "primary-container": "#0068ff",
        "on-tertiary-fixed-variant": "#812800",
        "on-secondary-container": "#626567",
        "error-container": "#ffdad6",
        "surface-container": "#ecedfa",
        "inverse-surface": "#2e3039",
        "tertiary-fixed": "#ffdbcf",
        "surface-variant": "#e1e2ee",
        "on-primary-fixed": "#001848",
        "on-secondary": "#ffffff",
        "secondary-fixed": "#e0e3e6",
        "on-primary-container": "#fbf9ff",
        "surface-dim": "#d8d9e6",
        primary: "#0052cc",
        surface: "#faf8ff",
        "on-surface": "#191b24",
        "on-error-container": "#93000a",
        "surface-container-lowest": "#ffffff",
        "on-tertiary-container": "#fff9f7",
        "surface-container-highest": "#e1e2ee",
        "surface-tint": "#0055d4",
        "on-primary-fixed-variant": "#0040a2",
        "tertiary-fixed-dim": "#ffb59b",
        "outline-variant": "#c2c6d8",
        "on-secondary-fixed": "#191c1e",
        "on-tertiary": "#ffffff",
        "secondary-fixed-dim": "#c4c7ca",
        "on-secondary-fixed-variant": "#44474a",
        "primary-fixed": "#dae2ff",
        "on-tertiary-fixed": "#380d00",
        "on-error": "#ffffff",
        "on-primary": "#ffffff",
        "primary-fixed-dim": "#b2c5ff"
      },
      borderRadius: {
        DEFAULT: "0.25rem",
        lg: "0.5rem",
        xl: "0.75rem",
        full: "9999px"
      },
      spacing: {
        "container-margin": "16px",
        xs: "8px",
        gutter: "12px",
        lg: "24px",
        base: "4px",
        md: "16px",
        xl: "32px",
        sm: "12px"
      },
      fontFamily: {
        "headline-lg": ["Inter"],
        "body-lg": ["Inter"],
        "headline-md": ["Inter"],
        "body-md": ["Inter"],
        "label-sm": ["Inter"],
        "label-md": ["Inter"]
      },
      fontSize: {
        "headline-lg": ["24px", { lineHeight: "32px", fontWeight: "700" }],
        "body-lg": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "headline-md": ["20px", { lineHeight: "28px", fontWeight: "600" }],
        "body-md": ["14px", { lineHeight: "20px", fontWeight: "400" }],
        "label-sm": ["12px", { lineHeight: "16px", fontWeight: "400" }],
        "label-md": ["13px", { lineHeight: "18px", letterSpacing: "0.02em", fontWeight: "500" }]
      }
    }
  },
  plugins: [],
}