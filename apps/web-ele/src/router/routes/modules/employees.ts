import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:users',
      order: 1,
      title: $t('page.employees.title'),
      // 父路由：admin 和 user 都能看到
      authority: ['admin', 'user'],
    },
    name: 'EmployeeManage',
    path: '/employee/manage',
    redirect: '/employee/manage/users',
    children: [
      // Employee management — admin + user 都能看到
      {
        name: 'EmployeeManageUsers',
        path: 'users',
        component: () => import('#/views/employees/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:list',
          title: $t('page.employees.list'),
          authority: ['admin', 'user'],
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
          authority: ['admin', 'user'],
        },
      },
      // Leave management — 仅 user（admin 看不到）
      {
        name: 'LeaveManageAdmin',
        path: 'leave',
        component: () => import('#/views/leave/leave-calendar/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:calendar-check',
          title: $t('page.system.leaveManagement'),
          authority: ['user'],
        },
      },
      // Leave workflows — 仅 user（admin 看不到）
      {
        name: 'LeaveManageWorkflows',
        path: 'leave-workflows',
        component: () => import('#/views/leave/leave-workflows/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:git-branch',
          title: $t('page.system.leaveWorkflow'),
          authority: ['user'],
        },
      },
      // Approval management — 仅 user（admin 看不到）
      {
        name: 'LeaveManageApprovals',
        path: 'approvals',
        component: () => import('#/views/approve/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:clipboard-list',
          title: $t('page.system.approvalManagement'),
          authority: ['user'],
        },
      },
      // System settings — admin + user 都能看到
      {
        name: 'EmployeeManageSettings',
        path: 'settings',
        component: () => import('#/views/system/settings/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:cog',
          title: $t('page.system.settings'),
          authority: ['admin', 'user'],
        },
      },
      // Data migration — admin + user 都能看到
      {
        name: 'EmployeeManageDataMigration',
        path: 'data-migration',
        component: () => import('#/views/system/data-migration/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:database',
          title: $t('page.system.dataMigration'),
          authority: ['admin', 'user'],
        },
      },
      // Access control — admin + user 都能看到
      {
        name: 'EmployeeManageAccessControl',
        path: 'access-control',
        component: () => import('#/views/system/access-control/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:key',
          title: $t('page.system.accessControl'),
          authority: ['admin', 'user'],
        },
      },
    ],
  },
];

export default routes;
