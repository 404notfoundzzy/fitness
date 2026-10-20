<template>
  <view class="lottie-wrap">
    <view :id="containerId" class="lottie-container"></view>
  </view>
</template>

<script>
export default {
  name: 'LottieIcon',
  props: {
    path: {
      type: String,
      required: true
    },
    loop: {
      type: Boolean,
      default: true
    },
    autoplay: {
      type: Boolean,
      default: true
    },
    width: {
      type: Number,
      default: 80
    },
    height: {
      type: Number,
      default: 80
    }
  },
  data() {
    return {
      containerId: `lottie_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      animInstance: null
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.loadAnimation()
    })
  },
  beforeUnmount() {
    if (this.animInstance) {
      this.animInstance.destroy()
    }
  },
  methods: {
    loadAnimation() {
      try {
        const lottie = require('lottie-web')
        if (!lottie) return

        const container = document.getElementById(this.containerId)
        if (!container) return

        this.animInstance = lottie.loadAnimation({
          container: container,
          renderer: 'svg',
          loop: this.loop,
          autoplay: this.autoplay,
          path: this.path
        })
      } catch (e) {
        console.warn('LottieIcon load error:', e)
      }
    }
  }
}
</script>

<style scoped>
.lottie-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
}

.lottie-container {
  width: 100%;
  height: 100%;
}
</style>