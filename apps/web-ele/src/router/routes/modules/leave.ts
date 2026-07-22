import type { RouteRecordRaw } from 'vue-router';

import { $t } from '#/locales';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:calendar',
      order: 2,
      title: $t('page.leave.title'),
    },
    name: 'Leave',
    path: '/leave',
    children: [
      {
        name: 'LeaveList',
        path: 'list',
        component: () => import('#/views/leave/list/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:clipboard-list',
          title: $t('page.leave.list'),
          authority: ['admin'],
        },
      },
      {
        name: 'MyLeave',
        path: 'my-leave',
        component: () => import('#/views/leave/my-leave/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:user-circle',
          title: $t('page.leave.myLeave'),
        },
      },
      {
        name: 'MyApprovals',
        path: 'my-approvals',
        component: () => import('#/views/leave/my-approvals/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:check-circle',
          title: $t('page.leave.myApprovals'),
        },
      },
      {
        name: 'MyRecords',
        path: 'my-records',
        component: () => import('#/views/leave/my-records/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:history',
          title: $t('page.leave.myRecords'),
        },
      },
      {
        name: 'LeaveCalendar',
        path: 'calendar',
        component: () => import('#/views/leave/calendar/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:calendar-days',
          title: $t('page.leave.calendar'),
          authority: ['admin'],
        },
      },
      {
        name: 'LeaveDetail',
        path: 'detail/:id',
        component: () => import('#/views/leave/detail/index.vue'),
        meta: {
          hideInMenu: true,
          icon: 'lucide:file-text',
          title: $t('page.leave.detail'),
        },
      },
      {
        name: 'LeaveWorkflow',
        path: 'workflow',
        component: () => import('#/views/leave/workflow/index.vue'),
        meta: {
          affixTab: false,
          icon: 'lucide:git-branch',
          title: $t('page.leave.workflow'),
          authority: ['admin'],
        },
      },
    ],
  },
];

export default routes;