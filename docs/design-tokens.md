# 业务安全态势系统 Design Tokens

> Token 源文件：`/Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend/src/assets/tokens.css`
> 适用范围：Vue 前端工程全局样式、通用组件、业务 Widget、后续主题扩展。

## 1. 设计定位

本套 token 以 `ui-ux-pro-max` 的以下建议为基线：

- **Pattern**：Real-Time / Operations Landing
- **Style**：Dark Mode (OLED)
- **Density**：高密度但可扫描
- **Product type**：安全态势 / 运维监控 / 指挥驾驶舱

因此 token 的目标不是“消费型品牌官网”，而是：

1. 长时间盯盘不刺眼；
2. 状态色清晰；
3. 面板、图表、列表能共存；
4. 适合继续扩展为企业级组件系统。

---

## 2. Token 分层模型

当前建议采用 4 层：

### 2.1 Primitive Tokens（原始值）

命名：`--ref-*`

作用：只存放最底层不可直接面向业务的颜色原子值。

示例：

- `--ref-color-slate-950`
- `--ref-color-blue-500`
- `--ref-color-cyan-400`
- `--ref-color-red-400`

### 2.2 Semantic Tokens（语义层）

命名：`--sys-*`

作用：表达“页面背景”“主文本”“危险状态”“品牌色”等语义，不表达具体视觉值。

示例：

- `--sys-color-bg-page`
- `--sys-color-text-primary`
- `--sys-color-status-danger`
- `--sys-color-surface-card`

### 2.3 Foundation Tokens（基础尺度层）

命名：

- `--space-*`
- `--radius-*`
- `--shadow-*`
- `--font-*`
- `--motion-*`
- `--z-*`
- `--layout-*`
- `--icon-*`

作用：统一尺寸、排版、圆角、阴影、动效与层级。

### 2.4 Legacy Alias（兼容层）

命名：旧变量别名，如 `--bg-card`、`--text-secondary`

作用：兼容存量组件，帮助逐步迁移。

**原则：新组件不应继续依赖 legacy alias。**

---

## 3. 命名规范

## 3.1 颜色命名

推荐格式：

```css
--sys-color-{category}-{role}
```

例如：

- `--sys-color-text-primary`
- `--sys-color-border-secondary`
- `--sys-color-status-warning-bg`
- `--sys-color-brand-primary-soft`

## 3.2 尺度命名

```css
--space-1 ~ --space-12
--radius-sm ~ --radius-pill
--font-size-12 ~ --font-size-32
```

## 3.3 层级命名

```css
--z-base
--z-sticky
--z-dropdown
--z-overlay
--z-modal
--z-toast
```

---

## 4. 当前 Token 分类说明

## 4.1 颜色：基础色板

| Token | 含义 | 用途 |
|---|---|---|
| `--ref-color-slate-*` | 深色背景阶梯 | 页面背景、面板层级 |
| `--ref-color-blue-500` | 主品牌蓝 | 主品牌强调 |
| `--ref-color-cyan-400` | 辅助品牌青 | 监控感、高亮 |
| `--ref-color-green-400` | 成功色 | 正常、通过、恢复 |
| `--ref-color-orange-400` | 警示色 | 处理中、关注 |
| `--ref-color-red-400` | 危险色 | 告警、高风险、失败 |

## 4.2 语义颜色：页面与表面

| Token | 语义 |
|---|---|
| `--sys-color-bg-page` | 页面主背景 |
| `--sys-color-bg-page-top` | 页面顶部背景过渡 |
| `--sys-color-bg-page-bottom` | 页面底部背景过渡 |
| `--sys-color-surface-1` | 一级表面 |
| `--sys-color-surface-2` | 二级表面 |
| `--sys-color-surface-3` | 轻表面 |
| `--sys-color-surface-card` | 卡片渐变背景 |
| `--sys-color-surface-panel` | 面板表面 |
| `--sys-color-surface-node` | 拓扑节点表面 |
| `--sys-color-surface-region` | 区域卡表面 |
| `--sys-color-surface-timeline` | 时间线内容块表面 |

## 4.3 语义颜色：文本

| Token | 语义 |
|---|---|
| `--sys-color-text-primary` | 主要文本 |
| `--sys-color-text-secondary` | 次要文本 |
| `--sys-color-text-tertiary` | 辅助说明 |
| `--sys-color-text-inverse` | 反白文本 |

## 4.4 语义颜色：边框与线条

| Token | 语义 |
|---|---|
| `--sys-color-border-primary` | 主边框 |
| `--sys-color-border-secondary` | 次边框 |
| `--sys-color-border-strong` | 强边框 / 重点轮廓 |
| `--sys-color-border-table` | 表格分隔线 |
| `--sys-color-border-accent` | hover / active 边框 |
| `--sys-color-border-region` | 区域卡边框 |
| `--sys-color-timeline-line` | 时间线连接线 |
| `--sys-color-line-topology` | 拓扑连线 |

## 4.5 语义颜色：品牌与高亮

| Token | 语义 |
|---|---|
| `--sys-color-brand-primary` | 主品牌色 |
| `--sys-color-brand-secondary` | 辅品牌色 |
| `--sys-color-brand-primary-soft` | 主品牌柔和高亮 |
| `--sys-color-brand-primary-weak` | 主品牌弱高亮 |
| `--sys-color-brand-primary-tint` | 标签/浅底色 |
| `--sys-color-brand-secondary-tint` | 青色浅底 |
| `--sys-color-brand-secondary-soft` | 背景 glow |
| `--sys-color-brand-gradient` | 品牌渐变 |

## 4.6 语义颜色：状态系统

| Token | 场景 |
|---|---|
| `--sys-color-status-success*` | 正常 / 恢复 / 已执行 |
| `--sys-color-status-warning*` | 关注 / 执行中 / 待确认 |
| `--sys-color-status-danger*` | 告警 / 高风险 / 失败 |
| `--sys-color-status-info*` | 监测 / 信息提示 |

说明：状态 token 一般成组出现：

- 主色：`--sys-color-status-danger`
- 背景：`--sys-color-status-danger-bg`
- 边框：`--sys-color-status-danger-border`
- 文本：`--sys-color-status-danger-text`
- 特殊弱态：`--sys-color-status-danger-soft`

## 4.7 排版

| Token 组 | 说明 |
|---|---|
| `--font-family-base` | 基础字体族 |
| `--font-size-*` | 字号体系 |
| `--font-weight-*` | 字重体系 |
| `--line-height-*` | 行高体系 |
| `--letter-spacing-*` | 字距体系 |

建议：

- 页面正文不低于 `14px`；
- 核心正文优先 `16px`；
- 指标数字使用 `24px` / `32px`；
- 次级说明统一使用 `--sys-color-text-secondary`。

## 4.8 间距

当前采用近似 4px 基准的节奏体系。

| Token | 数值 |
|---|---|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-4` | 12px |
| `--space-6` | 16px |
| `--space-10` | 24px |
| `--space-12` | 32px |

建议：

- 组件内间距优先落在 `8 / 12 / 16`；
- 卡片内边距优先 `16 / 18 / 24`；
- 页面块级间距优先 `18 / 24 / 32`。

## 4.9 圆角、阴影、动效

### 圆角

- `--radius-sm`：紧凑控件
- `--radius-md`：内容块
- `--radius-lg`：卡片 / 节点
- `--radius-xl`：主卡容器
- `--radius-pill`：状态 badge / tag

### 阴影

- `--shadow-sm`：局部节点
- `--shadow-md`：主卡片
- `--shadow-focus`：焦点状态

### 动效

- `--motion-duration-fast`：160ms
- `--motion-duration-base`：240ms
- `--motion-duration-slow`：320ms

遵循规则：

- 交互反馈控制在 `150ms ~ 300ms`；
- 优先 opacity / color / shadow 过渡；
- 避免大范围布局抖动动画；
- 必须兼容 `prefers-reduced-motion`。

## 4.10 层级与布局

### z-index

| Token | 用途 |
|---|---|
| `--z-base` | 默认层 |
| `--z-sticky` | 吸顶层 |
| `--z-dropdown` | 下拉层 |
| `--z-overlay` | 遮罩层 |
| `--z-modal` | 弹窗层 |
| `--z-toast` | 消息提示层 |

### 布局

| Token | 用途 |
|---|---|
| `--layout-sidebar-width` | 桌面导航宽度 |
| `--layout-sidebar-width-collapsed` | 折叠导航宽度 |
| `--layout-page-padding` | 桌面页面边距 |
| `--layout-page-padding-mobile` | 移动端页面边距 |
| `--layout-grid-gap` | 页面网格间距 |
| `--layout-card-gap` | 卡片间距 |

---

## 5. 使用规则

## 5.1 组件只能消费语义 token

**正确：**

```css
.card-title {
  color: var(--sys-color-text-primary);
  border-color: var(--sys-color-border-primary);
}
```

**错误：**

```css
.card-title {
  color: #f3f8ff;
  border-color: rgba(91, 151, 255, 0.24);
}
```

## 5.2 不在组件里临时“调一个差不多的颜色”

如果某个组件样式没有现成 token，应先：

1. 在 `tokens.css` 增加语义 token；
2. 再在组件中引用。

## 5.3 状态色必须成组使用

例如危险状态不要只写主色，而要同时考虑：

- 文本颜色；
- 背景颜色；
- 边框颜色；
- hover / active / disabled 状态。

## 5.4 尽量不要直接使用 legacy alias

例如：

- `--text-secondary`
- `--bg-card`

这些变量可以暂时保留给旧组件，但新组件应直接使用 `--sys-*`。

---

## 6. Vue 项目中的推荐落地方式

## 6.1 全局引入顺序

当前入口已经按正确顺序引入：

1. `tokens.css`
2. `main.css`

对应文件：

- `/Users/bingham/Documents/Project/业务安全态势系统_项目资料/frontend/src/main.ts`

## 6.2 组件样式写法建议

```vue
<style scoped>
.widget-card {
  padding: var(--space-6);
  border-radius: var(--radius-lg);
  background: var(--sys-color-surface-panel);
  border: 1px solid var(--sys-color-border-secondary);
  color: var(--sys-color-text-primary);
}
</style>
```

## 6.3 JS / TS 中的使用建议

如果后续需要把 token 同步到 ECharts、Canvas 或配置对象，可考虑：

- 建立 `theme.ts`；
- 通过 `getComputedStyle(document.documentElement)` 读取 CSS 变量；
- 或直接维护一份与 CSS token 对应的 TS 映射。

---

## 7. 后续建议新增的 Token 方向

随着项目继续工程化，建议补充以下 token：

### 7.1 组件级 token

- Button（primary / secondary / danger / ghost）
- Input / Select / DateRangePicker
- Tabs / Segmented Control
- Tooltip / Popover / Modal
- Skeleton / Empty / Error State

### 7.2 数据可视化 token

- 图表网格线透明度
- tooltip surface
- legend text
- 区间阈值色带
- 节点选中态 / hover 态

### 7.3 多主题能力

后续可以扩展为：

- `:root[data-theme="dark"]`
- `:root[data-theme="light"]`
- `:root[data-density="compact"]`
- `:root[data-mode="wallboard"]`

这样可以支持：

- 标准桌面版
- 紧凑运维版
- 大屏展示版
- 轻量巡检版

---

## 8. 当前结论

当前这套 token 已经可以支撑：

- 项目继续做页面开发；
- 组件视觉统一；
- 业务状态语义统一；
- 后续接入更多图表与表单组件；
- 后续做深浅主题与模式切换。

如果继续推进，我建议下一步直接做：

1. `BaseIcon` + SVG 图标体系；
2. `BaseButton / BaseTag / BaseStatus / BaseEmpty / BaseSkeleton`；
3. ECharts 主题 token 化；
4. Dashboard 的 filter bar 与局部刷新交互标准化。
