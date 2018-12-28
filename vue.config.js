const resolve = require('resolve');
module.exports = {
  css: {
    loaderOptions: {
      sass: {
        data: `
          @import "@/scss/main.scss";
        `
      }
    }
  }
};