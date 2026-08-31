import type { RouteRecordStringComponent } from '@vben/types';

import { $t } from '#/locales';

/**
 * Deep clone route objects to prevent mutation of template constants
 * when convertRoutes changes component from string to function.
 */
function cloneRoute(
  route: RouteRecordStringComponent,
): RouteRecordStringComponent {
  const cloned: RouteRecordStringComponent = { ...route };
  if (route.children) {
    cloned.children = route.children.map((child) => cloneRoute(child));
  }
  return cloned;
}

function cloneRoutes(
  routes: RouteRecordStringComponent[],
): RouteRecordStringComponent[] {
  return routes.map((r) => cloneRoute(r));
}

/**
 * Route name -> module_code mapping table
 *
 * Backend /auth/me returns UserResponse.module_permissions,
 * each ModulePermission has module_code and can_view fields.
 * For admin users, if a module's can_view === false,
 * the corresponding route won't appear in menus/routes.
 *
 * IMPORTANT: module_code values MUST match what's configured in
 * the backend System Settings modules list.
 */

/** Route name -> module_code */
export const ROUTE_NAME_TO_MODULE_CODE: Record<string, string> = {
  EmployeeManageAccessControl: 'access_control',
  EmployeeManageDataMigration: 'data_migration',
  EmployeeManageSettings: 'system_settings',
  EmployeeManageUserProfile: 'user_management',
  EmployeeManageUsers: 'user_management',
  FuxiMapCustomers: 'customer_map',
  LeaveManageAdmin: 'leave_calendar',
  LeaveManageApprovals: 'approval_management',
  LeaveManageWorkflows: 'leave_workflows',
};

/**
 * Routes that are always visible (no module permission check required).
 * These are the base workspace and profile routes available to all authenticated users.
 *
 * Note: Employee sub-routes that require module permissions (e.g. leave, claims, approvals)
 * are NOT included here. They are added by buildRoutesFromPermissions() based
 * on the user's module_permissions from the backend.
 */
const ALWAYS_VISIBLE_ROUTES: RouteRecordStringComponent[] = [
  {
    name: 'Workspace',
    path: '/employee',
    component: 'BasicLayout',
    meta: {
      icon: 'lucide:home',
      order: 0,
      title: $t('page.workspace.title'),
    },
    children: [
      {
        name: 'WorkspaceHome',
        path: '',
        component: 'workspace/index',
        meta: {
          affixTab: true,
          icon: 'lucide:home',
          title: $t('page.workspace.home'),
        },
      },
    ],
  },
  {
    name: 'Profile',
    path: '/employee/change-password',
    component: '_core/profile/index',
    meta: {
      hideInMenu: true,
      icon: 'lucide:user',
      order: 99,
      title: $t('page.workspace.profile'),
    },
  },
];

/**
 * Workspace child routes that require backend module permissions.
 * key = template key, value = { route, module_code }
 */
const WORKSPACE_PERMISSION_CHILDREN: Record<
  string,
  { module_code: string; routes: RouteRecordStringComponent[] }
> = {
  employee_leave: {
    module_code: 'employee_leave',
    routes: [
      {
        name: 'EmployeeLeave',
        path: 'leave',
        component: 'leave/employee-leave/index',
        meta: {
          affixTab: false,
          icon: 'lucide:calendar',
          title: $t('page.workspace.myLeave'),
        },
      },
      {
        name: 'LeaveDetail',
        path: 'leave/detail/:id',
        component: 'leave/employee-leave/detail',
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: $t('page.leave.detail'),
        },
      },
    ],
  },
  employee_claims: {
    module_code: 'claim_management',
    routes: [
      {
        name: 'EmployeeClaims',
        path: 'claims',
        component: 'claim/index',
        meta: {
          affixTab: false,
          icon: 'lucide:receipt',
          title: $t('page.claim.title'),
        },
      },
    ],
  },
  employee_approvals: {
    module_code: 'approval_management',
    routes: [
      {
        name: 'EmployeeApprovals',
        path: 'approvals',
        component: 'approve/index',
        meta: {
          affixTab: false,
          icon: 'lucide:clipboard-check',
          title: $t('page.workspace.myApprovals'),
        },
      },
    ],
  },
  system_settings_workspace: {
    module_code: 'system_settings',
    routes: [
      {
        name: 'WorkspaceGuide',
        path: 'dashboard/workspace',
        component: 'workspace/dashboard/workspace',
        meta: {
          affixTab: false,
          icon: 'lucide:layout-dashboard',
          title: $t('page.workspace.dashboard'),
        },
      },
    ],
  },
};

/**
 * Route templates for management sub-routes, keyed by module_code.
 * Each template is a child route of the management parent.
 */
const MANAGEMENT_ROUTE_TEMPLATES: Record<string, RouteRecordStringComponent> = {
  approval_management: {
    name: 'LeaveManageApprovals',
    path: 'approvals',
    component: 'approve/index',
    meta: {
      affixTab: false,
      icon: 'lucide:clipboard-list',
      title: $t('page.system.approvalManagement'),
    },
  },
  access_control: {
    name: 'EmployeeManageAccessControl',
    path: 'access-control',
    component: 'system/access-control/index',
    meta: {
      affixTab: false,
      icon: 'lucide:key',
      title: $t('page.system.accessControl'),
    },
  },
  data_migration: {
    name: 'EmployeeManageDataMigration',
    path: 'data-migration',
    component: 'system/data-migration/index',
    meta: {
      affixTab: false,
      hideInMenu: true,
      icon: 'lucide:database',
      title: $t('page.system.dataMigration'),
    },
  },
  leave_calendar: {
    name: 'LeaveManageAdmin',
    path: 'leave',
    component: 'leave/leave-calendar/index',
    meta: {
      affixTab: false,
      icon: 'lucide:calendar-check',
      title: $t('page.leave.adminList'),
    },
  },
  leave_workflows: {
    name: 'LeaveManageWorkflows',
    path: 'leave-workflows',
    component: 'leave/leave-workflows/index',
    meta: {
      affixTab: false,
      icon: 'lucide:git-branch',
      title: $t('page.leave.workflowCenter'),
    },
  },
  system_settings: {
    name: 'EmployeeManageSettings',
    path: 'settings',
    component: 'system/settings/index',
    meta: {
      affixTab: false,
      fullPathKey: false,
      hideInMenu: true,
      icon: 'lucide:cog',
      title: $t('page.system.settings'),
    },
  },
  user_management: {
    name: 'EmployeeManageUsers',
    path: 'users',
    component: 'employees/list/index',
    meta: {
      affixTab: false,
      icon: 'lucide:list',
      title: $t('page.employees.list'),
    },
  },
  user_management_profile: {
    name: 'EmployeeManageUserProfile',
    path: 'users/:id/profile',
    component: 'employees/profile/index',
    meta: {
      hideInMenu: true,
      icon: 'lucide:user',
      title: $t('page.employees.profile'),
    },
  },
  customer_map: {
    name: 'FuxiMapCustomers',
    path: 'customers',
    component: 'fuximap/index',
    meta: {
      affixTab: false,
      icon: 'lucide:map-pinned',
      title: $t('page.fuximap.customerDistribution'),
    },
  },
};

/**
 * Build the complete route tree based on user's module_permissions.
 *
 * Always-visible routes (workspace, profile) are included.
 * Management routes are filtered by module_permissions where can_view === true.
 *
 * @param modulePermissions - Array of { module_code, can_view } from /auth/me
 * @returns RouteRecordStringComponent[] ready for generateRoutesByBackend
 */
export function buildRoutesFromPermissions(
  modulePermissions: Array<{
    can_view?: boolean;
    module_code: string;
  }>,
): RouteRecordStringComponent[] {
  // Deep clone to prevent convertRoutes from mutating template constants
  const routes: RouteRecordStringComponent[] = cloneRoutes(
    ALWAYS_VISIBLE_ROUTES,
  );

  // Build permission map: module_code -> can_view
  const permissionMap = new Map<string, boolean>();
  for (const perm of modulePermissions) {
    permissionMap.set(perm.module_code, perm.can_view !== false);
  }

  // Helper: check if a module is viewable
  const canViewModule = (moduleCode: string) => {
    const canView = permissionMap.get(moduleCode);
    // Opt-in: only include if backend explicitly says can_view !== false
    // If permission is not in map at all, default to hidden (security-first)
    return canView !== false && canView !== undefined;
  };

  // Add permission-gated children to the Workspace route
  const workspacePermissionChildren: RouteRecordStringComponent[] = [];
  for (const [_key, { module_code, routes: permRoutes }] of Object.entries(
    WORKSPACE_PERMISSION_CHILDREN,
  )) {
    if (canViewModule(module_code)) {
      for (const r of permRoutes) {
        workspacePermissionChildren.push(cloneRoute(r));
      }
    }
  }

  // If there are permission-gated workspace children, add them to the Workspace route
  if (workspacePermissionChildren.length > 0) {
    const workspaceRoute = routes.find((r) => r.name === 'Workspace');
    if (workspaceRoute) {
      workspaceRoute.children = [
        ...(workspaceRoute.children ?? []),
        ...workspacePermissionChildren,
      ];
    }
  }

  // Helper: add a management route template if its module is enabled
  const addRoute = (templateKey: string) => {
    const template = MANAGEMENT_ROUTE_TEMPLATES[templateKey];
    if (!template) return;

    // Extract module_code from the key (strip _profile suffix for profile routes)
    const moduleCode = templateKey.replace(/_profile$/, '');

    if (!canViewModule(moduleCode)) return;

    managementChildren.push(cloneRoute(template));
  };

  const managementChildren: RouteRecordStringComponent[] = [];

  // Add management routes in a fixed order
  addRoute('user_management');
  addRoute('user_management_profile');
  addRoute('leave_calendar');
  addRoute('leave_workflows');
  addRoute('approval_management');
  addRoute('system_settings');
  addRoute('data_migration');
  addRoute('access_control');

  // 只在 management 有可见子路由时才添加 EmployeeManage 父路由
  if (managementChildren.length > 0) {
    const firstChild = managementChildren[0];
    const redirectPath = firstChild
      ? `/employee/manage/${firstChild.path}`
      : '/employee/manage';

    routes.push({
      name: 'EmployeeManage',
      path: '/employee/manage',
      component: 'BasicLayout',
      redirect: redirectPath,
      meta: {
        icon: 'lucide:users',
        order: 1,
        title: $t('page.employees.title'),
      },
      children: managementChildren,
    });
  }

  // ─── 客户地图 (customer_map) ────────────────────────────────────────────
  if (canViewModule('customer_map')) {
    const customerTpl = MANAGEMENT_ROUTE_TEMPLATES.customer_map;
    if (customerTpl) {
      const child = cloneRoute(customerTpl);
      routes.push({
        name: 'FuxiMap',
        path: '/fuximap',
        component: 'BasicLayout',
        redirect: '/fuximap/customers',
        meta: {
          icon: 'lucide:map',
          order: 2,
          title: $t('page.fuximap.title'),
        },
        children: [child],
      });
    }
  }

  return routes;
}

/**
 * @deprecated Use buildRoutesFromPermissions instead.
 * Filter admin routes based on user's module_permissions.
 * Routes whose corresponding module has can_view === false are removed.
 */
export function filterAdminRoutesByPermissions(
  routes: any[],
  modulePermissions: Array<{
    can_approve?: boolean;
    can_create?: boolean;
    can_delete?: boolean;
    can_edit?: boolean;
    can_view?: boolean;
    module_code: string;
    module_name?: string;
  }>,
): any[] {
  if (!modulePermissions || modulePermissions.length === 0) {
    return routes;
  }

  const permissionMap = new Map<string, boolean>();
  for (const perm of modulePermissions) {
    permissionMap.set(perm.module_code, perm.can_view !== false);
  }

  function filterRoute(route: any): any {
    if (route.children && route.children.length > 0) {
      const filteredChildren = route.children
        .map((child: any) => filterRoute(child))
        .filter(Boolean);

      if (filteredChildren.length === 0 && !route.component) {
        return null;
      }

      return { ...route, children: filteredChildren };
    }

    const routeName = String(route.name || '');
    if (!routeName) return route;

    const moduleCode = ROUTE_NAME_TO_MODULE_CODE[routeName];
    if (!moduleCode) return route;

    const canView = permissionMap.get(moduleCode);
    if (canView === undefined) return route;
    if (canView === false) return null;

    return route;
  }

  return routes.map((route: any) => filterRoute(route)).filter(Boolean);
}
