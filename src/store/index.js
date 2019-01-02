import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    drawing: false
  },
  mutations: {
    START_DRAW (state) {
        state.drawing = true;
    },
    STOP_DRAW (state) {
        state.drawing = false;
    }
  }
})