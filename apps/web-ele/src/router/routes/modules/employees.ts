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
        name: 'LeaveManageCalendar',
        path: 'leave',
        component: () => import('#/views/leave/calendar/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:calendar-days',
          title: $t('page.leave.calendar'),
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
          title: $t('page.leave.workflow'),
          authority: ['admin'],
        },
      },
      {
        name: 'LeaveManageApprovals',
        path: 'approvals',
        component: () => import('#/views/leave/my-approvals/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:check-circle',
          title: $t('page.leave.myApprovals'),
          authority: ['admin'],
        },
      },
    ],
  },
];

export default routes;
