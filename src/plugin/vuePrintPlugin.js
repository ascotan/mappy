import printJs from "print-js/dist/print"

export default {
    install: Vue => {
        Vue.prototype.$print = printJs
    }
}