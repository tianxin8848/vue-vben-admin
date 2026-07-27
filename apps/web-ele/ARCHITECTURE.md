# Vite + Vue 项目路由架构说明

> 项目：fuxi-hr-manager (vue-vben-admin)
> 后端：http://10.254.253.187:8999

---

## 一、入口加载顺序

```
index.html
  ↓ <script type="module" src="/src/main.ts">
main.ts
  ↓ initApplication()
  ↓   → initPreferences()          # 加载偏好设置(主题/语言/布局)
  ↓   → import('./bootstrap')      # 动态导入，延迟到首屏
bootstrap.ts
  ↓   → initComponentAdapter()     # Element Plus 适配
  ↓   → setupI18n(app)             # 国际化
  ↓   → initStores(app)            # Pinia 状态管理
  ↓   → app.use(router)            # ★ 挂载路由（触发模块加载）
  ↓   → app.mount('#app')          # 挂载 Vue 应用到 DOM
```

**关键点**：`app.use(router)` 会触发 Vue Router 初始化，此时：

1. `router/index.ts` 被 import → 触发 `createRouter()` 
2. `routes` 被 import → 触发 `router/routes/index.ts` 中所有 `import.meta.glob('./modules/**/*.ts')` 
3. 所有 `modules/*.ts` 文件被立即加载（eager: true）
4. `guard.ts` 被 import → 模块级 `console.warn` 立即执行
5. `createRouterGuard(router)` 注册路由守卫

---

## 二、路由文件职责（按重要性排序）

### 核心文件

| 文件 | 职责 |
|------|------|
| `router/index.ts` | 创建 Vue Router 实例，挂载守卫 |
| `router/guard.ts` | ★ 路由守卫（权限检查、动态路由生成） |
| `router/access.ts` | ★ 调用框架 `generateAccessible()` 生成路由和菜单 |
| `router/routes/index.ts` | ★ 合并所有模块路由，分为 coreRoutes 和 accessRoutes |
| `router/routes/core.ts` | 静态核心路由（登录页、404、Layout） |
| `router/module-permission-map.ts` | 模块权限映射（路由名 → module_code） |

### 路由模块文件（`router/routes/modules/`）

| 文件 | 路由定义 | 目标用户 |
|------|---------|---------|
| `workspace.ts` | `/employee` 员工首页/个人资料/报销 | `authority: ['user']` |
| `employees.ts` | `/employee/manage/*` 管理员页面 | `authority: ['admin']` |
| `vben.ts` | `/employee/change-password` 修改密码 | `hideInMenu`（公共） |
| `dashboard.ts` | 已清空 | - |
| `leave.ts` | 已清空 | - |
| `system.ts` | 已清空 | - |

### API 和 Store 文件

| 文件 | 职责 |
|------|------|
| `api/core/auth.ts` | 登录/登出 API |
| `api/core/user.ts` | ★ 获取用户信息、**分配 roles**、**设置 homePath** |
| `store/auth.ts` | ★ 登录流程 Store（login → fetchUserInfo → 跳转） |

### 框架层（packages/）

| 文件 | 职责 |
|------|------|
| `packages/effects/access/src/accessible.ts` | ★ `generateAccessible()` 核心：按角色过滤路由、动态注册到 Router |
| `packages/utils/...` | `generateRoutesByFrontend()` 前端角色匹配 |

---

## 三、路由加载完整流程

### 3.1 路由模块定义阶段（Vite 编译时）

```
router/routes/index.ts
  ├── import.meta.glob('./modules/**/*.ts', { eager: true })
  ├── mergeRouteModules(dynamicRouteFiles) → dynamicRoutes
  │
  ├── coreRoutes     = [Root(/), AuthLayout(/auth/login, ...)]
  ├── accessRoutes   = [dynamicRoutes, staticRoutes]
  ├── routes         = [coreRoutes, externalRoutes, 404]
  │
  └── 导出: { accessRoutes, coreRouteNames, routes }
```

`routes` → 传给 `createRouter()` 作为初始路由（静态路由，无需权限校验）

`accessRoutes` → 传给 `guard.ts` 作为待过滤的动态路由（需要经过权限校验后才注册）

### 3.2 用户访问页面 → 路由守卫触发（运行时）

```
用户访问 http://localhost:5777/employee/manage/users
  ↓
router.beforeEach (guard.ts #1 - setupCommonGuard)
  ↓ 记录加载状态、启动进度条
router.beforeEach (guard.ts #2 - setupAccessGuard)
  ↓
  ├─ to.name 在 coreRouteNames 中？
  │   YES → 跳过权限检查，直接放行（Login 页等）
  │   NO  → 继续
  │
  ├─ 有 accessToken？
  │   NO  → 重定向到 /auth/login
  │   YES → 继续
  │
  ├─ isAccessChecked === true？
  │   YES → 动态路由已生成，直接放行
  │   NO  → ★ 首次访问，开始生成动态路由
  │
  ├─ 获取用户信息
  │     userInfo = userStore.userInfo || (await authStore.fetchUserInfo())
  │           ↓
  │     fetchUserInfo() → API: GET /api/v1/auth/me
  │           ↓
  │     user.ts 处理返回数据：
  │       isAdmin = (username === 'admin' || user_id === 1)
  │       roles   = isAdmin ? ['admin'] : ['user']
  │       homePath = isAdmin ? '/employee/manage' : '/employee'
  │
  ├─ 模块权限过滤（仅 admin 且有 module_permissions 时生效）
  │     filterAdminRoutesByPermissions(accessRoutes, modulePermissions)
  │       → 递归移除 can_view=false 的模块对应路由
  │
  ├─ ★ generateAccess({ roles, routes: filteredRoutes })
  │     ↓
  │   generateAccessible('frontend', options)
  │     ↓
  │   generateRoutesByFrontend(routes, roles, forbiddenComponent)
  │     → 递归遍历路由树：
  │       · route.meta.authority = ['admin'] → 只有 roles 含 'admin' 可见
  │       · route.meta.authority = ['user']  → 只有 roles 含 'user' 可见
  │       · route.meta.authority = undefined  → 所有人可见
  │       · 无权限 → 替换为 forbiddenComponent (403页面)
  │     ↓
  │   动态注册到 router（router.addRoute）
  │     ↓
  │   生成菜单树 generateMenus()
  │
  └─ 保存结果、重定向到目标页面
```

### 3.3 权限过滤规则

```
用户角色(roles)         路由 authority              结果
─────────────────────────────────────────────────────
['admin']           ['admin']                  ✅ 显示
['admin']           ['user']                   ❌ 隐藏/403
['admin']           undefined                  ✅ 显示(所有人可见)
['user']            ['admin']                  ❌ 隐藏/403
['user']            ['user']                   ✅ 显示
['user']            undefined                  ✅ 显示(所有人可见)
```

### 3.4 当前路由 ↔ 界面映射

**管理员（admin）可见路由：**

| 路径 | 路由名 | 界面文件 |
|------|--------|---------|
| `/employee/manage` | EmployeeManage | 重定向到 users |
| `/employee/manage/users` | EmployeeManageUsers | `views/employees/list/index.vue` |
| `/employee/manage/users/:id/profile` | EmployeeManageUserProfile | `views/employees/profile/index.vue` |
| `/employee/manage/settings` | EmployeeManageSettings | `views/system/settings/index.vue` |
| `/employee/manage/data-migration` | EmployeeManageDataMigration | `views/system/data-migration/index.vue` |
| `/employee/manage/access-control` | EmployeeManageAccessControl | `views/system/access-control/index.vue` |

**普通用户（user）可见路由：**

| 路径 | 路由名 | 界面文件 |
|------|--------|---------|
| `/employee` | WorkspaceHome | `views/workspace/index.vue` |
| `/employee/profile` | WorkspaceProfile | `views/workspace/profile.vue` |
| `/employee/claims` | EmployeeClaims | `views/claim/index.vue` |
| `/employee/leave/detail/:id` | LeaveDetail | `views/leave/detail/index.vue` |

**公共路由（所有人）：**

| 路径 | 路由名 | 界面文件 |
|------|--------|---------|
| `/auth/login` | Login | `views/_core/authentication/login.vue` |
| `/employee/change-password` | Profile | `views/_core/profile/index.vue` |

---

## 四、新增一个页面/路由的步骤

以新增「公告管理」页面为例：

### 第 1 步：创建 Vue 组件

```bash
# 创建目录和组件
mkdir -p apps/web-ele/src/views/announcement
```

```vue
<!-- apps/web-ele/src/views/announcement/index.vue -->
<template>
  <div>公告管理页面</div>
</template>
```

### 第 2 步：新增路由模块文件

```bash
# 创建路由定义文件
touch apps/web-ele/src/router/routes/modules/announcement.ts
```

```ts
// apps/web-ele/src/router/routes/modules/announcement.ts
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    meta: {
      icon: 'lucide:megaphone',
      order: 10,
      title: '公告管理',
      authority: ['admin'],     // ← 控制谁可见
    },
    name: 'AnnouncementManage',
    path: '/employee/manage/announcement',
    component: () => import('#/views/announcement/index.vue'),
  },
];

export default routes;
```

### 第 3 步（可选）：注册模块权限映射

如果后端接口 `/auth/me` 返回的 `module_permissions` 里有 `announcement_management` 模块，需要在映射表中添加：

```ts
// apps/web-ele/src/router/routes/module-permission-map.ts

export const ROUTE_NAME_TO_MODULE_CODE: Record<string, string> = {
  // ... 已有映射 ...
  
  // 新增
  AnnouncementManage: 'announcement_management',
};
```

`module_code` 值必须与后端「系统参数维护」页面配置的模块代码一致。

### 第 4 步：刷新验证

Vite dev 服务器会自动热更新（HMR），无需重启。刷新页面即可在菜单中看到新路由。

> **不需要修改的文件**：`guard.ts`、`access.ts`、`router/index.ts`、`router/routes/index.ts` 都不需要改。`import.meta.glob('./modules/**/*.ts')` 会自动发现新文件。

---

## 五、TS 文件重要性分级

### S 级（修改需谨慎，影响全局）

| 文件 | 原因 |
|------|------|
| `api/core/user.ts` | 决定**用户角色分配**和**首页路径**，改了影响所有用户跳转 |
| `router/guard.ts` | 路由守卫核心，控制权限检查流程 |
| `packages/effects/access/src/accessible.ts` | 框架级 `generateAccessible()`，处理路由过滤和动态注册 |
| `router/routes/index.ts` | 路由合并入口，决定哪些路由需要权限校验 |

### A 级（经常修改，影响特定功能）

| 文件 | 原因 |
|------|------|
| `router/routes/modules/*.ts` | 所有路由定义都在这里 |
| `store/auth.ts` | 登录流程 |
| `api/core/auth.ts` | 登录/登出 API |

### B 级（辅助配置，按需修改）

| 文件 | 原因 |
|------|------|
| `router/access.ts` | 调用框架 generateAccessible 的薄封装 |
| `router/module-permission-map.ts` | 模块权限映射表 |
| `preferences.ts` | 全局默认配置（首页路径、主题等） |
| `bootstrap.ts` | 应用初始化流程 |

### C 级（无需修改）

| 文件 | 原因 |
|------|------|
| `main.ts` | 入口脚本，不涉及路由逻辑 |
| `router/routes/core.ts` | 静态路由（登录页/404/Layout），极少改动 |

---

## 六、常见问题

**Q: 为什么改了路由文件不生效？**

A: Vite dev server 支持 HMR，但如果是 `eager: true` 加载的模块路由文件，**刷新页面**即可生效，不需要 HMR。

**Q: 加了 `authority: ['admin']`，admin 用户还是看不到？**

A: 检查 `user.ts` 中 `roles` 的值。admin 必须返回 `['admin']` 才能匹配。当前逻辑是 `isAdmin = (username === 'admin' || user_id === 1)`。

**Q: 什么是 `homePath`？**

A: 用户登录后自动跳转的首页路径。admin 是 `/employee/manage`（重定向到 users），普通用户是 `/employee`。

**Q: 为什么我把路由文件删了，菜单里还有？**

A: 如果之前生成过路由（`isAccessChecked = true`），需要**清除浏览器缓存/localStorage**或重新登录。动态路由只生成一次。
