import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
Vue.config.productionTip = false
App.mpType = 'app'
const app = new Vue({
  ...App
})
app.$mount()
// #endif

// #ifdef VUE3
import { createSSRApp } from 'vue'
import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ListSkeleton from '@/components/ListSkeleton.vue'
import MathCurveLoader from '@/components/MathCurveLoader/MathCurveLoader.vue'
import LoadingOverlay from '@/components/LoadingOverlay/LoadingOverlay.vue'
import SkeletonCard from '@/components/SkeletonCard/SkeletonCard.vue'
import SectionLoader from '@/components/SectionLoader/SectionLoader.vue'

export function createApp() {
  const app = createSSRApp(App)
  const pinia = createPinia()
  pinia.use(piniaPluginPersistedstate)
  app.use(pinia)
  app.component('ListSkeleton', ListSkeleton)
  app.component('MathCurveLoader', MathCurveLoader)
  app.component('LoadingOverlay', LoadingOverlay)
  app.component('SkeletonCard', SkeletonCard)
  app.component('SectionLoader', SectionLoader)
  return {
    app
  }
}
// #endif