import Vue from 'vue'
import App from './App.vue'
import svgJs from './plugin/vueSvgPlugin'
import printJs from './plugin/vuePrintPlugin'

Vue.config.productionTip = false
Vue.use(svgJs);
Vue.use(printJs);

new Vue({
  render: h => h(App),
}).$mount('#app')
