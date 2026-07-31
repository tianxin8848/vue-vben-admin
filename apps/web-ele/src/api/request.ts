/**
 * 该文件可自行根据业务逻辑进行调整
 */
import type { RequestClientOptions } from '@vben/request';

import { useAppConfig } from '@vben/hooks';
import { preferences } from '@vben/preferences';
import { errorMessageResponseInterceptor, RequestClient } from '@vben/request';
import { useAccessStore } from '@vben/stores';

import { ElMessage } from 'element-plus';

import { useAuthStore } from '#/store';

const { apiURL } = useAppConfig(import.meta.env, import.meta.env.PROD);

function createRequestClient(baseURL: string, options?: RequestClientOptions) {
  const client = new RequestClient({
    ...options,
    baseURL,
    withCredentials: true,
  });

  async function doReAuthenticate() {
    console.warn('Session expired, redirecting to login.');
    const accessStore = useAccessStore();
    const authStore = useAuthStore();
    accessStore.setAccessToken(null);
    await authStore.logout();
  }

  client.addRequestInterceptor({
    fulfilled: async (config) => {
      config.headers['Accept-Language'] = preferences.app.locale;
      return config;
    },
  });

  client.addResponseInterceptor({
    fulfilled: (response) => {
      // #region debug-point response-interceptor
      const url = response.config?.url || '';
      const rawData = response.data;
      const hasDataWrapper = !!(rawData && rawData.data !== undefined);
      console.warn('[DEBUG][request]', {
        url,
        status: response.status,
        hasDataWrapper,
        topLevelKeys: rawData ? Object.keys(rawData).slice(0, 10) : null,
        hasModulePermissions: !!(rawData && rawData.module_permissions),
        modulePermissionsLength: rawData?.module_permissions?.length ?? 0,
      });
      // #endregion
      if (rawData && rawData.data !== undefined) {
        return rawData.data;
      }
      return rawData;
    },
    rejected: (error) => {
      const config = error?.config;
      if (error?.response?.status === 401 && config?.url !== '/auth/login') {
        doReAuthenticate();
      }
      throw error;
    },
  });

  client.addResponseInterceptor(
    errorMessageResponseInterceptor((msg: string, error) => {
      const responseData = error?.response?.data ?? {};
      // 优先使用 error / message 字段
      let errorMessage = responseData?.error ?? responseData?.message ?? '';
      // FastAPI 验证错误返回 detail 字段（数组或字符串）
      if (!errorMessage && responseData?.detail) {
        if (Array.isArray(responseData.detail)) {
          errorMessage = responseData.detail
            .map((e: any) => e.msg || e.message || '')
            .filter(Boolean)
            .join('；');
        } else if (typeof responseData.detail === 'string') {
          errorMessage = responseData.detail;
        }
      }
      ElMessage.error(errorMessage || msg);
    }),
  );

  return client;
}

export const requestClient = createRequestClient(apiURL, {
  responseReturn: 'body',
});

export const baseRequestClient = new RequestClient({
  baseURL: apiURL,
  withCredentials: true,
});
