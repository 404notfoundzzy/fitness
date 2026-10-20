export function useSwipeBack() {
  let startX = 0
  let startY = 0
  let isSwiping = false

  const onTouchStart = (e) => {
    startX = e.touches[0].clientX
    startY = e.touches[0].clientY
    isSwiping = true
  }

  const onTouchMove = (e) => {
    if (!isSwiping) return

    const deltaX = e.touches[0].clientX - startX
    const deltaY = e.touches[0].clientY - startY

    // 只响应右滑（正 X 方向），且水平滑动幅度大于垂直
    if (deltaX > 60 && Math.abs(deltaX) > Math.abs(deltaY)) {
      isSwiping = false
      uni.navigateBack({
        fail: () => {}
      })
    }
  }

  const onTouchEnd = () => {
    isSwiping = false
  }

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd
  }
}