import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:home',
      order: 0,
      title: $t('page.workspace.title'),
      authority: ['user'],
    },
    name: 'Workspace',
    path: '/employee',
    redirect: '/employee',
    children: [
      {
        name: 'WorkspaceHome',
        path: '',
        component: () => import('#/views/workspace/index.vue'),
        meta: {
          affixTab: true,
          icon: 'lucide:home',
          title: $t('page.workspace.home'),
          authority: ['user'],
        },
      },
      // Workspace: Access Guide
      {
        name: 'WorkspaceGuide',
        path: 'dashboard/workspace',
        component: () => import('#/views/workspace/dashboard/workspace.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:layout-dashboard',
          title: '界面访问说明',
          authority: ['user'],
        },
      },
      // Employee: My Leave
      {
        name: 'EmployeeLeave',
        path: 'leave',
        component: () => import('#/views/leave/employee-leave/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:calendar',
          title: '请假申请',
          authority: ['user'],
        },
      },
      // Employee: My Approvals
      {
        name: 'EmployeeApprovals',
        path: 'approvals',
        component: () => import('#/views/leave/employee-leave/approvals.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:clipboard-check',
          title: '审批记录',
          authority: ['user'],
        },
      },
      // Employee: Claims
      {
        name: 'EmployeeClaims',
        path: 'claims',
        component: () => import('#/views/claim/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:receipt',
          title: $t('page.claim.title'),
          authority: ['user'],
        },
      },
      // Employee: Leave Detail (hidden in menu, reached from leave list)
      {
        name: 'LeaveDetail',
        path: 'leave/detail/:id',
        component: () => import('#/views/leave/employee-leave/detail.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: $t('page.leave.detail'),
          authority: ['user'],
        },
      },
    ],
  },
];

export default routes;
