import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  // ─── 管理员：请假管理 ───────────────────────────────────────────────────────
  {
    meta: {
      icon: 'lucide:calendar',
      order: 2,
      title: $t('page.leave.title'),
      authority: ['admin'],
    },
    name: 'LeaveManage',
    path: '/employee/manage',
    children: [
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
  // ─── 员工自助：请假相关 ─────────────────────────────────────────────────────
  {
    meta: {
      icon: 'lucide:clipboard-list',
      order: 4,
      title: $t('page.leave.submit'),
    },
    name: 'EmployeeLeave',
    path: '/employee',
    children: [
      {
        name: 'EmployeeLeaveApply',
        path: 'leave',
        component: () => import('#/views/leave/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:clipboard-list',
          title: $t('page.leave.list'),
        },
      },
      {
        name: 'EmployeeMyLeave',
        path: 'my-leave',
        component: () => import('#/views/leave/my-leave/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:user-circle',
          title: $t('page.leave.myLeave'),
        },
      },
      {
        name: 'EmployeeMyRecords',
        path: 'my-records',
        component: () => import('#/views/leave/my-records/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:history',
          title: $t('page.leave.myRecords'),
        },
      },
      {
        name: 'LeaveDetail',
        path: 'leave/detail/:id',
        component: () => import('#/views/leave/detail/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: $t('page.leave.detail'),
        },
      },
    ],
  },
];

export default routes;
