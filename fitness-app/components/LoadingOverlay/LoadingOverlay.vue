<template>
  <view
    class="loading-overlay"
    :class="{ 'loading-overlay--with-tabbar': withTabBar }"
    :style="overlayStyle"
    @touchmove.stop.prevent
    @click.stop
    @touchstart.stop
  >
    <slot></slot>
  </view>
</template>

<script>
export default {
  name: 'LoadingOverlay',
  props: {
    visible: {
      type: Boolean,
      default: true,
    },
    zIndex: {
      type: Number,
      default: 9999,
    },
    bgColor: {
      type: String,
      default: 'rgba(255, 255, 255, 0.85)',
    },
    withTabBar: {
      type: Boolean,
      default: true,
    },
    topOffset: {
      type: String,
      default: '0px',
    },
  },
  computed: {
    overlayStyle() {
      return {
        zIndex: this.zIndex,
        backgroundColor: this.bgColor,
        top: this.topOffset,
      }
    },
  },
}
</script>

<style scoped>
.loading-overlay {
  position: fixed;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-overlay--with-tabbar {
  bottom: var(--window-bottom, 0px);
}
</style>
