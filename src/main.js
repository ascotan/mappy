import Vue from 'vue'
import Vuex from 'vuex'
import App from './App.vue'
import store from './store'

import svgJs from './plugin/vueSvgPlugin'
import printJs from './plugin/vuePrintPlugin'

Vue.config.productionTip = false
Vue.use(Vuex);
Vue.use(svgJs);
Vue.use(printJs);

new Vue({
  store,
  render: h => h(App)
}).$mount('#app');