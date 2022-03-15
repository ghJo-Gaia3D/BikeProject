import Vue from 'vue'
import App from './App.vue'

Vue.config.productionTip = false

new Vue({
  render: h => h(App),
})

// 원래 기본설정
// new Vue({
//   render: h => h(App),
// }).$mount('#app')
