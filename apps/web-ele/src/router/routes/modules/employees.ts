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
      // ─── 请假管理 ───────────────────────────────────────────────────────
      {
        name: 'LeaveManageAdmin',
        path: 'leave',
        component: () => import('#/views/leave/admin-manage/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:calendar-days',
          title: '请假管理',
          authority: ['admin'],
        },
      },
      {
        name: 'LeaveManageWorkflows',
        path: 'leave-workflows',
        component: () => import('#/views/leave/workflow/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:git-branch',
          title: '请假流程',
          authority: ['admin'],
        },
      },
      {
        name: 'LeaveManageApprovals',
        path: 'approvals',
        component: () => import('#/views/leave/admin-approvals/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:check-circle',
          title: '审批管理',
          authority: ['admin'],
        },
      },
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
