import {
	getToken,
	logout
} from './auth';

// ==================== 环境配置 ====================
// 根据不同环境自动切换 API 地址
const ENV_CONFIG = {
	// 开发环境 (H5 本地调试)
	development: 'http://localhost:8888/api',

	// 真机调试环境 (同一局域网下，替换为你的电脑 IP)
	// 获取方式: 打开 cmd，输入 ipconfig，找到 IPv4 地址
	debug: 'http://192.168.1.100:8888/api',

	// 生产环境 / 内网穿透 (natapp/ngrok 等)
	// production: 'https://optimum-settled-vulture.ngrok-free.app/api'
	// production: 'http://xdcba4c6.natappfree.cc/api',
	// production: 'http://5f655411.r3.cpolar.top/api',
	production: 'https://zzy404notfound.site/api',
};

// 当前使用的环境 (修改此处切换环境)
// 可选值: 'development' | 'debug' | 'production'
const CURRENT_ENV = 'production';

const BASE_URL = ENV_CONFIG[CURRENT_ENV] || ENV_CONFIG.development;

const SERVER_BASE_URL = BASE_URL.replace(/\/api$/, '');

export const API_BASE_URL = BASE_URL;
export const FILE_BASE_URL = SERVER_BASE_URL;
export const CURRENT_ENV_NAME = CURRENT_ENV;

export const buildFileUrl = (path) => {
	if (!path) {
		return '';
	}
	if (/^https?:\/\//.test(path)) {
		return path;
	}
	return `${FILE_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
};

// ==================== 请求配置 ====================
const REQUEST_TIMEOUT = 60000; // 请求超时时间 (毫秒) - 聚合接口需要更长时间
const MAX_RETRY_COUNT = 2; // 最大重试次数
const RETRY_DELAY = 1000; // 重试延迟 (毫秒)

let isShowingNetworkError = false; // 防止重复显示网络错误提示

const request = (options, retryCount = 0) => {
	return new Promise((resolve, reject) => {
		const header = options.header || {};
		const token = getToken();
		if (token) {
			header['Authorization'] = `Bearer ${token}`;
		}

		header['Content-Type'] = header['Content-Type'] || 'application/json';

		uni.request({
			url: BASE_URL + options.url,
			method: options.method || 'GET',
			data: options.data || {},
			header: header,
			timeout: options.timeout || REQUEST_TIMEOUT,
			success: (res) => {
				const {
					statusCode,
					data
				} = res;

				if (statusCode >= 200 && statusCode < 300) {
					if (data && typeof data.code !== 'undefined') {
						if (data.code === 200) {
							resolve(data.data);
						} else if (data.code === 401) {
							handleAuthError(data);
							reject(data);
						} else {
							showErrorToast(data.message || '操作失败');
							reject(data);
						}
					} else {
						resolve(data);
					}
				} else if (statusCode === 401) {
					handleAuthError({
						message: '登录已过期，请重新登录'
					});
					reject(res);
				} else if (statusCode >= 500) {
					showErrorToast('服务器繁忙，请稍后再试~');
					reject(res);
				} else {
					showErrorToast(data?.message || '请求失败');
					reject(res);
				}
			},
			fail: (err) => {
				console.error(`[API Error] ${options.method || 'GET'} ${options.url}`, err);

				const errorMsg = analyzeError(err);

				if (retryCount < MAX_RETRY_COUNT && shouldRetry(err)) {
					console.log(`[Retry] 第 ${retryCount + 1} 次重试 ${options.url}`);
					setTimeout(() => {
						request(options, retryCount + 1).then(resolve).catch(reject);
					}, RETRY_DELAY * (retryCount + 1));
					return;
				}

				showErrorToast(errorMsg, true);
				reject(err);
			}
		});
	});
};

function handleAuthError(data) {
	uni.$emit('globalModal', {
		type: 'error',
		title: '登录已过期',
		desc: data.message || '登录已过期，请重新登录',
		btnText: '重新登录',
		autoClose: 0,
		onConfirm: () => {
			logout();
		}
	});
}

function showErrorToast(msg, isNetworkError = false) {
	if (isNetworkError && isShowingNetworkError) return;

	if (isNetworkError) {
		isShowingNetworkError = true;
	}

	uni.$emit('globalModal', {
		type: isNetworkError ? 'warning' : 'error',
		title: isNetworkError ? '网络异常' : '操作失败',
		desc: msg,
		autoClose: 2500,
	});

	if (isNetworkError) {
		setTimeout(() => {
			isShowingNetworkError = false;
		}, 3200);
	}
}

function analyzeError(err) {
	if (!err.errMsg) return '网络异常，请检查网络连接';

	if (err.errMsg.includes('timeout')) {
		return '请求超时，网络较慢，请稍后重试';
	}

	if (err.errMsg.includes('fail:connect') || err.errMsg.includes('fail:net')) {
		return `无法连接服务器 (${CURRENT_ENV})\n请确认:\n1. 后端服务是否启动\n2. 内网穿透是否正常\n3. 网络连接是否畅通`;
	}

	if (err.errMsg.includes('fail:request')) {
		return '请求发送失败，请检查网络';
	}

	return `网络错误 (${err.errMsg.slice(-30)})`;
}

function shouldRetry(err) {
	if (!err.errMsg) return false;
	return (
		err.errMsg.includes('timeout') ||
		err.errMsg.includes('fail:connect') ||
		err.errMsg.includes('fail:net')
	);
}

export default request;