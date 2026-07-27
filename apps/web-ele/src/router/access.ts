import type {
  ComponentRecordType,
  GenerateMenuAndRoutesOptions,
} from '@vben/types';

import { generateAccessible } from '@vben/access';
import { preferences } from '@vben/preferences';

import { BasicLayout, IFrameView } from '#/layouts';

const forbiddenComponent = () => import('#/views/_core/fallback/forbidden.vue');

async function generateAccess(options: GenerateMenuAndRoutesOptions) {
  console.warn('[DEBUG] generateAccess 调用:', {
    accessMode: preferences.app.accessMode,
    roles: options.roles,
    routeCount: options.routes.length,
  });

  const pageMap: ComponentRecordType = import.meta.glob('../views/**/*.vue');
  console.warn('[DEBUG] 页面组件数量:', Object.keys(pageMap).length);

  const layoutMap: ComponentRecordType = {
    BasicLayout,
    IFrameView,
  };

  const result = await generateAccessible(preferences.app.accessMode, {
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
