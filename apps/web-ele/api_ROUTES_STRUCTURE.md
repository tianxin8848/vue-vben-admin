# Vue-Vben-Admin Web-Ele 组件层次路由说明文档

## 1. 项目概览

`web-ele` 是基于 **Vue3 + Element Plus + Vben Admin** 构建的企业级后台管理应用，采用模块化路由设计，支持权限控制和动态路由生成。

## 2. 路由架构总览

### 2.1 路由分类体系

| 路由类型 | 定义文件 | 用途 | 权限验证 |
|---------|---------|------|---------|
| **核心路由** | `router/routes/core.ts` | 基础页面（登录、根路由、404） | 无需验证 |
| **动态路由** | `router/routes/modules/*.ts` | 业务功能页面 | 需要验证 |
| **静态路由** | `router/routes/static/*.ts` | 固定页面（当前为空） | 需要验证 |
| **外部路由** | `router/routes/external/*.ts` | 外部嵌入页面（当前为空） | 无需验证 |

### 2.2 路由加载流程

```
用户访问 → 路由守卫(beforeEach) → 权限检查 → 动态路由生成 → 页面渲染
           ↓
    核心路由直接放行
           ↓
    非核心路由检查 accessToken
           ↓
    未登录 → 跳转登录页(带redirect参数)
           ↓
    已登录 → 检查是否生成过动态路由
           ↓
    未生成 → 调用 generateAccessible 生成权限路由
           ↓
    已生成 → 直接跳转目标页面
```

## 3. 核心路由结构

### 3.1 路由配置

```typescript
// router/routes/core.ts
[
  {
    name: 'Root',           // 根路由
    path: '/',
    component: BasicLayout,
    redirect: '/dashboard/analytics'
  },
  {
    name: 'Authentication', // 认证路由
    path: '/auth',
    component: AuthPageLayout,
    redirect: '/auth/login'
  },
  {
    name: 'FallbackNotFound', // 404兜底路由
    path: '/:path(.*)*',
    component: NotFound
  }
]
```

### 3.2 认证子路由

| 路由名称 | 路径 | 组件 | 功能 |
|---------|------|------|------|
| `Login` | `/auth/login` | `views/_core/authentication/login.vue` | 账号密码登录 |
| `CodeLogin` | `/auth/code-login` | `views/_core/authentication/code-login.vue` | 验证码登录 |
| `QrCodeLogin` | `/auth/qrcode-login` | `views/_core/authentication/qrcode-login.vue` | 二维码登录 |
| `ForgetPassword` | `/auth/forget-password` | `views/_core/authentication/forget-password.vue` | 忘记密码 |
| `Register` | `/auth/register` | `views/_core/authentication/register.vue` | 用户注册 |

## 4. 动态路由模块

### 4.1 Dashboard 模块 (`router/routes/modules/dashboard.ts`)

```
/dashboard
├── /analytics      → Dashboard/Analytics (首页仪表盘)
└── /workspace      → Dashboard/Workspace (工作空间)
```

**路由配置详情：**

| 路由名称 | 路径 | 组件 | 元信息 |
|---------|------|------|--------|
| `Dashboard` | `/dashboard` | - (目录节点) | 图标: `lucide:layout-dashboard`, 排序: -1 |
| `Analytics` | `/dashboard/analytics` | `views/dashboard/analytics/index.vue` | 固定标签, 图标: `lucide:area-chart` |
| `Workspace` | `/dashboard/workspace` | `views/dashboard/workspace/index.vue` | 图标: `carbon:workspace` |

**Analytics 子组件结构：**

```
views/dashboard/analytics/
├── index.vue                    # 主页面容器
├── analytics-trends.vue         # 趋势图表
├── analytics-visits-data.vue    # 访问数据
├── analytics-visits-sales.vue   # 销售数据
├── analytics-visits-source.vue  # 来源分析
└── analytics-visits.vue         # 访问概览
```

### 4.2 Demos 模块 (`router/routes/modules/demos.ts`)

```
/demos
├── /element    → Element Plus 组件演示
└── /form       → 表单基础演示
```

**路由配置详情：**

| 路由名称 | 路径 | 组件 | 元信息 |
|---------|------|------|--------|
| `Demos` | `/demos` | - (目录节点) | 图标: `ic:baseline-view-in-ar`, 排序: 1000, keepAlive |
| `NaiveDemos` | `/demos/element` | `views/demos/element/index.vue` | - |
| `BasicForm` | `/demos/form` | `views/demos/form/basic.vue` | - |

### 4.3 Vben 模块 (`router/routes/modules/vben.ts`)

```
/vben-admin
├── /document       → Vben 文档 (iframe)
├── /github         → GitHub 仓库 (iframe)
├── /naive          → Naive UI 版本预览 (iframe)
├── /antd           → Ant Design Vue 版本预览 (iframe)
├── /antdv-next     → Ant Design Vue Next 版本预览 (iframe)
└── /tdesign        → TDesign 版本预览 (iframe)

/vben-admin/about   → 关于页面
/profile            → 个人中心 (隐藏菜单)
```

**路由配置详情：**

| 路由名称 | 路径 | 组件 | 类型 |
|---------|------|------|------|
| `VbenProject` | `/vben-admin` | - (目录节点) | 带红点标记 |
| `VbenDocument` | `/vben-admin/document` | `IFrameView` | 外部文档 |
| `VbenGithub` | `/vben-admin/github` | `IFrameView` | GitHub |
| `VbenNaive` | `/vben-admin/naive` | `IFrameView` | Naive UI 预览 |
| `VbenAntd` | `/vben-admin/antd` | `IFrameView` | Antd Vue 预览 |
| `VbenAntdVNext` | `/vben-admin/antdv-next` | `IFrameView` | Antd Vue Next 预览 |
| `VbenTDesign` | `/vben-admin/tdesign` | `IFrameView` | TDesign 预览 |
| `VbenAbout` | `/vben-admin/about` | `views/_core/about/index.vue` | 关于页面 |
| `Profile` | `/profile` | `views/_core/profile/index.vue` | 个人中心(隐藏) |

## 5. 布局组件层次

### 5.1 布局组件关系

```
App.vue
├── ElConfigProvider (Element Plus 全局配置)
│   └── <RouterView />
│       ├── BasicLayout (主布局)
│       │   ├── Sidebar (侧边栏菜单)
│       │   ├── Header (顶部导航)
│       │   │   ├── UserDropdown (用户下拉)
│       │   │   └── Notification (通知)
│       │   ├── TabBar (标签页)
│       │   └── Main (内容区域)
│       │       └── <router-view />  → 业务页面
│       │
│       └── AuthPageLayout (认证布局)
│           └── <router-view />  → 登录/注册页面
```

### 5.2 布局定义

| 布局名称 | 文件路径 | 来源 | 用途 |
|---------|---------|------|------|
| `BasicLayout` | `layouts/basic.vue` | 本地包装器 | 配置主应用布局，包含用户下拉、通知、锁屏等插槽 |
| `AuthPageLayout` | `layouts/auth.vue` | 本地包装器 | 配置认证页面布局，简洁的登录/注册界面 |
| `IFrameView` | `@vben/layouts` | 框架包 | 外部链接嵌入视图 |

> **重要说明**：本地 `layouts/basic.vue` 和 `layouts/auth.vue` 是**配置包装器**，它们内部引入了 `@vben/layouts` 包中的实际布局组件，并通过插槽注入自定义内容。

### 5.3 BasicLayout 自定义插槽

```vue
<BasicLayout>
  <template #user-dropdown>  <!-- 用户下拉菜单 -->
  <template #notification>   <!-- 通知组件 -->
  <template #extra>          <!-- 额外内容(登录过期弹窗) -->
  <template #lock-screen>    <!-- 锁屏组件 -->
</BasicLayout>
```

## 6. 视图组件结构

### 6.1 目录组织

```
views/
├── _core/                    # 核心页面（不可删除）
│   ├── about/                # 关于页面
│   │   └── index.vue
│   ├── authentication/       # 认证页面
│   │   ├── login.vue
│   │   ├── code-login.vue
│   │   ├── qrcode-login.vue
│   │   ├── forget-password.vue
│   │   └── register.vue
│   ├── fallback/             # 错误页面
│   │   ├── coming-soon.vue
│   │   ├── forbidden.vue
│   │   ├── internal-error.vue
│   │   ├── not-found.vue
│   │   └── offline.vue
│   └── profile/              # 个人中心
│       ├── index.vue
│       ├── base-setting.vue
│       ├── notification-setting.vue
│       ├── password-setting.vue
│       └── security-setting.vue
│
├── dashboard/                # 仪表盘
│   ├── analytics/
│   │   ├── index.vue
│   │   └── (子组件)
│   └── workspace/
│       └── index.vue
│
└── demos/                    # 演示页面
    ├── element/
    │   └── index.vue
    └── form/
        └── basic.vue
```

### 6.2 Profile 子页面

| 子页面 | 功能 |
|-------|------|
| `index.vue` | 个人中心首页 |
| `base-setting.vue` | 基本设置 |
| `notification-setting.vue` | 通知设置 |
| `password-setting.vue` | 密码修改 |
| `security-setting.vue` | 安全设置 |

## 7. 权限控制机制

### 7.1 路由守卫流程

```typescript
// router/guard.ts
setupAccessGuard(router) {
  beforeEach(async (to, from) => {
    // 1. 核心路由直接放行
    if (coreRouteNames.includes(to.name)) {
      // 已登录访问登录页 → 跳转到首页
      return true;
    }
    
    // 2. 检查 accessToken
    if (!accessStore.accessToken) {
      // 忽略权限的路由 → 放行
      // 其他路由 → 跳转登录页
    }
    
    // 3. 检查是否已生成动态路由
    if (!accessStore.isAccessChecked) {
      // 获取用户信息和角色
      // 调用 generateAccessible 生成权限路由
      // 保存到 accessStore
    }
    
    return true;
  });
}
```

### 7.2 动态路由生成

```typescript
// router/access.ts
async function generateAccess(options) {
  // 自动扫描所有视图组件
  const pageMap = import.meta.glob('../views/**/*.vue');
  
  // 布局组件映射
  const layoutMap = { BasicLayout, IFrameView };
  
  // 调用框架权限生成器
  return await generateAccessible(preferences.app.accessMode, {
    fetchMenuListAsync: getAllMenusApi,  // 从后端获取菜单
    forbiddenComponent,                   // 403页面
    layoutMap,
    pageMap,
    ...options
  });
}
```

### 7.3 权限模式

| 模式 | 说明 |
|------|------|
| `frontend` | 前端配置权限，基于路由 meta 中的 roles |
| `backend` | 后端返回权限菜单，动态生成路由 |
| `mix` | 混合模式，前后端协同控制 |

> **当前项目配置**：项目通过 `preferences.ts` 覆盖配置，未显式设置 `accessMode`，因此使用框架默认配置 `frontend`（定义于 `packages/@core/preferences/src/config.ts`）。

### 7.4 后端API接口

动态路由生成依赖以下后端接口：

| API 接口 | 路径 | 方法 | 返回类型 | 用途 |
|---------|------|------|---------|------|
| `getAllMenusApi` | `/menu/all` | GET | `RouteRecordStringComponent[]` | 获取用户菜单列表 |
| `getUserInfoApi` | `/user/info` | GET | `UserInfo` | 获取用户信息（含角色） |

**API 请求配置**：所有请求通过 `api/request.ts` 中的 `requestClient` 发起，统一处理请求拦截和响应处理。

## 8. 路由 Meta 元信息说明

| 属性 | 类型 | 说明 |
|------|------|------|
| `title` | `string` | 菜单/标签页标题 |
| `icon` | `string \| Component` | 菜单图标 |
| `order` | `number` | 菜单排序（数字越小越靠前） |
| `hideInMenu` | `boolean` | 是否在菜单中隐藏 |
| `hideInBreadcrumb` | `boolean` | 是否在面包屑中隐藏 |
| `hideInTab` | `boolean` | 是否在标签页中隐藏 |
| `affixTab` | `boolean` | 是否固定标签页 |
| `keepAlive` | `boolean` | 是否缓存组件 |
| `ignoreAccess` | `boolean` | 是否忽略权限验证 |
| `badgeType` | `string` | 菜单标记类型（如 `dot`） |
| `link` | `string` | 外部链接地址（配合 IFrameView 使用） |

## 9. 新增路由指南

### 9.1 步骤

1. **创建视图组件**：在 `views/` 目录下创建对应页面
2. **创建路由模块**：在 `router/routes/modules/` 下创建 `.ts` 文件
3. **配置路由**：导出路由数组，定义路径、名称、组件、元信息
4. **自动加载**：路由模块会被 `import.meta.glob` 自动扫描加载

### 9.2 示例

```typescript
// router/routes/modules/example.ts
import type { RouteRecordRaw } from 'vue-router';

const routes: RouteRecordRaw[] = [
  {
    name: 'Example',
    path: '/example',
    meta: {
      icon: 'lucide:folder',
      order: 100,
      title: '示例模块',
    },
    children: [
      {
        name: 'ExampleList',
        path: 'list',
        component: () => import('#/views/example/list.vue'),
        meta: {
          title: '列表页面',
        },
      },
    ],
  },
];

export default routes;
```

## 10. 应用初始化流程

### 10.1 Bootstrap 启动序列

```
main.ts → bootstrap()
           ↓
1. 初始化组件适配器 (initComponentAdapter)
2. 初始化表单组件 (initSetupVbenForm)
3. 创建 Vue 应用实例 (createApp)
4. 注册 Element Plus v-loading 指令
5. 注册 Vben v-spinning 指令
6. 配置国际化 (setupI18n)
7. 配置 Pinia Store (initStores)
8. 注册权限指令 (registerAccessDirective)
9. 初始化 Tippy 工具提示
10. 配置路由 (app.use(router))
11. 配置 Motion 插件
12. 动态更新页面标题
13. 挂载应用 (app.mount('#app'))
```

### 10.2 适配器系统

项目通过 `adapter/` 目录将 Element Plus 组件桥接到 Vben 框架的 Schema 表单系统：

**组件适配器** (`adapter/component/index.ts`)：
- 将 Element Plus 组件异步注册到 `globalShareState`
- 支持的组件：`ApiSelect`, `ApiTreeSelect`, `Checkbox`, `CheckboxGroup`, `DatePicker`, `Divider`, `IconPicker`, `Input`, `InputNumber`, `RadioGroup`, `Select`, `Space`, `Switch`, `TimePicker`, `TreeSelect`, `Upload`
- 提供默认占位符处理 (`withDefaultPlaceholder`)

**表单适配器** (`adapter/form.ts`)：
- 初始化表单组件配置
- 将 Element Plus 表单组件集成到 Vben Form Schema 系统

## 11. 路由相关文件索引

| 文件路径 | 作用 |
|---------|------|
| `router/index.ts` | 创建路由实例，配置 history 模式 |
| `router/routes/index.ts` | 路由聚合，合并核心路由和动态路由 |
| `router/routes/core.ts` | 核心路由定义（登录、根路由、404） |
| `router/routes/modules/*.ts` | 业务模块路由定义 |
| `router/guard.ts` | 路由守卫配置（进度条、权限检查） |
| `router/access.ts` | 动态路由生成逻辑 |
| `layouts/basic.vue` | 主布局包装器（配置插槽内容） |
| `layouts/auth.vue` | 认证布局包装器 |
| `layouts/index.ts` | 布局组件导出 |
| `store/auth.ts` | 认证状态管理（登录、登出、用户信息） |
| `api/core/menu.ts` | 菜单 API 接口 |
| `api/core/user.ts` | 用户信息 API 接口 |
| `api/request.ts` | 请求客户端配置 |
| `adapter/component/index.ts` | Element Plus 组件适配器 |
| `adapter/form.ts` | 表单组件适配器 |
| `bootstrap.ts` | 应用启动入口 |
| `app.vue` | 根组件（Element Plus 全局配置） |
| `preferences.ts` | 项目配置覆盖 |

## 12. 环境变量配置

### 12.1 通用环境变量

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `VITE_APP_TITLE` | `fuxi-hr-manager` | 应用标题 |
| `VITE_APP_NAMESPACE` | `vben-web-ele` | 应用命名空间，用于缓存、store 等功能的前缀 |
| `VITE_APP_STORE_SECURE_KEY` | `please-replace-me-with-your-own-key` | store 加密密钥 |

### 12.2 开发环境变量 (`.env.development`)

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `VITE_PORT` | `5777` | 开发服务器端口 |
| `VITE_BASE` | `/` | 路由基础路径 |
| `VITE_GLOB_API_URL` | `/api` | API 接口地址（开发环境代理） |
| `VITE_NITRO_MOCK` | `true` | 是否开启 Nitro Mock 服务 |
| `VITE_DEVTOOLS` | `false` | 是否打开 devtools |

### 12.3 生产环境变量 (`.env.production`)

| 变量名 | 值 | 说明 |
|-------|-----|------|
| `VITE_BASE` | `/` | 路由基础路径 |
| `VITE_GLOB_API_URL` | `https://mock-napi.vben.pro/api` | API 接口地址 |
| `VITE_COMPRESS` | `none` | 压缩方式（none/brotli/gzip） |
| `VITE_PWA` | `false` | 是否开启 PWA |
| `VITE_ROUTER_HISTORY` | `hash` | Vue Router 模式（hash/history） |
| `VITE_ARCHIVER` | `true` | 打包后是否生成 dist.zip |

### 12.4 路由相关配置

| 变量名 | 影响 |
|-------|------|
| `VITE_BASE` | 路由基础路径，用于 `createWebHistory`/`createWebHashHistory` |
| `VITE_ROUTER_HISTORY` | 路由模式：`hash` 使用 `createWebHashHistory`，其他值使用 `createWebHistory` |
