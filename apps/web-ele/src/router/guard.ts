import type { Router } from 'vue-router';

import { LOGIN_PATH } from '@vben/constants';
import { preferences } from '@vben/preferences';
import { useAccessStore, useUserStore } from '@vben/stores';
import { startProgress, stopProgress } from '@vben/utils';

import { accessRoutes, coreRouteNames } from '#/router/routes';
import { useAuthStore } from '#/store';

import { generateAccess } from './access';
import { filterAdminRoutesByPermissions } from './module-permission-map';

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

// ===== 模块级日志：import 时立即执行 =====
console.warn('=== [guard.ts] MODULE LOADED - coreRouteNames:', coreRouteNames);
// 打印所有源路由定义（权限检查前的原始路由列表）
dumpRouteTree(accessRoutes, 'BEFORE AUTH - All source routes (accessRoutes)');

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

    console.warn('[DEBUG] Route guard triggered:', {
      toPath: to.path,
      toName: to.name,
      fromPath: from.path,
      hasToken: !!accessStore.accessToken,
      isChecked: accessStore.isAccessChecked,
    });

    // 基本路由，这些路由不需要进入权限拦截
    if (coreRouteNames.includes(to.name as string)) {
      console.warn('[DEBUG] Core route, skip auth check:', to.name);
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
      console.warn('[DEBUG] No accessToken, redirect to login:', to.path);
      // 明确声明忽略权限访问权限，则可以访问
      if (to.meta.ignoreAccess) {
        return true;
      }

      // 没有访问权限，跳转登录页面
      if (to.fullPath !== LOGIN_PATH) {
        return {
          path: LOGIN_PATH,
          // 如不需要，直接删除 query
          query:
            to.fullPath === preferences.app.defaultHomePath
              ? {}
              : { redirect: encodeURIComponent(to.fullPath) },
          // 携带当前跳转的页面，登录后重新跳转该页面
          replace: true,
        };
      }
      return to;
    }

    // 是否已经生成过动态路由
    if (accessStore.isAccessChecked) {
      console.warn('[DEBUG] Routes already generated, pass through:', to.path);
      return true;
    }

    // 生成路由表
    // 当前登录用户拥有的角色标识列表
    console.warn('[DEBUG] Start generating dynamic routes...');
    const userInfo = userStore.userInfo || (await authStore.fetchUserInfo());
    const userRoles = userInfo.roles ?? [];

    console.warn('[DEBUG] User roles:', userRoles);
    console.warn('[DEBUG] Source route count:', accessRoutes.length);

    // 根据后端 module_permissions 过滤 admin 路由
    let filteredRoutes = [...accessRoutes];
    const modulePermissions = (userInfo as any)?.module_permissions;
    if (modulePermissions && modulePermissions.length > 0) {
      console.warn(
        '[DEBUG] Module permission filter - user permissions:',
        modulePermissions.map(
          (p: any) => `${p.module_code}:can_view=${p.can_view}`,
        ),
      );
      filteredRoutes = filterAdminRoutesByPermissions(
        accessRoutes,
        modulePermissions,
      );
      console.warn(
        '[DEBUG] After module filter, route count:',
        filteredRoutes.length,
      );
    }

    // 生成菜单和路由
    const { accessibleMenus, accessibleRoutes } = await generateAccess({
      roles: userRoles,
      router,
      routes: filteredRoutes,
    });

    // ===== 打印最终生成的全部路由 =====
    console.warn('[DEBUG] Generate result summary:', {
      accessibleRoutesCount: accessibleRoutes.length,
      accessibleMenusCount: accessibleMenus.length,
    });
    dumpRouteTree(
      accessibleRoutes,
      'AFTER AUTH - Final registered routes (accessibleRoutes)',
    );

    console.warn(
      '[DEBUG] Menu list:',
      accessibleMenus.map((m: any) => ({
        name: m.name,
        path: m.path,
        title: m.meta?.title,
      })),
    );

    // 保存菜单信息和路由信息
    accessStore.setAccessMenus(accessibleMenus);
    accessStore.setAccessRoutes(accessibleRoutes);
    accessStore.setIsAccessChecked(true);
    const redirectPath = (from.query.redirect ??
      (to.path === preferences.app.defaultHomePath
        ? userInfo.homePath || preferences.app.defaultHomePath
        : to.fullPath)) as string;

    console.warn('[DEBUG] Redirect path:', redirectPath);

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
