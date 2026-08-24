import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';
import { buildRoutesFromPermissions } from './module-permission-map';

// ===== 工具函数：递归打印路由树 =====
function dumpRouteTree(routes: any[], label: string) {
  const result: any[] = [];
  function walk(list: any[], _depth: number, parentPath: string) {
    for (const r of list) {
      const fullPath = parentPath + (r.path || '');
      const entry: any = {
        path: fullPath || '/',
        name: r.name || '(anonymous)',
      };
      if (r.meta?.title) entry.title = r.meta.title;
      if (r.meta?.authority) entry.authority = r.meta.authority;
      if (r.meta?.hideInMenu) entry.hideInMenu = true;
      if (r.redirect) entry.redirect = parentPath + r.redirect;
      result.push(entry);
      if (r.children?.length) {
        walk(
          r.children,
          _depth + 1,
          r.path.endsWith('/') ? r.path : `${r.path}/`,
        );
      }
    }
  }
  walk(routes, 0, '');
  console.warn(`\n=== [ROUTE DUMP] ${label} (total: ${result.length}) ===`);
  result.forEach((r) => {
    console.warn(
      `  Route: ${r.path} | name: ${r.name} | title: ${r.title || '-'} | authority: ${r.authority ? JSON.stringify(r.authority) : '-'} | hideInMenu: ${r.hideInMenu || '-'} | redirect: ${r.redirect || '-'}`,
    );
  });
  return result;
}

/**
 * 通用守卫配置
 * @param router
 */
function setupCommonGuard(router: Router) {
  // 记录已经加载的页面
  const loadedPaths = new Set<string>();

  router.beforeEach((to) => {
    to.meta.loaded = loadedPaths.has(to.path);

    // 页面加载进度条
    if (!to.meta.loaded && preferences.transition.progress) {
      startProgress();
    }
    return true;
  });

  router.afterEach((to) => {
    // 记录页面是否加载,如果已经加载，后续的页面切换动画等效果不在重复执行

    loadedPaths.add(to.path);

    // 关闭页面加载进度条
    if (preferences.transition.progress) {
      stopProgress();
    }
  });
}

/**
 * 权限访问守卫配置
 * @param router
 */
function setupAccessGuard(router: Router) {
  router.beforeEach(async (to, from) => {
    const accessStore = useAccessStore();
    const userStore = useUserStore();
    const authStore = useAuthStore();

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      if (
        !import.meta.env.VITE_TEST_LOGIN_ACCESS &&
        to.path === LOGIN_PATH &&
        accessStore.accessToken
      ) {
        return decodeURIComponent(
          (to.query?.redirect as string) ||
            userStore.userInfo?.homePath ||
            preferences.app.defaultHomePath,
        );
      }
      return true;
    }

    // accessToken 检查
    if (!accessStore.accessToken) {
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          query:
            to.fullPath === preferences.app.defaultHomePath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      return true;
    }

    // 获取用户信息（包含 module_permissions）
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    // #region debug-point guard-userinfo
    console.warn('[DEBUG][guard] userInfo:', {
      hasUserInfo: !!userInfo,
      userInfoKeys: userInfo ? Object.keys(userInfo).slice(0, 15) : null,
      hasModulePermissions: !!(
        userInfo && (userInfo as any).module_permissions
      ),
      modulePermissionsLength:
        (userInfo as any)?.module_permissions?.length ?? 0,
    });
    // #endregion

    // 构建动态路由：根据后端返回的 module_permissions 生成路由树
    const fetchMenuListAsync = async () => {
      let modulePermissions = (userInfo as any)?.module_permissions || [];

      // 超级管理员（admin 角色）如果没有 module_permissions，
      // 只授予核心管理模块权限（用户管理、系统参数、数据处理、门禁维护）
      if (
        modulePermissions.length === 0 &&
        userInfo?.roles?.includes('admin')
      ) {
        console.warn(
          '[DEBUG] admin user with empty permissions, granting core modules only',
        );
        const coreModules = [
          'user_management',
          'system_settings',
          'data_migration',
          'access_control',
          'customer_map',
        ];
        modulePermissions = coreModules.map((code) => ({
          module_code: code,
          can_view: true,
        }));
      }

      console.warn(
        '[DEBUG] module_permissions:',
        modulePermissions.map(
          (p: any) => `${p.module_code}:can_view=${p.can_view}`,
        ),
      );
      const routes = buildRoutesFromPermissions(modulePermissions);
      console.warn('[DEBUG] Built routes count:', routes.length);
      dumpRouteTree(routes, 'DYNAMIC ROUTES (from module_permissions)');
      return routes;
    };

    // 生成菜单和路由（backend 模式通过 fetchMenuListAsync 动态获取路由）
    const { accessibleMenus, accessibleRoutes } = await generateAccess({
      roles: [],
      router,
      routes: [],
      fetchMenuListAsync,
    });

    console.warn('[DEBUG] Generate result:', {
      accessibleRoutesCount: accessibleRoutes.length,
      accessibleMenusCount: accessibleMenus.length,
    });

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);

    // Determine redirect path
    let redirectPath = (from.query.redirect ??
      (to.path === preferences.app.defaultHomePath
        ? userInfo.homePath || preferences.app.defaultHomePath
        : to.fullPath)) as string;

    // If the redirect path doesn't resolve to a valid route (e.g., homePath
    // points to a route the user no longer has access to), fall back to default
    const resolved = router.resolve(decodeURIComponent(redirectPath));
    if (resolved.matched.length === 0 || resolved.name === 'FallbackNotFound') {
      redirectPath = preferences.app.defaultHomePath;
    }

    return {
      ...router.resolve(decodeURIComponent(redirectPath)),
      replace: true,
    };
  });
}

/**
 * 项目守卫配置
 * @param router
 */
function createRouterGuard(router: Router) {
  /** 通用 */
  setupCommonGuard(router);
  /** 权限访问 */
  setupAccessGuard(router);
}

export { createRouterGuard };
