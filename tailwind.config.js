/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.tsx"],
  theme: {
    extend: {
      boxShadow: {
        "payload-input":
          "0 2px 3px 0 rgba(0, 2, 4, 0.05), 0 10px 4px -8px rgba(0, 2, 4, 0.02)",
        "payload-input-hover":
          "0 2px 3px 0 rgba(0, 2, 4, 0.13), 0 6px 4px -4px rgba(0, 2, 4, 0.1)",
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
