/**
 * 导航栏与滚动区域布局工具
 * 统一处理 H5 / App / 小程序 的状态栏高度、scrollHeight 计算等差异
 */

/**
 * 获取状态栏高度（兼容各平台）
 * - H5: uni.getSystemInfoSync().statusBarHeight 可能为 0，回退 59px
 * - App: statusBarHeight 可能为 0，回退 safeArea.top 或 47px
 * - 小程序: 通常正常返回
 * @returns {number} 状态栏高度(px)
 */
export function getStatusBarHeight() {
  const sysInfo = uni.getSystemInfoSync();
  let height = sysInfo.statusBarHeight || 0;

  // #ifdef H5
  if (height === 0) {
    height = 59;
  }
  // #endif

  // #ifdef APP-PLUS
  if (height === 0) {
    height = sysInfo.safeArea ? sysInfo.safeArea.top : 47;
  }
  // #endif

  console.log('[NavLayout] getStatusBarHeight:', JSON.stringify({
    raw: sysInfo.statusBarHeight,
    result: height,
    platform: sysInfo.platform,
    safeAreaTop: sysInfo.safeArea?.top,
    windowHeight: sysInfo.windowHeight,
    screenHeight: sysInfo.screenHeight,
  }));

  return height;
}

/**
 * 计算 scroll-view 可用高度
 * 通过 boundingClientRect 获取 NavHeader 实际渲染高度，精确计算剩余空间
 * @param {VueComponent} context - 页面组件实例 (this)
 * @param {string} [navSelector='.nav-header'] - NavHeader 的 CSS 选择器
 * @returns {Promise<number>} scroll-view 高度(px)
 */
export function calcScrollHeight(context, navSelector = '.nav-header') {
  return new Promise((resolve) => {
    const sysInfo = uni.getSystemInfoSync();

    context.$nextTick(() => {
      const query = uni.createSelectorQuery().in(context);
      query.select(navSelector).boundingClientRect();
      query.exec((res) => {
        const navHeight = res[0] ? res[0].height : null;
        const fallbackNavHeight = getStatusBarHeight() + 44;
        const finalNavHeight = navHeight || fallbackNavHeight;
        const scrollHeight = sysInfo.windowHeight - finalNavHeight;

        console.log('[NavLayout] calcScrollHeight:', JSON.stringify({
          platform: sysInfo.platform,
          model: sysInfo.model,
          windowHeight: sysInfo.windowHeight,
          screenHeight: sysInfo.screenHeight,
          statusBarHeight: sysInfo.statusBarHeight,
          safeAreaTop: sysInfo.safeArea?.top,
          navSelector,
          navHeightMeasured: navHeight,
          navHeightFallback: fallbackNavHeight,
          navHeightUsed: finalNavHeight,
          scrollHeight,
          navHeaderFound: !!res[0],
          pixelRatio: sysInfo.pixelRatio,
          windowWidth: sysInfo.windowWidth,
        }));

        resolve(scrollHeight);
      });
    });
  });
}

/**
 * 获取页面滚动禁用配置（用于 scroll-view 属性绑定）
 * - App: 启用 enhanced + 禁用 bounces
 * - H5/小程序: 这些属性无效，靠 CSS overscroll-behavior 禁用弹性滚动
 * @returns {Object} scroll-view 属性对象
 */
export function getScrollDisableBounceProps() {
  const props = {
    enhanced: true,
    bounces: false,
    showScrollbar: false,
  };

  console.log('[NavLayout] getScrollDisableBounceProps:', JSON.stringify({
    platform: uni.getSystemInfoSync().platform,
    props,
    note: 'App端: enhanced+bounces生效; H5端: 需配合CSS overscroll-behavior:none',
  }));

  return props;
}
