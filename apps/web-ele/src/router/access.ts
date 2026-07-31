import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { BasicLayout, IFrameView } from '#/layouts';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  const hasFetchMenuListAsync = !!options.fetchMenuListAsync;
  // 当提供了 fetchMenuListAsync 时，强制使用 backend 模式
  // 这确保即使 preferences 尚未完全加载，也能正确生成动态路由
  const accessMode = hasFetchMenuListAsync
    ? 'backend'
    : preferences.app.accessMode;

  console.warn('[DEBUG] generateAccess 调用:', {
    accessMode,
    preferencesAccessMode: preferences.app.accessMode,
    hasFetchMenuListAsync,
    roles: options.roles,
    routeCount: options.routes.length,
  });

  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  console.warn('[DEBUG] 页面组件数量:', Object.keys(pageMap).length);

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  const result = await generateAccessible(accessMode, {
    ...options,
    forbiddenComponent,
    layoutMap,
    pageMap,
  });

  console.warn('[DEBUG] generateAccess 结果:', {
    accessibleRoutesCount: result.accessibleRoutes.length,
    accessibleMenusCount: result.accessibleMenus.length,
  });

  return result;
}

export { generateAccess };
