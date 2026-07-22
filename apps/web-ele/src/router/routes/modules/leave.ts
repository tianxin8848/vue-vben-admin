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
];

export default routes;
