module.exports = {
  css: {
    loaderOptions: {
      sass: {
        data: `
          @import "@/scss/_variables.scss";
          @import "bulma/bulma.sass";
        `
      }
    }
  }
};