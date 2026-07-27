import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 1,
      title: $t('page.employees.title'),
      authority: ['admin'],
    },
    name: 'EmployeeManage',
    path: '/employee/manage',
    redirect: '/employee/manage/users',
    children: [
      // ─── 员工管理 ─────────────────────────────────────────────────
      {
        name: 'EmployeeManageUsers',
        path: 'users',
        component: () => import('#/views/employees/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:list',
          title: $t('page.employees.list'),
          authority: ['admin'],
        },
      },
      {
        name: 'EmployeeManageUserProfile',
        path: 'users/:id/profile',
        component: () => import('#/views/employees/profile/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:user',
          title: $t('page.employees.profile'),
          authority: ['admin'],
        },
      },
      // ─── 系统参数 ─────────────────────────────────────────────────
      {
        name: 'EmployeeManageSettings',
        path: 'settings',
        component: () => import('#/views/system/settings/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:gear',
          title: $t('page.system.settings'),
          authority: ['admin'],
        },
      },
      // ─── 数据迁移 ─────────────────────────────────────────────────
      {
        name: 'EmployeeManageDataMigration',
        path: 'data-migration',
        component: () => import('#/views/system/data-migration/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:database',
          title: '数据处理维护',
          authority: ['admin'],
        },
      },
      // ─── 门禁管理 ─��───────────────────────────────────────────────
      {
        name: 'EmployeeManageAccessControl',
        path: 'access-control',
        component: () => import('#/views/system/access-control/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:key',
          title: '门禁管理',
          authority: ['admin'],
        },
      },
    ],
  },
];

export default routes;
