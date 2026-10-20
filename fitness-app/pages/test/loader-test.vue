<template>
  <view class="test-page">
    <view class="header">
      <view class="nav-left" @click="goBack">
        <uni-icons type="left" size="24" color="#0EA5E9"></uni-icons>
      </view>
      <text class="title">MathCurveLoader 组件测试</text>
      <view class="nav-placeholder"></view>
    </view>

    <scroll-view scroll-y class="content-scroll">
      <view class="section">
        <text class="section-title">基础用法 — 传入 name 即可</text>
        <view class="demo-row">
          <view class="demo-item">
            <MathCurveLoader name="rose-three" :size="160" color="#0EA5E9" text="Rose Three" />
          </view>
          <view class="demo-item">
            <MathCurveLoader name="butterfly-phase" :size="160" color="#F59E0B" text="Butterfly" />
          </view>
          <view class="demo-item">
            <MathCurveLoader name="heart-wave" :size="160" color="#F87171" text="Heart Wave" />
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">自定义颜色</text>
        <view class="color-bar">
          <view
            v-for="c in colorOptions"
            :key="c.color"
            class="color-dot"
            :class="{ active: selectedColor === c.color }"
            :style="{ background: c.color }"
            @click="selectedColor = c.color"
          ></view>
        </view>
        <view class="demo-center">
          <MathCurveLoader name="original-thinking" :size="240" :color="selectedColor" text="切换颜色试试" />
        </view>
      </view>

      <view class="section">
        <text class="section-title">自定义尺寸</text>
        <view class="size-bar">
          <view
            v-for="s in sizeOptions"
            :key="s"
            class="size-btn"
            :class="{ active: selectedSize === s }"
            @click="selectedSize = s"
          >
            <text class="size-text">{{ s }}rpx</text>
          </view>
        </view>
        <view class="demo-center">
          <MathCurveLoader name="lissajous-drift" :size="selectedSize" color="#A855F7" :text="selectedSize + 'rpx'" />
        </view>
      </view>

      <view class="section">
        <text class="section-title">全部 21 种动画</text>
        <view class="gallery">
          <view
            v-for="curve in allCurves"
            :key="curve.name"
            class="gallery-item"
          >
            <MathCurveLoader
              :name="curve.name"
              :size="140"
              :color="galleryColor"
              :text="curve.label"
            />
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">实际场景演示</text>
        <view class="scene-card">
          <view class="scene-header">
            <text class="scene-title">加载中状态</text>
            <view class="scene-btn" @click="simulateLoad">
              <text class="scene-btn-text">{{ loading ? '加载中...' : '模拟加载' }}</text>
            </view>
          </view>
          <view v-if="loading" class="scene-loading">
            <MathCurveLoader name="spiral-search" :size="180" color="#0EA5E9" text="正在获取数据..." />
          </view>
          <view v-else class="scene-content">
            <text class="scene-loaded">数据加载完成！</text>
          </view>
        </view>
      </view>

      <view class="section">
        <text class="section-title">配置说明</text>
        <view class="config-card">
          <text class="config-code">&lt;MathCurveLoader</text>
          <text class="config-line">  name="<text class="val">rose-three</text>"        <text class="comment">// 必填，动画名称</text></text>
          <text class="config-line">  :size="<text class="val">200</text>"              <text class="comment">// 画布尺寸(rpx)，默认 200</text></text>
          <text class="config-line">  color="<text class="val">#ffffff</text>"          <text class="comment">// 粒子颜色，默认 #ffffff</text></text>
          <text class="config-line">  :particleCount="<text class="val">0</text>"       <text class="comment">// 覆盖粒子数，0=使用曲线默认</text></text>
          <text class="config-line">  :trailSpan="<text class="val">0</text>"           <text class="comment">// 覆盖尾迹长度，0=使用曲线默认</text></text>
          <text class="config-line">  :duration="<text class="val">0</text>"            <text class="comment">// 覆盖循环时长(ms)，0=使用曲线默认</text></text>
          <text class="config-line">  :autoPlay="<text class="val">true</text>"         <text class="comment">// 是否自动播放，默认 true</text></text>
          <text class="config-line">  text="<text class="val">加载中...</text>"          <text class="comment">// 提示文字，默认为空</text></text>
          <text class="config-code">/&gt;</text>
        </view>
        <view class="config-card" style="margin-top: 20rpx;">
          <text class="config-title">修改全局默认配置</text>
          <text class="config-desc">在 curve-definitions.js 中修改对应曲线的 particleCount、trailSpan、durationMs 等参数即可改变默认值。</text>
          <text class="config-desc">在 MathCurveLoader.vue 的 props 中修改 size 和 color 的 default 值即可改变组件默认尺寸和颜色。</text>
        </view>
      </view>

      <view style="height: 60rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
import { curves } from '@/components/MathCurveLoader/curve-definitions.js'

export default {
  data() {
    return {
      allCurves: curves,
      selectedColor: '#0EA5E9',
      selectedSize: 200,
      galleryColor: '#6ee7b7',
      loading: false,
      colorOptions: [
        { color: '#0EA5E9' },
        { color: '#6ee7b7' },
        { color: '#F59E0B' },
        { color: '#F87171' },
        { color: '#A855F7' },
        { color: '#38BDF8' },
        { color: '#ffffff' },
      ],
      sizeOptions: [120, 160, 200, 280, 360],
    }
  },
  methods: {
    goBack() {
      uni.navigateBack({ delta: 1 })
    },
    simulateLoad() {
      this.loading = true
      setTimeout(() => {
        this.loading = false
      }, 3000)
    },
  },
}
</script>

<style scoped>
.test-page {
  min-height: 100vh;
  background: #0a0a0a;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 30rpx;
  padding-top: calc(var(--status-bar-height, 44px) + 20rpx);
  background: rgba(10, 10, 10, 0.9);
  backdrop-filter: blur(16px);
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.06);
}

.nav-left {
  width: 80rpx;
  display: flex;
  align-items: center;
}

.title {
  font-size: 34rpx;
  font-weight: 600;
  color: #f5f5f5;
}

.nav-placeholder {
  width: 80rpx;
}

.content-scroll {
  height: calc(100vh - var(--status-bar-height, 44px) - 80rpx);
  padding: 0 30rpx;
}

.section {
  margin-top: 40rpx;
}

.section-title {
  font-size: 24rpx;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.5);
  letter-spacing: 0.08em;
  text-transform: uppercase;
  margin-bottom: 24rpx;
}

.demo-row {
  display: flex;
  justify-content: space-around;
  flex-wrap: wrap;
  gap: 20rpx;
}

.demo-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30rpx 20rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
}

.demo-center {
  display: flex;
  justify-content: center;
  padding: 40rpx 0;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
}

.color-bar {
  display: flex;
  gap: 16rpx;
  margin-bottom: 24rpx;
  justify-content: center;
}

.color-dot {
  width: 52rpx;
  height: 52rpx;
  border-radius: 50%;
  border: 3rpx solid transparent;
  transition: border-color 150ms ease, transform 150ms ease;
}

.color-dot.active {
  border-color: #fff;
  transform: scale(1.15);
}

.size-bar {
  display: flex;
  gap: 12rpx;
  margin-bottom: 24rpx;
  justify-content: center;
  flex-wrap: wrap;
}

.size-btn {
  padding: 12rpx 24rpx;
  border-radius: 999rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
}

.size-btn.active {
  background: rgba(168, 85, 247, 0.15);
  border-color: #A855F7;
}

.size-text {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
}

.size-btn.active .size-text {
  color: #A855F7;
}

.gallery {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
  justify-content: center;
}

.gallery-item {
  padding: 20rpx 16rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid rgba(255, 255, 255, 0.05);
}

.scene-card {
  padding: 30rpx;
  border-radius: 24rpx;
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
}

.scene-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24rpx;
}

.scene-title {
  font-size: 28rpx;
  font-weight: 600;
  color: #f5f5f5;
}

.scene-btn {
  padding: 14rpx 28rpx;
  border-radius: 999rpx;
  background: rgba(14, 165, 233, 0.15);
  border: 1rpx solid rgba(14, 165, 233, 0.3);
}

.scene-btn-text {
  font-size: 24rpx;
  color: #0EA5E9;
}

.scene-loading {
  display: flex;
  justify-content: center;
  padding: 40rpx 0;
}

.scene-content {
  padding: 40rpx 0;
  text-align: center;
}

.scene-loaded {
  font-size: 28rpx;
  color: #6ee7b7;
}

.config-card {
  padding: 24rpx;
  border-radius: 20rpx;
  background: rgba(255, 255, 255, 0.03);
  border: 1rpx solid rgba(255, 255, 255, 0.06);
  font-family: "SF Mono", "JetBrains Mono", "Menlo", monospace;
}

.config-code {
  font-size: 22rpx;
  color: #6ee7b7;
  display: block;
}

.config-line {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.7);
  display: block;
  line-height: 1.8;
}

.val {
  color: #fbbf24;
}

.comment {
  color: rgba(255, 255, 255, 0.3);
}

.config-title {
  font-size: 26rpx;
  font-weight: 600;
  color: #f5f5f5;
  display: block;
  margin-bottom: 12rpx;
}

.config-desc {
  font-size: 22rpx;
  color: rgba(255, 255, 255, 0.5);
  display: block;
  line-height: 1.7;
  font-family: -apple-system, BlinkMacSystemFont, "PingFang SC", sans-serif;
}
</style>
