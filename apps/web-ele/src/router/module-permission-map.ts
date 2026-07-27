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
  EmployeeManageUsers: 'user_management',
  EmployeeManageUserProfile: 'user_management',
  EmployeeManageSettings: 'system_settings',
  EmployeeManageDataMigration: 'data_migration',
  EmployeeManageAccessControl: 'access_control',
  LeaveManageAdmin: 'leave_management',
  LeaveManageWorkflows: 'leave_workflows',
  LeaveManageApprovals: 'approval_management',
};

/**
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
