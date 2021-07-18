
export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  "viewport": {
    "viewports": {
      "1440p": {
        "name": "1440p",
        "styles": {
          "width": '2560px',
          "height": '1440px',
        },
      },
      "fullHD": {
        "name": "Full HD",
        "styles": {
          "width": "1920px",
          "height": "1080px"
        },
      },
      "macBookProBig": {
        "name": "MacBook Pro Big",
        "styles": {
          "width": "1024px",
          "height": "640px"
        },
      },
      "macBookProMedium": {
        "name": "MacBook Pro Medium",
        "styles": {
          "width": "1440px",
          "height": "900px"
        },
      },
      "macBookProSmall": {
        "name": "MacBook Pro Small",
        "styles": {
          "width": "1680px",
          "height": "1050px"
        },
      },
      "pcINSEE": {
        "name": "PC Agent INSEE",
        "styles": {
          "width": "960px",
          "height": "540px"
        }
      },
      "verySmallLandscape": {
        "name": "Very small landscape",
        "styles": {
          "width": "599px",
          "height": "337px"
        }
      }
    }
  },

}