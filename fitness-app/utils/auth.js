const PENDING_LOGIN_KEY = "pendingLoginForm";

/**
 * 校验登录状态
 */
export const checkLogin = () => {
	const token = uni.getStorageSync('token');
	if (!token) {
		uni.reLaunch({
			url: '/pages/login/login'
		});
		return false;
	}
	return true;
};

/**
 * 设置登录信息
 */
export const setLoginInfo = (token, userInfo) => {
	uni.setStorageSync('token', token);
	uni.setStorageSync('userInfo', userInfo);
	uni.setStorageSync('userId', userInfo.id); // 保留 userId 兼容旧代码
};

/**
 * 退出登录
 */
export const logout = () => {
	uni.removeStorageSync('token');
	uni.removeStorageSync('userInfo');
	uni.removeStorageSync('userId');
	uni.reLaunch({
		url: '/pages/login/login'
	});
};

/**
 * 获取 Token
 */
export const getToken = () => {
	return uni.getStorageSync('token');
};

/**
 * 获取用户信息
 */
export const getUserInfo = () => {
	return uni.getStorageSync('userInfo');
};

/**
 * 暂存登录页待回填的账号密码
 */
export const setPendingLoginForm = (form) => {
	uni.setStorageSync(PENDING_LOGIN_KEY, form || {});
};

/**
 * 读取并清空登录页待回填的账号密码
 */
export const consumePendingLoginForm = () => {
	const form = uni.getStorageSync(PENDING_LOGIN_KEY);
	if (form) {
		uni.removeStorageSync(PENDING_LOGIN_KEY);
	}
	return form || null;
};
