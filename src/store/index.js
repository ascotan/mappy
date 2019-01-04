import Vue from 'vue';
import Vuex from 'vuex';

Vue.use(Vuex);

export default new Vuex.Store({
  state: {
    drawing: false,
    drawHeightMap: true,
    drawBoundaries: true,
    drawCentroids: false,
    drawOverlay: false,
    overlayScale: 100
  },
  mutations: {
    START_DRAW (state) {
        state.drawing = true;
    },
    STOP_DRAW (state) {
        state.drawing = false;
    },
    TOGGLE_DRAW_HEIGHTMAP (state, value) {
      state.drawHeightMap = value;
    },
    TOOGLE_DRAW_BOUNDARIES (state, value) {
      state.drawBoundaries = value;
    },
    TOOGLE_DRAW_CENTROIDS (state, value) {
      state.drawCentroids = value;
    },
    TOOGLE_DRAW_OVERLAY (state, value) {
      state.drawOverlay = value;
    },
    UPDATE_OVERLAY_SCALE (state, value) {
      state.overlayScale = value;
    }
  }
})