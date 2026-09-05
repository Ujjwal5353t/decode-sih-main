/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Update this to include the paths to all files that contain Nativewind classes.
  content: ["./App.js", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      // Bumped ~8-15% above Tailwind's defaults app-wide for readability on a
      // phone screen (this is an education app used by children) — a single
      // theme-level change rather than hand-editing every `text-*` className
      // across 20+ screens, so the whole app stays on one consistent scale.
      fontSize: {
        xs: ["13px", { lineHeight: "18px" }],
        sm: ["15px", { lineHeight: "22px" }],
        base: ["17px", { lineHeight: "26px" }],
        lg: ["19px", { lineHeight: "28px" }],
        xl: ["22px", { lineHeight: "30px" }],
        "2xl": ["26px", { lineHeight: "34px" }],
        "3xl": ["32px", { lineHeight: "38px" }],
        "4xl": ["38px", { lineHeight: "44px" }],
      },
    },
  },
  plugins: [],
};
