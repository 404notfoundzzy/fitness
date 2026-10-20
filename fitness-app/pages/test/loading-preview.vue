<template>
  <view class="preview-page">
    <view class="nav-header">
      <view class="back-btn" @click="goBack">
        <uni-icons type="left" size="20" color="#0EA5E9"></uni-icons>
      </view>
      <text class="nav-title">加载动画配置</text>
      <view class="nav-placeholder"></view>
    </view>

    <view class="fps-badge">
      <text class="fps-text">{{ fps }} FPS</text>
    </view>

    <scroll-view scroll-y class="content-scroll" :show-scrollbar="false">
      <!-- 页面预设 -->
      <view class="section">
        <view class="section-header">
          <view class="section-indicator"></view>
          <text class="section-title">页面预设</text>
        </view>
        <scroll-view scroll-x class="preset-row" :show-scrollbar="false">
          <view
            v-for="preset in presetList"
            :key="preset.key"
            class="preset-btn"
            :class="{ 'preset-active': activePreset === preset.key }"
            :style="{ borderColor: preset.color, backgroundColor: activePreset === preset.key ? preset.color + '1A' : '#fff' }"
            @click="applyPreset(preset.key)"
          >
            <view class="preset-dot" :style="{ backgroundColor: preset.color }"></view>
            <text class="preset-label" :style="{ color: activePreset === preset.key ? preset.color : '#64748b' }">{{ preset.label }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 曲线类型 -->
      <view class="section">
        <view class="section-header">
          <view class="section-indicator indicator-purple"></view>
          <text class="section-title">曲线类型</text>
        </view>
        <scroll-view scroll-x class="curve-row" :show-scrollbar="false">
          <view
            v-for="c in curveNames"
            :key="c"
            class="curve-btn"
            :class="{ 'curve-active': config.name === c }"
            @click="changeCurve(c)"
          >
            <text class="curve-btn-text" :class="{ 'curve-btn-text-active': config.name === c }">{{ c }}</text>
          </view>
        </scroll-view>
      </view>

      <!-- 滑块控制 -->
      <view class="section">
        <view class="section-header">
          <view class="section-indicator indicator-green"></view>
          <text class="section-title">参数调节</text>
        </view>

        <view class="control-card">
          <!-- 颜色选择 -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">颜色</text>
              <view class="color-preview" :style="{ backgroundColor: config.color }"></view>
            </view>
            <view class="color-swatches">
              <view
                v-for="sw in colorSwatches"
                :key="sw"
                class="color-swatch"
                :class="{ 'swatch-active': config.color === sw }"
                :style="{ backgroundColor: sw }"
                @click="setColor(sw)"
              ></view>
            </view>
          </view>

          <!-- Size -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Size</text>
              <text class="slider-value">{{ config.size }}rpx</text>
            </view>
            <slider :min="40" :max="300" :step="10" :value="config.size" activeColor="#0EA5E9" @change="onSlider('size', $event)" />
          </view>

          <!-- Particle Count -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Particle Count</text>
              <text class="slider-value">{{ config.particleCount }}</text>
            </view>
            <slider :min="10" :max="120" :step="5" :value="config.particleCount" activeColor="#0EA5E9" @change="onSlider('particleCount', $event)" />
          </view>

          <!-- Particle Max Size -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Particle Max Size</text>
              <text class="slider-value">{{ config.particleMaxSize }}px</text>
            </view>
            <slider :min="1" :max="8" :step="0.5" :value="config.particleMaxSize" activeColor="#0EA5E9" @change="onSlider('particleMaxSize', $event)" />
          </view>

          <!-- Particle Min Size -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Particle Min Size</text>
              <text class="slider-value">{{ config.particleMinSize }}px</text>
            </view>
            <slider :min="0.5" :max="4" :step="0.5" :value="config.particleMinSize" activeColor="#0EA5E9" @change="onSlider('particleMinSize', $event)" />
          </view>

          <!-- Trail Span -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Trail Span</text>
              <text class="slider-value">{{ config.trailSpan }}</text>
            </view>
            <slider :min="0.1" :max="0.8" :step="0.05" :value="config.trailSpan" activeColor="#0EA5E9" @change="onSlider('trailSpan', $event)" />
          </view>

          <!-- Duration -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Duration</text>
              <text class="slider-value">{{ config.duration }}ms</text>
            </view>
            <slider :min="1000" :max="10000" :step="200" :value="config.duration" activeColor="#0EA5E9" @change="onSlider('duration', $event)" />
          </view>

          <!-- Detail Scale -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Detail Scale</text>
              <text class="slider-value">{{ config.detailScale }}</text>
            </view>
            <slider :min="0.3" :max="1.0" :step="0.05" :value="config.detailScale" activeColor="#0EA5E9" @change="onSlider('detailScale', $event)" />
          </view>

          <!-- Rotation Duration -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Rotation Duration</text>
              <text class="slider-value">{{ config.rotationDuration }}ms</text>
            </view>
            <slider :min="5000" :max="60000" :step="1000" :value="config.rotationDuration" activeColor="#0EA5E9" @change="onSlider('rotationDuration', $event)" />
          </view>

          <!-- Pulse Duration -->
          <view class="slider-group">
            <view class="slider-label-row">
              <text class="slider-label">Pulse Duration</text>
              <text class="slider-value">{{ config.pulseDuration }}ms</text>
            </view>
            <slider :min="1000" :max="10000" :step="200" :value="config.pulseDuration" activeColor="#0EA5E9" @change="onSlider('pulseDuration', $event)" />
          </view>
        </view>
      </view>

      <!-- 播放/暂停 -->
      <view class="section">
        <view class="play-btn" :class="{ 'is-paused': !isPlaying }" @click="togglePlay">
          <text class="play-btn-text">{{ isPlaying ? '暂停' : '播放' }}</text>
        </view>
      </view>

      <!-- 实时预览 -->
      <view class="section">
        <view class="section-header">
          <view class="section-indicator indicator-orange"></view>
          <text class="section-title">实时预览</text>
        </view>
        <view class="preview-card">
          <MathCurveLoader
            :key="loaderKey"
            :name="config.name"
            :color="config.color"
            :size="config.size"
            :particle-count="config.particleCount"
            :particle-max-size="config.particleMaxSize"
            :particle-min-size="config.particleMinSize"
            :trail-span="config.trailSpan"
            :duration="config.duration"
            :detail-scale="config.detailScale"
            :rotation-duration="config.rotationDuration"
            :pulse-duration="config.pulseDuration"
            :overlay="false"
            :auto-play="isPlaying"
            :text="''"
          />
        </view>
      </view>

      <!-- 解析配置展示 -->
      <view class="section">
        <view class="section-header">
          <view class="section-indicator indicator-purple"></view>
          <text class="section-title">解析配置</text>
        </view>
        <view class="config-card">
          <view
            v-for="item in resolvedConfigList"
            :key="item.key"
            class="config-row"
          >
            <text class="config-key">{{ item.key }}</text>
            <text class="config-val">{{ item.value }}</text>
            <text class="config-badge" :class="'badge-' + item.source">{{ item.source }}</text>
          </view>
        </view>
      </view>

      <view style="height: 60rpx;"></view>
    </scroll-view>
  </view>
</template>

<script>
import MathCurveLoader from '@/components/MathCurveLoader/MathCurveLoader.vue'
import { curves } from '@/components/MathCurveLoader/curve-definitions.js'

var LOG_PREFIX = '[ConfigDemo]'

var PAGE_CONFIGS = {
  'index-weight':     { name: 'rose-three',       color: '#14B8A6', size: 86, particleCount: 66, particleMaxSize: 2, particleMinSize: 1, trailSpan: 0.8, duration: 2200 },
  'index-activity':   { name: 'rose-three',       color: '#10B981', size: 86, particleCount: 66, particleMaxSize: 2, particleMinSize: 1, trailSpan: 0.8, duration: 2200 },
  'weight-history':   { name: 'cardioid-glow',    color: '#14B8A6', size: 86, particleCount: 66, particleMaxSize: 2, particleMinSize: 1, trailSpan: 0.8, duration: 2200 },
  'water-history':    { name: 'lissajous-drift',  color: '#38BDF8', size: 86, particleCount: 66, particleMaxSize: 2, particleMinSize: 1, trailSpan: 0.8, duration: 2200 },
  'activity-history': { name: 'spiral-search',    color: '#F97316', size: 86, particleCount: 66, particleMaxSize: 2, particleMinSize: 1, trailSpan: 0.8, duration: 2200 },
  'diet-history':     { name: 'lemniscate-bloom', color: '#22C55E', size: 86, particleCount: 66, particleMaxSize: 2, particleMinSize: 1, trailSpan: 0.8, duration: 2200 },
  'height-history':   { name: 'hypotrochoid-loop',color: '#A855F7', size: 86, particleCount: 66, particleMaxSize: 2, particleMinSize: 1, trailSpan: 0.8, duration: 2200 },
}

export default {
  components: {
    MathCurveLoader,
  },

  data: function () {
    return {
      activePreset: '',
      loaderKey: 0,
      isPlaying: true,
      fps: 0,
      fpsFrameCount: 0,
      fpsLastTime: 0,
      fpsTimer: null,
      config: {
        name: 'rose-three',
        color: '#14B8A6',
        size: 86,
        particleCount: 66,
        particleMaxSize: 2,
        particleMinSize: 1,
        trailSpan: 0.8,
        duration: 2200,
        detailScale: 0.75,
        rotationDuration: 28000,
        pulseDuration: 4400,
      },
      // 跟踪每个配置项的来源: 'props' | 'pageConfig' | 'default'
      configSources: {},
    }
  },

  computed: {
    presetList: function () {
      var list = []
      var keys = Object.keys(PAGE_CONFIGS)
      for (var i = 0; i < keys.length; i++) {
        var k = keys[i]
        list.push({
          key: k,
          label: k.split('-').map(function (w) { return w.charAt(0).toUpperCase() + w.slice(1) }).join(' '),
          color: PAGE_CONFIGS[k].color,
        })
      }
      return list
    },

    curveNames: function () {
      return curves.map(function (c) { return c.name })
    },

    colorSwatches: function () {
      return [
        '#14B8A6', '#10B981', '#0EA5E9', '#38BDF8',
        '#F97316', '#22C55E', '#A855F7', '#6366F1',
        '#EC4899', '#EF4444', '#F59E0B', '#64748b',
      ]
    },

    resolvedConfigList: function () {
      var cfg = this.config
      var src = this.configSources
      var curveDef = null
      for (var i = 0; i < curves.length; i++) {
        if (curves[i].name === cfg.name) {
          curveDef = curves[i]
          break
        }
      }

      var items = [
        { key: 'name', value: cfg.name, source: src.name || 'default' },
        { key: 'color', value: cfg.color, source: src.color || 'default' },
        { key: 'size', value: cfg.size + 'rpx', source: src.size || 'default' },
        { key: 'particleCount', value: cfg.particleCount, source: src.particleCount || 'default' },
        { key: 'particleMaxSize', value: cfg.particleMaxSize + 'px', source: src.particleMaxSize || 'default' },
        { key: 'particleMinSize', value: cfg.particleMinSize + 'px', source: src.particleMinSize || 'default' },
        { key: 'trailSpan', value: cfg.trailSpan, source: src.trailSpan || 'default' },
        { key: 'duration', value: cfg.duration + 'ms', source: src.duration || 'default' },
        { key: 'detailScale', value: cfg.detailScale, source: src.detailScale || 'default' },
        { key: 'rotationDuration', value: cfg.rotationDuration + 'ms', source: src.rotationDuration || 'default' },
        { key: 'pulseDuration', value: cfg.pulseDuration + 'ms', source: src.pulseDuration || 'default' },
      ]

      if (curveDef) {
        items.push({ key: '(curve default)', value: curveDef.particleCount + ' particles, ' + curveDef.durationMs + 'ms cycle', source: 'default' })
      }

      return items
    },
  },

  mounted: function () {
    this.startFpsCounter()
  },

  beforeUnmount: function () {
    this.stopFpsCounter()
  },

  methods: {
    goBack: function () {
      uni.navigateBack({ delta: 1, fail: function () { uni.switchTab({ url: '/pages/index/index' }) } })
    },

    applyPreset: function (key) {
      var t0 = performance.now()
      var preset = PAGE_CONFIGS[key]
      if (!preset) return

      this.activePreset = key
      var oldName = this.config.name

      this.config.name = preset.name
      this.config.color = preset.color
      this.config.size = preset.size
      this.config.particleCount = preset.particleCount
      this.config.particleMaxSize = preset.particleMaxSize
      this.config.particleMinSize = preset.particleMinSize
      this.config.trailSpan = preset.trailSpan
      this.config.duration = preset.duration

      // 标记来源为 pageConfig
      this.configSources = {
        name: 'pageConfig',
        color: 'pageConfig',
        size: 'pageConfig',
        particleCount: 'pageConfig',
        particleMaxSize: 'pageConfig',
        particleMinSize: 'pageConfig',
        trailSpan: 'pageConfig',
        duration: 'pageConfig',
        detailScale: 'default',
        rotationDuration: 'default',
        pulseDuration: 'default',
      }

      if (oldName !== preset.name) {
        this.loaderKey++
      }

      var elapsed = (performance.now() - t0).toFixed(2)
      console.log(
        LOG_PREFIX + ' applyPreset | key=' + key +
        ' name=' + preset.name +
        ' color=' + preset.color +
        ' size=' + preset.size +
        ' particleCount=' + preset.particleCount +
        ' trailSpan=' + preset.trailSpan +
        ' duration=' + preset.duration +
        ' curveChanged=' + (oldName !== preset.name) +
        ' | t=' + elapsed + 'ms'
      )
    },

    changeCurve: function (newName) {
      var t0 = performance.now()
      var oldName = this.config.name
      if (oldName === newName) return

      this.config.name = newName
      this.configSources.name = 'props'
      this.activePreset = ''
      this.loaderKey++

      var elapsed = (performance.now() - t0).toFixed(2)
      console.log(
        LOG_PREFIX + ' changeCurve | old=' + oldName +
        ' new=' + newName +
        ' | t=' + elapsed + 'ms'
      )
    },

    setColor: function (color) {
      var t0 = performance.now()
      this.config.color = color
      this.configSources.color = 'props'
      this.activePreset = ''
      var elapsed = (performance.now() - t0).toFixed(2)
      console.log(
        LOG_PREFIX + ' setColor | color=' + color +
        ' | t=' + elapsed + 'ms'
      )
    },

    onSlider: function (param, e) {
      var t0 = performance.now()
      var val = e.detail.value
      this.config[param] = val
      this.configSources[param] = 'props'
      this.activePreset = ''
      var elapsed = (performance.now() - t0).toFixed(2)
      console.log(
        LOG_PREFIX + ' onSlider | param=' + param +
        ' value=' + val +
        ' | t=' + elapsed + 'ms'
      )
    },

    togglePlay: function () {
      var t0 = performance.now()
      this.isPlaying = !this.isPlaying
      var elapsed = (performance.now() - t0).toFixed(2)
      console.log(
        LOG_PREFIX + ' togglePlay | playing=' + this.isPlaying +
        ' | t=' + elapsed + 'ms'
      )
    },

    startFpsCounter: function () {
      var self = this
      self.fpsFrameCount = 0
      self.fpsLastTime = performance.now()

      function countFrame() {
        self.fpsFrameCount++
        self.fpsRaf = requestAnimationFrame(countFrame)
      }
      countFrame()

      self.fpsTimer = setInterval(function () {
        var now = performance.now()
        var delta = now - self.fpsLastTime
        if (delta > 0) {
          self.fps = Math.round((self.fpsFrameCount / delta) * 1000)
        }
        self.fpsFrameCount = 0
        self.fpsLastTime = now
      }, 1000)
    },

    stopFpsCounter: function () {
      if (this.fpsRaf) {
        cancelAnimationFrame(this.fpsRaf)
        this.fpsRaf = null
      }
      if (this.fpsTimer) {
        clearInterval(this.fpsTimer)
        this.fpsTimer = null
      }
    },
  },
}
</script>

<style scoped>
.preview-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #0f172a 0%, #1a1d29 40%, #1e293b 100%);
}

.nav-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 100rpx 30rpx 20rpx;
}

.back-btn {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(14, 165, 233, 0.15);
  border-radius: 50%;
}

.nav-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #f1f5f9;
}

.nav-placeholder {
  width: 64rpx;
}

.fps-badge {
  position: fixed;
  top: 100rpx;
  right: 20rpx;
  z-index: 100;
  background: rgba(14, 165, 233, 0.2);
  border: 1rpx solid rgba(14, 165, 233, 0.4);
  border-radius: 12rpx;
  padding: 6rpx 16rpx;
}

.fps-text {
  font-size: 20rpx;
  font-weight: 700;
  color: #38bdf8;
}

.content-scroll {
  height: calc(100vh - 180rpx);
  padding: 0 30rpx;
}

.section {
  margin-bottom: 30rpx;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 12rpx;
  margin-bottom: 16rpx;
}

.section-indicator {
  width: 6rpx;
  height: 28rpx;
  border-radius: 3rpx;
  background: #0ea5e9;
}

.section-indicator-green {
  background: #22c55e;
}

.section-indicator-purple {
  background: #a855f7;
}

.section-indicator-orange {
  background: #f97316;
}

.section-title {
  font-size: 28rpx;
  font-weight: 700;
  color: #e2e8f0;
}

/* 预设按钮行 */
.preset-row {
  white-space: nowrap;
  padding-bottom: 8rpx;
}

.preset-btn {
  display: inline-flex;
  align-items: center;
  gap: 8rpx;
  padding: 12rpx 20rpx;
  border-radius: 16rpx;
  border: 2rpx solid;
  margin-right: 16rpx;
  background: #fff;
  transition: all 0.2s;
}

.preset-btn.preset-active {
  border-width: 3rpx;
}

.preset-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  flex-shrink: 0;
}

.preset-label {
  font-size: 22rpx;
  font-weight: 600;
  white-space: nowrap;
}

/* 曲线类型按钮行 */
.curve-row {
  white-space: nowrap;
  padding-bottom: 8rpx;
}

.curve-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10rpx 18rpx;
  border-radius: 12rpx;
  background: rgba(255, 255, 255, 0.06);
  border: 1rpx solid rgba(255, 255, 255, 0.1);
  margin-right: 12rpx;
  margin-bottom: 12rpx;
}

.curve-btn.curve-active {
  background: rgba(14, 165, 233, 0.15);
  border-color: #0ea5e9;
}

.curve-btn-text {
  font-size: 20rpx;
  color: #94a3b8;
  white-space: nowrap;
}

.curve-btn-text-active {
  color: #38bdf8;
  font-weight: 700;
}

/* 控制面板 */
.control-card {
  background: rgba(255, 255, 255, 0.05);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 24rpx;
}

.slider-group {
  margin-bottom: 20rpx;
}

.slider-group:last-child {
  margin-bottom: 0;
}

.slider-label-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8rpx;
}

.slider-label {
  font-size: 22rpx;
  font-weight: 600;
  color: #cbd5e1;
}

.slider-value {
  font-size: 22rpx;
  font-weight: 700;
  color: #38bdf8;
}

/* 颜色选择 */
.color-preview {
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  border: 2rpx solid rgba(255, 255, 255, 0.2);
}

.color-swatches {
  display: flex;
  flex-wrap: wrap;
  gap: 12rpx;
  margin-top: 8rpx;
}

.color-swatch {
  width: 44rpx;
  height: 44rpx;
  border-radius: 50%;
  border: 3rpx solid transparent;
  transition: border-color 0.2s;
}

.color-swatch.swatch-active {
  border-color: #fff;
  box-shadow: 0 0 12rpx rgba(255, 255, 255, 0.3);
}

/* 播放/暂停按钮 */
.play-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  border-radius: 16rpx;
  background: linear-gradient(135deg, #0ea5e9, #6366f1);
}

.play-btn.is-paused {
  background: linear-gradient(135deg, #475569, #64748b);
}

.play-btn-text {
  font-size: 28rpx;
  font-weight: 700;
  color: #fff;
}

/* 预览区域 */
.preview-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 24rpx;
  padding: 40rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
}

/* 解析配置展示 */
.config-card {
  background: rgba(255, 255, 255, 0.04);
  border: 1rpx solid rgba(255, 255, 255, 0.08);
  border-radius: 20rpx;
  padding: 20rpx 24rpx;
}

.config-row {
  display: flex;
  align-items: center;
  padding: 10rpx 0;
  border-bottom: 1rpx solid rgba(255, 255, 255, 0.04);
}

.config-row:last-child {
  border-bottom: none;
}

.config-key {
  font-size: 22rpx;
  font-weight: 600;
  color: #94a3b8;
  width: 240rpx;
  flex-shrink: 0;
}

.config-val {
  font-size: 22rpx;
  font-weight: 700;
  color: #e2e8f0;
  flex: 1;
}

.config-badge {
  font-size: 18rpx;
  font-weight: 700;
  padding: 4rpx 14rpx;
  border-radius: 8rpx;
  flex-shrink: 0;
}

.badge-props {
  background: rgba(14, 165, 233, 0.15);
  color: #38bdf8;
}

.badge-pageConfig {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.badge-default {
  background: rgba(100, 116, 139, 0.15);
  color: #94a3b8;
}
</style>
