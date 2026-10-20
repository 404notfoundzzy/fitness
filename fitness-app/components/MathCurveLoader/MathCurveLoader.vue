<template>
  <!--
    MathCurveLoader - 数学曲线粒子加载动画
    基于 DOM + CSS @keyframes 实现，全平台兼容（H5 / App / 小程序）
    不依赖 Canvas 2D、SVG 或 requestAnimationFrame
  -->
  <view class="math-curve-loader-root">
    <!-- 全屏遮罩模式 -->
    <LoadingOverlay
      v-if="overlay"
      :z-index="overlayZIndex"
      :bg-color="overlayBgColor"
      :with-tab-bar="withTabBar"
      :top-offset="topOffset"
    >
      <view class="loader-content">
        <view
          class="curve-container"
          :class="{ 'is-paused': !playing }"
          :style="containerStyle"
        >
          <!-- 旋转层：整体匀速旋转 -->
          <view class="animation-layer" :style="rotationStyle">
            <!-- 呼吸层：曲线脉动缩放 -->
            <view class="animation-layer" :style="breathingStyle">
              <!-- 曲线轮廓点：静态淡色小点勾勒曲线形状 -->
              <view
                v-for="(dot, i) in outlineDots"
                :key="'o' + i"
                class="outline-dot"
                :style="dot.style"
              />
              <!-- 运动粒子：沿曲线路径移动的发光点 -->
              <view
                v-for="(p, i) in particles"
                :key="'p' + i"
                class="particle"
                :style="p.style"
              />
            </view>
          </view>
        </view>
        <text v-if="text" class="loader-text" :style="textStyle">{{
          text
        }}</text>
      </view>
    </LoadingOverlay>

    <!-- 内嵌模式（无遮罩） -->
    <view v-else class="loader-inline-wrap">
      <view class="loader-content">
        <view
          class="curve-container"
          :class="{ 'is-paused': !playing }"
          :style="containerStyle"
        >
          <view class="animation-layer" :style="rotationStyle">
            <view class="animation-layer" :style="breathingStyle">
              <view
                v-for="(dot, i) in outlineDots"
                :key="'o' + i"
                class="outline-dot"
                :style="dot.style"
              />
              <view
                v-for="(p, i) in particles"
                :key="'p' + i"
                class="particle"
                :style="p.style"
              />
            </view>
          </view>
        </view>
        <text v-if="text" class="loader-text" :style="textStyle">{{
          text
        }}</text>
      </view>
    </view>
  </view>
</template>

<script>
import { curveMap } from "./curve-definitions.js";
import LoadingOverlay from "@/components/LoadingOverlay/LoadingOverlay.vue";

const LOG = "[MathCurveLoader]";

/**
 * 页面级加载动画预设配置
 *
 * 使用方式：在组件上传入 pageConfig="key" 即可自动应用预设参数。
 * 也可以直接通过 props 覆盖任意参数，优先级：props > pageConfig > 曲线默认值。
 *
 * 可配置字段：
 *   name          - 曲线名称，对应 curve-definitions.js 中的曲线
 *   color         - 粒子颜色（十六进制色值）
 *   size          - 容器尺寸（rpx 单位）
 *   particleCount - 粒子数量
 *   trailSpan     - 拖尾长度（0~1，占动画周期的比例）
 *   duration      - 动画周期（毫秒）
 *   rotationDuration - 旋转周期（毫秒）
 *   pulseDuration - 呼吸周期（毫秒）
 *   detailScale   - 曲线细节缩放（0~1，影响曲线展开程度）
 *   particleMaxSize  - 粒子最大尺寸（px）
 *   particleMinSize  - 粒子最小尺寸（px）
 *   outlineCount - 轮廓点数量
 */
const PAGE_LOADER_CONFIGS = {
  // 首页
  "index-weight": {
    name: "rose-three",
    color: "#14B8A6",
    size: 86,
    particleCount: 66,
    particleMaxSize: 2,
    particleMinSize: 1,
    trailSpan: 0.8,
    duration: 2200,
  },
  "index-activity": {
    name: "rose-three",
    color: "#10B981",
    size: 86,
    particleCount: 66,
    particleMaxSize: 2,
    particleMinSize: 1,
    trailSpan: 0.8,
    duration: 2200,
  },
  // 历史页
  "weight-history": {
    name: "cardioid-glow",
    color: "#14B8A6",
    size: 86,
    particleCount: 66,
    particleMaxSize: 2,
    particleMinSize: 1,
    trailSpan: 0.8,
    duration: 2200,
  },
  "water-history": {
    name: "lissajous-drift",
    color: "#38BDF8",
    size: 86,
    particleCount: 66,
    particleMaxSize: 2,
    particleMinSize: 1,
    trailSpan: 0.8,
    duration: 2200,
  },
  "activity-history": {
    name: "spiral-search",
    color: "#F97316",
    size: 86,
    particleCount: 66,
    particleMaxSize: 2,
    particleMinSize: 1,
    trailSpan: 0.8,
    duration: 2200,
  },
  "diet-history": {
    name: "lemniscate-bloom",
    color: "#22C55E",
    size: 86,
    particleCount: 66,
    particleMaxSize: 2,
    particleMinSize: 1,
    trailSpan: 0.8,
    duration: 2200,
  },
  "height-history": {
    name: "hypotrochoid-loop",
    color: "#A855F7",
    size: 86,
    particleCount: 66,
    particleMaxSize: 2,
    particleMinSize: 1,
    trailSpan: 0.8,
    duration: 2200,
  },
};

export default {
  name: "MathCurveLoader",
  components: { LoadingOverlay },

  props: {
    // ==================== 曲线配置 ====================

    /** 曲线名称，对应 curve-definitions.js 中的曲线定义 */
    name: {
      type: String,
      default: "",
    },

    /**
     * 页面级配置标识，对应 PAGE_LOADER_CONFIGS 中的 key。
     * 传入后自动读取该页面的预设参数（color, size, particleCount 等）。
     * 直接传入的 props 优先级更高，会覆盖 pageConfig 中的同名参数。
     */
    pageConfig: {
      type: String,
      default: "",
    },

    // ==================== 外观配置 ====================

    /** 容器尺寸，单位 rpx（750rpx = 屏幕宽度）。0 表示使用 pageConfig 或默认值 */
    size: {
      type: Number,
      default: 0,
    },

    /** 粒子颜色，十六进制色值。空字符串表示使用 pageConfig 或默认值 */
    color: {
      type: String,
      default: "",
    },

    /** 粒子数量。0 表示使用 pageConfig 或曲线默认值 */
    particleCount: {
      type: Number,
      default: 0,
    },

    /** 粒子最大尺寸（px），头部粒子的大小。0 表示使用 pageConfig 或默认值 */
    particleMaxSize: {
      type: Number,
      default: 0,
    },

    /** 粒子最小尺寸（px），尾部粒子的大小。0 表示使用 pageConfig 或默认值 */
    particleMinSize: {
      type: Number,
      default: 0,
    },

    /** 曲线轮廓点数量，0 表示使用默认值 20 */
    outlineCount: {
      type: Number,
      default: 0,
    },

    /** 轮廓点透明度（0~1） */
    outlineOpacity: {
      type: Number,
      default: 0.08,
    },

    /** 轮廓点尺寸（px） */
    outlineDotSize: {
      type: Number,
      default: 2,
    },

    // ==================== 动画配置 ====================

    /**
     * 拖尾长度（0~1），占动画周期的比例。
     * 值越大拖尾越长，粒子分布越稀疏；值越小拖尾越短，粒子越集中。
     */
    trailSpan: {
      type: Number,
      default: 0,
    },

    /**
     * 动画周期（毫秒），粒子沿曲线运动一圈的时长。
     * 值越小运动越快，值越大运动越慢。
     * 0 表示使用 pageConfig 或曲线默认值。
     */
    duration: {
      type: Number,
      default: 0,
    },

    /**
     * 旋转周期（毫秒），整体匀速旋转一圈的时长。
     * 0 表示使用曲线默认值，设为 Infinity 可禁用旋转。
     */
    rotationDuration: {
      type: Number,
      default: 0,
    },

    /**
     * 呼吸周期（毫秒），曲线脉动缩放一个周期的时长。
     * 0 表示使用曲线默认值，设为 Infinity 可禁用呼吸。
     */
    pulseDuration: {
      type: Number,
      default: 0,
    },

    /**
     * 曲线细节缩放（0~1），影响曲线的展开/收缩程度。
     * 值越大曲线细节越明显（花瓣越展开），值越小曲线越接近基础圆形。
     * 此值用于生成 CSS 关键帧中的静态路径，不同于 Canvas 版本的实时振荡。
     */
    detailScale: {
      type: Number,
      default: 0,
    },

    /**
     * 呼吸缩放最小值，呼吸动画从 scaleMin 缩放到 1.0 再回到 scaleMin。
     * 值越小呼吸幅度越大，1.0 表示无呼吸效果。
     */
    breatheScaleMin: {
      type: Number,
      default: 0.8,
    },

    /**
     * 粒子尾部透明度衰减系数（0~1）。
     * 值越大尾部越透明（拖尾越淡），值越小尾部越不透明（拖尾越实）。
     * 实际尾部粒子透明度 = 1 - t * tailFade，t 从 0（头部）到 1（尾部）。
     */
    tailFade: {
      type: Number,
      default: 0.9,
    },

    /**
     * 粒子尺寸衰减系数（0~1）。
     * 值越大尾部粒子越小，值越小尾部粒子越大。
     * 实际尾部粒子尺寸 = maxSize * (1 - t * sizeDecay)。
     */
    sizeDecay: {
      type: Number,
      default: 0.6,
    },

    // ==================== 行为配置 ====================

    /** 是否自动播放动画 */
    autoPlay: {
      type: Boolean,
      default: true,
    },

    /** 加载提示文字 */
    text: {
      type: String,
      default: "",
    },

    // ==================== 遮罩配置（仅 overlay=true 时生效） ====================

    /** 是否使用全屏遮罩模式 */
    overlay: {
      type: Boolean,
      default: true,
    },

    /** 遮罩层级 */
    overlayZIndex: {
      type: Number,
      default: 9999,
    },

    /** 遮罩背景色 */
    overlayBgColor: {
      type: String,
      default: "rgba(255, 255, 255, 0.85)",
    },

    /** 遮罩是否包含底部 TabBar 区域 */
    withTabBar: {
      type: Boolean,
      default: true,
    },

    /** 遮罩顶部偏移量 */
    topOffset: {
      type: String,
      default: "0px",
    },
  },

  data() {
    return {
      /** 组件唯一标识，用于 CSS keyframes 命名隔离 */
      uid: "",
      /** 动态注入的 style 元素引用 */
      styleEl: null,
      /** rpx 转换后的实际像素尺寸 */
      displaySizePx: 0,
      /** 曲线边界信息（用于自适应缩放） */
      curveBounds: null,
      /** 粒子样式数组 */
      particles: [],
      /** 轮廓点样式数组 */
      outlineDots: [],
      /** 是否正在播放 */
      playing: true,
    };
  },

  computed: {
    /** 解析后的页面配置对象 */
    resolvedPageConfig() {
      if (!this.pageConfig) return null;
      return PAGE_LOADER_CONFIGS[this.pageConfig] || null;
    },

    /** 当前曲线名称（props > pageConfig > 默认值） */
    currentCurveName() {
      return (
        this.name ||
        (this.resolvedPageConfig && this.resolvedPageConfig.name) ||
        "rose-three"
      );
    },

    /** 当前曲线定义对象 */
    currentCurve() {
      return curveMap[this.currentCurveName] || curveMap["rose-three"];
    },

    /** 解析后的粒子颜色 */
    resolvedColor() {
      return (
        this.color ||
        (this.resolvedPageConfig && this.resolvedPageConfig.color) ||
        "#14B8A6"
      );
    },

    /** 解析后的容器尺寸（rpx） */
    resolvedSize() {
      return (
        this.size ||
        (this.resolvedPageConfig && this.resolvedPageConfig.size) ||
        86
      );
    },

    /** 解析后的粒子数量 */
    displayParticleCount() {
      const fromProp = this.particleCount;
      const fromPage =
        this.resolvedPageConfig && this.resolvedPageConfig.particleCount;
      const fromCurve = this.currentCurve.particleCount;
      return fromProp || fromPage || fromCurve;
    },

    /** 解析后的拖尾长度 */
    effectiveTrailSpan() {
      return (
        this.trailSpan ||
        (this.resolvedPageConfig && this.resolvedPageConfig.trailSpan) ||
        this.currentCurve.trailSpan
      );
    },

    /** 解析后的动画周期（毫秒） */
    effectiveDuration() {
      return (
        this.duration ||
        (this.resolvedPageConfig && this.resolvedPageConfig.duration) ||
        this.currentCurve.durationMs
      );
    },

    /** 解析后的旋转周期（毫秒） */
    effectiveRotationDuration() {
      return (
        this.rotationDuration ||
        (this.resolvedPageConfig && this.resolvedPageConfig.rotationDuration) ||
        this.currentCurve.rotationDurationMs
      );
    },

    /** 解析后的呼吸周期（毫秒） */
    effectivePulseDuration() {
      return (
        this.pulseDuration ||
        (this.resolvedPageConfig && this.resolvedPageConfig.pulseDuration) ||
        this.currentCurve.pulseDurationMs
      );
    },

    /** 解析后的曲线细节缩放 */
    effectiveDetailScale() {
      return (
        this.detailScale ||
        (this.resolvedPageConfig && this.resolvedPageConfig.detailScale) ||
        0.75
      );
    },

    /** 解析后的粒子最大尺寸（px） */
    effectiveParticleMaxSize() {
      return (
        this.particleMaxSize ||
        (this.resolvedPageConfig && this.resolvedPageConfig.particleMaxSize) ||
        2
      );
    },

    /** 解析后的粒子最小尺寸（px） */
    effectiveParticleMinSize() {
      return (
        this.particleMinSize ||
        (this.resolvedPageConfig && this.resolvedPageConfig.particleMinSize) ||
        1
      );
    },

    /** 解析后的轮廓点数量 */
    effectiveOutlineCount() {
      return (
        this.outlineCount ||
        (this.resolvedPageConfig && this.resolvedPageConfig.outlineCount) ||
        20
      );
    },

    /** 容器样式 */
    containerStyle() {
      const s = this.displaySizePx;
      if (s > 0) {
        return { width: s + "px", height: s + "px" };
      }
      return {
        width: this.resolvedSize + "rpx",
        height: this.resolvedSize + "rpx",
      };
    },

    /** 旋转层样式 */
    rotationStyle() {
      const curve = this.currentCurve;
      if (!curve.rotate) return {};
      return {
        animationName: `${this.uid}-rotate`,
        animationDuration: this.effectiveRotationDuration / 1000 + "s",
        animationTimingFunction: "linear",
        animationIterationCount: "infinite",
      };
    },

    /** 呼吸层样式 */
    breathingStyle() {
      return {
        animationName: `${this.uid}-breathe`,
        animationDuration: this.effectivePulseDuration / 1000 + "s",
        animationTimingFunction: "ease-in-out",
        animationIterationCount: "infinite",
      };
    },

    /** 提示文字样式 */
    textStyle() {
      return { color: this.resolvedColor };
    },
  },

  watch: {
    currentCurveName(newVal, oldVal) {
      const t0 = performance.now();
      console.log(
        LOG,
        "watch | currentCurveName 变化: " +
          oldVal +
          " → " +
          newVal +
          " | 触发 rebuild",
      );
      this.rebuild();
      const elapsed = (performance.now() - t0).toFixed(2);
      console.log(
        LOG,
        "watch | currentCurveName rebuild 完成 | 耗时=" + elapsed + "ms",
      );
    },
    resolvedColor(newVal, oldVal) {
      const t0 = performance.now();
      console.log(
        LOG,
        "watch | resolvedColor 变化: " +
          oldVal +
          " → " +
          newVal +
          " | 重新生成粒子和轮廓",
      );
      this.generateParticles();
      this.generateOutlineDots();
      const elapsed = (performance.now() - t0).toFixed(2);
      console.log(
        LOG,
        "watch | resolvedColor 重新生成完成 | particles=" +
          this.particles.length +
          " outlines=" +
          this.outlineDots.length +
          " 耗时=" +
          elapsed +
          "ms",
      );
    },
  },

  mounted() {
    const t0 = performance.now();
    this.uid = "mcl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
    this.playing = this.autoPlay;
    console.log(
      LOG,
      "mounted 开始 | uid=" +
        this.uid +
        " pageConfig=" +
        (this.pageConfig || "none") +
        " autoPlay=" +
        this.autoPlay,
    );

    // 配置优先级解析日志：标注每个最终值的来源（props / pageConfig / 曲线默认值）
    this.logResolvedConfig();

    this.initSize();
    console.log(
      LOG,
      "initSize 完成 | resolvedSize=" +
        this.resolvedSize +
        "rpx → displaySizePx=" +
        this.displaySizePx +
        "px",
    );

    this.computeCurveBounds();
    console.log(
      LOG,
      "computeCurveBounds 完成 | curve=" +
        this.currentCurveName +
        " bounds=" +
        JSON.stringify(this.curveBounds),
    );

    this.generateParticles();
    console.log(
      LOG,
      "generateParticles 完成 |",
      "count=" + this.particles.length,
      "duration=" + this.effectiveDuration + "ms",
      "trailSpan=" + this.effectiveTrailSpan,
      "maxSize=" + this.effectiveParticleMaxSize + "px",
      "minSize=" + this.effectiveParticleMinSize + "px",
    );

    this.generateOutlineDots();
    console.log(
      LOG,
      "generateOutlineDots 完成 | count=" +
        this.outlineDots.length +
        " outlineOpacity=" +
        this.outlineOpacity,
    );

    this.injectKeyframes();
    const elapsed = (performance.now() - t0).toFixed(1);
    console.log(
      LOG,
      "mounted 完成 |",
      "uid=" + this.uid,
      "name=" + this.currentCurveName,
      "color=" + this.resolvedColor,
      "size=" + this.resolvedSize + "rpx(" + this.displaySizePx + "px)",
      "particles=" + this.particles.length,
      "outlines=" + this.outlineDots.length,
      "detailScale=" + this.effectiveDetailScale,
      "rotate=" + this.currentCurve.rotate,
      "rotationDuration=" + this.effectiveRotationDuration + "ms",
      "pulseDuration=" + this.effectivePulseDuration + "ms",
      "耗时=" + elapsed + "ms",
    );
  },

  beforeUnmount() {
    console.log(LOG, `beforeUnmount | uid=${this.uid} 清理 CSS keyframes`);
    this.removeKeyframes();
  },

  methods: {
    /**
     * 打印配置优先级解析结果，标注每个值的来源
     * 来源标注：props = 直接传入的 prop 值
     *          pageConfig = 页面预设配置
     *          default = 曲线默认值 / 组件默认值
     */
    logResolvedConfig() {
      const pc = this.resolvedPageConfig;
      const src = (propVal, configKey, defaultVal) => {
        if (propVal) return "props";
        if (pc && pc[configKey] !== undefined) return "pageConfig";
        return "default";
      };

      const lines = [
        "配置解析结果 (props > pageConfig > default):",
        "  name=" +
          this.currentCurveName +
          " ← " +
          src(this.name, "name", "rose-three"),
        "  color=" +
          this.resolvedColor +
          " ← " +
          src(this.color, "color", "#14B8A6"),
        "  size=" + this.resolvedSize + "rpx ← " + src(this.size, "size", 86),
        "  particleCount=" +
          this.displayParticleCount +
          " ← " +
          src(this.particleCount, "particleCount", 0),
        "  particleMaxSize=" +
          this.effectiveParticleMaxSize +
          "px ← " +
          src(this.particleMaxSize, "particleMaxSize", 2),
        "  particleMinSize=" +
          this.effectiveParticleMinSize +
          "px ← " +
          src(this.particleMinSize, "particleMinSize", 1),
        "  trailSpan=" +
          this.effectiveTrailSpan +
          " ← " +
          src(this.trailSpan, "trailSpan", 0),
        "  duration=" +
          this.effectiveDuration +
          "ms ← " +
          src(this.duration, "duration", 0),
        "  rotationDuration=" +
          this.effectiveRotationDuration +
          "ms ← " +
          src(this.rotationDuration, "rotationDuration", 0),
        "  pulseDuration=" +
          this.effectivePulseDuration +
          "ms ← " +
          src(this.pulseDuration, "pulseDuration", 0),
        "  detailScale=" +
          this.effectiveDetailScale +
          " ← " +
          src(this.detailScale, "detailScale", 0.75),
        "  outlineCount=" +
          this.effectiveOutlineCount +
          " ← " +
          src(this.outlineCount, "outlineCount", 20),
      ];

      if (pc) {
        lines.push(
          "  pageConfig=" + this.pageConfig + " → " + JSON.stringify(pc),
        );
      } else {
        lines.push("  pageConfig=none");
      }

      console.log(LOG, lines.join("\n"));
    },

    /**
     * 初始化尺寸：将 rpx 转换为实际像素
     * 750rpx = 屏幕宽度，所以 px = (rpx / 750) * windowWidth
     */
    initSize() {
      try {
        const sysInfo = uni.getSystemInfoSync();
        this.displaySizePx = (this.resolvedSize / 750) * sysInfo.windowWidth;
        console.log(
          LOG,
          "initSize |",
          "rpx=" + this.resolvedSize,
          "windowWidth=" + sysInfo.windowWidth + "px",
          "platform=" + sysInfo.platform,
          "DPR=" + sysInfo.pixelRatio,
          "→ displaySizePx=" + this.displaySizePx.toFixed(2) + "px",
        );
        if (this.displaySizePx <= 0 || !isFinite(this.displaySizePx)) {
          console.warn(
            LOG,
            `initSize | displaySizePx 异常(${this.displaySizePx})，回退为 100px`,
          );
          this.displaySizePx = 100;
        }
      } catch (e) {
        console.warn(LOG, `initSize | uni.getSystemInfoSync 失败:`, e.message);
        this.displaySizePx = this.resolvedSize;
      }
    },

    /**
     * 计算曲线边界：遍历曲线上的点，找到 x/y 的极值，
     * 然后计算 fitScale 使曲线自适应容器大小（留 10% 边距）
     */
    computeCurveBounds() {
      const curve = this.currentCurve;
      if (!curve) {
        console.warn(
          LOG,
          `computeCurveBounds | 曲线未找到: ${this.currentCurveName}`,
        );
        return;
      }

      const t0 = performance.now();
      let minX = Infinity,
        maxX = -Infinity;
      let minY = Infinity,
        maxY = -Infinity;
      const steps = 200;
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const pt = curve.point(progress, 1.0, curve.config);
        if (pt.x < minX) minX = pt.x;
        if (pt.x > maxX) maxX = pt.x;
        if (pt.y < minY) minY = pt.y;
        if (pt.y > maxY) maxY = pt.y;
      }

      const rangeX = maxX - minX;
      const rangeY = maxY - minY;
      const maxRange = Math.max(rangeX, rangeY);
      const fitScale = maxRange > 0 ? (100 * 0.9) / maxRange : 1;

      this.curveBounds = {
        minX,
        maxX,
        minY,
        maxY,
        rangeX,
        rangeY,
        maxRange,
        fitScale,
        centerX: (minX + maxX) / 2,
        centerY: (minY + maxY) / 2,
      };

      const elapsed = (performance.now() - t0).toFixed(2);
      console.log(
        LOG,
        "computeCurveBounds |",
        "curve=" + curve.name,
        "bounds=[" +
          minX.toFixed(1) +
          "," +
          minY.toFixed(1) +
          "]-[" +
          maxX.toFixed(1) +
          "," +
          maxY.toFixed(1) +
          "]",
        "range=" + maxRange.toFixed(1),
        "fitScale=" + fitScale.toFixed(3),
        "center=[" +
          this.curveBounds.centerX.toFixed(1) +
          "," +
          this.curveBounds.centerY.toFixed(1) +
          "]",
        "耗时=" + elapsed + "ms",
      );
    },

    /**
     * 将曲线坐标（0~100 的逻辑坐标系）转换为容器内的像素坐标
     * @param {number} progress - 曲线进度（0~1）
     * @param {number} detailScale - 曲线细节缩放
     * @returns {{ x: number, y: number }} 像素坐标
     */
    curveToPixel(progress, detailScale) {
      const curve = this.currentCurve;
      const s = this.displaySizePx;
      const bounds = this.curveBounds;
      const fitScale = bounds ? bounds.fitScale : 1;
      const scale = s / 100;
      const offsetX = bounds ? 50 - bounds.centerX * fitScale : 0;
      const offsetY = bounds ? 50 - bounds.centerY * fitScale : 0;
      const pt = curve.point(progress, detailScale, curve.config);
      return {
        x: (pt.x * fitScale + offsetX) * scale,
        y: (pt.y * fitScale + offsetY) * scale,
      };
    },

    /**
     * 生成粒子样式数组
     * 每个粒子沿曲线运动，通过 animation-delay 错开形成拖尾效果。
     * 头部粒子最大最亮，尾部粒子最小最淡。
     */
    generateParticles() {
      const t0 = performance.now();
      const count = this.displayParticleCount;
      const durationSec = this.effectiveDuration / 1000;
      const trailSec = this.effectiveTrailSpan * durationSec;
      const color = this.resolvedColor;
      const maxSize = this.effectiveParticleMaxSize;
      const minSize = this.effectiveParticleMinSize;
      const fade = this.tailFade;
      const decay = this.sizeDecay;

      this.particles = Array.from({ length: count }, (_, i) => {
        const t = i / count;
        // 透明度：头部 1.0，尾部 1 - fade
        const opacity = 1 - t * fade;
        // 尺寸：头部 maxSize，尾部 maxSize * (1 - decay)，但不小于 minSize
        const dotSize = Math.max(minSize, maxSize * (1 - t * decay));
        // 延迟：头部无延迟，尾部延迟最大，形成拖尾
        const delay = -(trailSec * (1 - t));

        return {
          style: {
            width: dotSize + "px",
            height: dotSize + "px",
            backgroundColor: color,
            opacity: opacity,
            animationName: `${this.uid}-path`,
            animationDuration: durationSec + "s",
            animationTimingFunction: "linear",
            animationIterationCount: "infinite",
            animationDelay: delay + "s",
          },
        };
      });

      const elapsed = (performance.now() - t0).toFixed(2);
      console.log(
        LOG,
        "generateParticles |",
        "count=" + count,
        "color=" + color,
        "size=" + maxSize + "~" + minSize + "px",
        "opacity=1.0~" + (1 - fade).toFixed(2),
        "trailSec=" + trailSec.toFixed(2) + "s",
        "耗时=" + elapsed + "ms",
      );
    },

    /**
     * 生成曲线轮廓点样式数组
     * 轮廓点是静态的淡色小点，均匀分布在曲线上，勾勒出曲线的大致形状。
     */
    generateOutlineDots() {
      const t0 = performance.now();
      const color = this.resolvedColor;
      const count = this.effectiveOutlineCount;
      const ds = this.effectiveDetailScale;
      const dotSize = this.outlineDotSize;
      const opacity = this.outlineOpacity;

      this.outlineDots = Array.from({ length: count }, (_, i) => {
        const progress = i / count;
        const pos = this.curveToPixel(progress, ds);
        return {
          style: {
            left: pos.x + "px",
            top: pos.y + "px",
            width: dotSize + "px",
            height: dotSize + "px",
            backgroundColor: color,
            opacity: opacity,
          },
        };
      });

      const elapsed = (performance.now() - t0).toFixed(2);
      console.log(
        LOG,
        `generateOutlineDots | count=${count} dotSize=${dotSize}px opacity=${opacity} detailScale=${ds} 耗时=${elapsed}ms`,
      );
    },

    /**
     * 生成 CSS @keyframes 动画定义
     * 包含三组关键帧：
     * 1. path - 粒子沿曲线路径的位移
     * 2. rotate - 整体匀速旋转
     * 3. breathe - 曲线脉动缩放
     */
    generateKeyframesCSS() {
      const t0 = performance.now();
      const curve = this.currentCurve;
      const ds = this.effectiveDetailScale;
      const scaleMin = this.breatheScaleMin;
      // 120 步关键帧，接近 Canvas 60fps 的平滑度
      const steps = 120;
      let css = "";

      // 曲线路径关键帧
      css += "@keyframes " + this.uid + "-path {" + "\n";
      for (let i = 0; i <= steps; i++) {
        const progress = i / steps;
        const percent =
          i === steps ? 100 : parseFloat((progress * 100).toFixed(2));
        const pos = this.curveToPixel(progress, ds);
        css +=
          "  " +
          percent +
          "% { transform: translate3d(" +
          pos.x.toFixed(2) +
          "px, " +
          pos.y.toFixed(2) +
          "px, 0); }" +
          "\n";
      }
      css += "}" + "\n";

      // 旋转关键帧
      if (curve.rotate) {
        css += "@keyframes " + this.uid + "-rotate {" + "\n";
        css += "  from { transform: rotate(0deg); }" + "\n";
        css += "  to { transform: rotate(360deg); }" + "\n";
        css += "}" + "\n";
      }

      // 呼吸关键帧
      css += "@keyframes " + this.uid + "-breathe {" + "\n";
      css += "  0% { transform: scale(" + scaleMin + "); }" + "\n";
      css += "  50% { transform: scale(1.0); }" + "\n";
      css += "  100% { transform: scale(" + scaleMin + "); }" + "\n";
      css += "}" + "\n";

      const elapsed = (performance.now() - t0).toFixed(2);
      const cssSize = (new Blob([css]).size / 1024).toFixed(1);
      console.log(
        LOG,
        "generateKeyframesCSS | steps=" +
          steps +
          " rotate=" +
          curve.rotate +
          " breatheScale=" +
          scaleMin +
          " cssSize=" +
          cssSize +
          "KB 耗时=" +
          elapsed +
          "ms",
      );

      return css;
    },

    /**
     * 将 CSS 关键帧动态注入到 document.head
     * 使用 data-mcl 属性标记，组件卸载时清理
     */
    injectKeyframes() {
      if (typeof document === "undefined") {
        console.warn(
          LOG,
          "injectKeyframes | document 不可用，无法注入 CSS keyframes | uid=" +
            this.uid,
        );
        return;
      }
      const t0 = performance.now();
      const css = this.generateKeyframesCSS();
      const styleEl = document.createElement("style");
      styleEl.setAttribute("data-mcl", this.uid);
      styleEl.textContent = css;
      document.head.appendChild(styleEl);
      this.styleEl = styleEl;
      const elapsed = (performance.now() - t0).toFixed(2);
      const cssSize = (new Blob([css]).size / 1024).toFixed(1);
      console.log(
        LOG,
        "injectKeyframes | 注入成功 | uid=" +
          this.uid +
          " cssSize=" +
          cssSize +
          "KB 耗时=" +
          elapsed +
          "ms",
      );
    },

    /** 移除动态注入的 CSS 关键帧 */
    removeKeyframes() {
      if (this.styleEl && this.styleEl.parentNode) {
        this.styleEl.parentNode.removeChild(this.styleEl);
        this.styleEl = null;
        console.log(LOG, "removeKeyframes | 清理成功 | uid=" + this.uid);
      }
    },

    /** 重建动画（曲线名称变化时调用） */
    rebuild() {
      const t0 = performance.now();
      console.log(
        LOG,
        "rebuild 开始 | 旧uid=" +
          this.uid +
          " newCurve=" +
          this.currentCurveName,
      );
      this.removeKeyframes();
      this.uid =
        "mcl_" + Date.now() + "_" + Math.random().toString(36).substring(2, 8);
      this.computeCurveBounds();
      this.generateParticles();
      this.generateOutlineDots();
      this.injectKeyframes();
      const elapsed = (performance.now() - t0).toFixed(1);
      console.log(
        LOG,
        "rebuild 完成 | 新uid=" +
          this.uid +
          " curve=" +
          this.currentCurveName +
          " particles=" +
          this.particles.length +
          " outlines=" +
          this.outlineDots.length +
          " 耗时=" +
          elapsed +
          "ms",
      );
    },

    /** 恢复动画播放 */
    play() {
      this.playing = true;
      console.log(LOG, "play | 恢复播放 | uid=" + this.uid);
    },

    /** 暂停动画 */
    pause() {
      this.playing = false;
      console.log(LOG, "pause | 暂停播放 | uid=" + this.uid);
    },
  },
};
</script>

<style scoped>
.math-curve-loader-root {
  width: 100%;
}

.loader-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.loader-inline-wrap {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400rpx;
  width: 100%;
}

/* 曲线动画容器 */
.curve-container {
  position: relative;
  overflow: hidden;
  flex-shrink: 0;
}

/* 动画层：绝对定位覆盖父容器，用于承载旋转/呼吸变换 */
.animation-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

/* 曲线轮廓点 */
.outline-dot {
  position: absolute;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

/* 运动粒子 */
.particle {
  position: absolute;
  top: 0;
  left: 0;
  border-radius: 50%;
  will-change: transform;
}

/* 暂停状态：冻结所有动画 */
.curve-container.is-paused,
.curve-container.is-paused * {
  animation-play-state: paused !important;
}

/* 加载提示文字 */
.loader-text {
  margin-top: 16rpx;
  font-size: 24rpx;
  letter-spacing: 0.08em;
  opacity: 0.7;
  text-align: center;
}
</style>
