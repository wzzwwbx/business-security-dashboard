#!/usr/bin/env python3
# 业务安全态势系统 — 演示 PPT 生成脚本
# 产出:
#   docs/演示/业务安全态势系统.pptx   综合演示 deck（7 页）
#   docs/演示/业务态势.pptx           业务主题单页（与 deck 内业务页一致）
# 设计风格延续原 PPT：深蓝底 1A2B4A / 主蓝 1E508C / 绿勾 2E7D32 / 微软雅黑
import os
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

DEMO = os.path.normpath(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '演示'))

BG    = RGBColor(0x1A, 0x2B, 0x4A)
BG2   = RGBColor(0x23, 0x3B, 0x63)
ACC   = RGBColor(0x1E, 0x50, 0x8C)
GREEN = RGBColor(0x2E, 0x7D, 0x32)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
SUB   = RGBColor(0x9F, 0xB3, 0xCC)
FONT  = 'Microsoft YaHei'
W, H = 10.0, 7.5

prs = Presentation()
prs.slide_width  = Inches(W)
prs.slide_height = Inches(H)
BLANK = prs.slide_layouts[6]

def bg(slide, color=BG):
    slide.background.fill.solid()
    slide.background.fill.fore_color.rgb = color

def rect(slide, x, y, w, h, color=ACC):
    sp = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    sp.fill.solid(); sp.fill.fore_color.rgb = color
    sp.line.fill.background()
    sp.shadow.inherit = False
    return sp

def txt(slide, x, y, w, h, runs, size=15, color=WHITE, bold=False, align=PP_ALIGN.LEFT, spacing=1.0):
    """runs: list of (text, color, bold) or str"""
    tb = slide.shapes.add_textbox(Inches(x), Inches(y), Inches(w), Inches(h))
    tf = tb.text_frame
    tf.word_wrap = True
    tf.margin_left = tf.margin_right = tf.margin_top = tf.margin_bottom = 0
    if isinstance(runs, str):
        runs = [(runs, color, bold)]
    first = True
    for text, c, b in runs:
        p = tf.paragraphs[0] if first else tf.add_paragraph()
        first = False
        p.line_spacing = spacing
        p.alignment = align
        r = p.add_run(); r.text = text
        r.font.size = Pt(size); r.font.bold = b
        r.font.color.rgb = c; r.font.name = FONT
    return tb

def bullets(slide, x, y, w, items, size=13, gap=0.36, mark='✓ '):
    y0 = y
    for text in items:
        txt(slide, x, y0, w, 0.35,
            [(mark, GREEN, True), (text, WHITE, False)], size=size)
        y0 += gap
    return y0

def header(slide, title, subtitle):
    txt(slide, 0.6, 0.22, 8.0, 0.5, title, size=25, bold=True)
    txt(slide, 0.6, 0.68, 8.8, 0.35, subtitle, size=13, color=SUB)
    rect(slide, 0.6, 1.02, 2.2, 0.045)

def shot(slide, name, x, y, w, h=None):
    if h is None:
        h = w * 9 / 16
    path = os.path.join(DEMO, f'{name}-1920.png')
    slide.shapes.add_picture(path, Inches(x), Inches(y), Inches(w), Inches(h))

# ---------------------------------------------------------------- slide 1 封面
s = prs.slides.add_slide(BLANK); bg(s)
rect(s, 0, 0, W, 0.12, ACC)
txt(s, 0.6, 2.05, 5.0, 1.0, '业务安全态势系统', size=44, bold=True)
txt(s, 0.6, 3.0, 5.4, 0.5, '综合 · 安全 · 业务 · 终端 · 运维 五维态势', size=18, color=SUB)
txt(s, 0.6, 3.5, 5.4, 0.4, '多源接入版 · 全流程演示', size=14, color=SUB)
shot(s, 'overview', 5.35, 1.55, 4.1)
rect(s, 0, 6.55, W, 0.75, BG2)
txt(s, 0.6, 6.68, 8.8, 0.5,
    '前端 Vue 3 + TypeScript + Vite + ECharts ｜ 后端 Spring Boot 3 + Java 17 ｜ 数据库 MySQL 8 ｜ 探针 /proc 采集 ｜ nginx 部署',
    size=12, color=SUB)

# ---------------------------------------------------------------- slide 2 综合态势
s = prs.slides.add_slide(BLANK); bg(s)
header(s, '综合态势', '统一联动态势与处置闭环 · 四域汇聚')
bullets(s, 0.6, 1.15, 8.8, [
    '四域汇聚：安全、业务、终端、运维数据统一接入（128 万事件），全局指标一键总览；',
    '联动图：综合态势联动图集中呈现四域状态、风险链路与处置进展，支持下钻；',
    '处置闭环：近七日告警趋势、处置漏斗与接入资源概览形成研判-处置闭环。'])
shot(s, 'overview', 0.6, 2.35, 8.8)

# ---------------------------------------------------------------- slide 3 安全态势
s = prs.slides.add_slide(BLANK); bg(s)
header(s, '安全态势', '攻击面 · 风险链路 · 处置闭环（安全保密中心）')
bullets(s, 0.6, 1.15, 8.8, [
    '攻击面：高危告警 4 起、异常账号 6 个、高风险终端 6 台、敏感导出 2 次，策略命中率 96.8%；',
    '行为模型：规则 + KNN + LSTM 综合检出率 94.6%，高风险用户 12 人零信任管控；',
    '处置闭环：闭环率 85%，敏感导出叠加账号/终端风险形成优先处置链路。'])
shot(s, 'security', 0.6, 2.35, 8.8)

# ---------------------------------------------------------------- slide 4 业务态势
s = prs.slides.add_slide(BLANK); bg(s)
header(s, '业务态势', '密信 / 签阅 / 境外通联 · 服务依赖、链路健康与恢复保障')
bullets(s, 0.6, 1.15, 8.8, [
    '业务量：核心业务 132 万、成功率 99.3%、高峰时延 420ms，文件传输 8.6TB；',
    '链路健康：签批链路高峰响应与写入积压联动监测，告警自动生成保障建议；',
    '境外通联：共享链路上下行速率、利用率与累计流量监测，国家流量占比可视化。'])
shot(s, 'business', 0.6, 2.35, 8.8)

# ---------------------------------------------------------------- slide 5 终端态势
s = prs.slides.add_slide(BLANK); bg(s)
header(s, '终端态势', '终端资产 · 人员关联 · 保障状态（终端保障中心）')
bullets(s, 0.6, 1.15, 8.8, [
    '终端资产：在线终端 131 台、移动终端 48 台，全球按国家聚合展示；',
    '人员关联：归属确认率 93%，终端与责任人员对应，区域可下钻明细；',
    '风险处置：高风险终端 6 台、异常事件 18 条、策略命中率 96%。'])
shot(s, 'terminal', 0.6, 2.35, 8.8)

# ---------------------------------------------------------------- slide 6 运维态势
s = prs.slides.add_slide(BLANK); bg(s)
header(s, '运维态势', '真实运维域 · Probe / External / Manual 多源接入（/ops）')
bullets(s, 0.6, 1.15, 8.8, [
    '多源接入：Java Probe 经 /api/ops/ingest 统一接入，支持 external/manual 补录；',
    '主机纳管：在线主机 168 台，主机列表、详情与趋势联动，TopN/白名单进程分析；',
    '告警闭环：最新告警实时上屏，总览卡片与来源概览呈现整体态势。'])
shot(s, 'ops', 0.6, 2.35, 8.8)

# ---------------------------------------------------------------- slide 7 登录与三员分立
s = prs.slides.add_slide(BLANK); bg(s)
header(s, '登录与三员分立（IAM）', '演示模式免登录，完整闭环支持三员分立权限管控')
shot(s, 'login', 0.6, 1.35, 4.7)
bullets(s, 5.7, 1.45, 4.2, [
    '演示模式：当前构建为 preview 免登录，打开即看，接口未登录时自动回退演示数据；',
    '完整闭环：/bootstrap 初始化 sysadmin、secadmin、auditadmin 三员账户；',
    '权限裁剪：登录后按角色裁剪导航与页面权限，/system 提供账户治理、角色权限、审批与审计；',
    '数据策略：接口联调 → Mock 回退 → 本地 Mock 三级策略，页面实时提示数据来源。'],
    size=12.5, gap=0.5)
txt(s, 0.6, 6.85, 8.8, 0.4,
    '注：全部演示数据为模拟场景，与后端空库自动灌入的演示数据口径一致。',
    size=11, color=SUB)

prs.save(os.path.join(DEMO, '业务安全态势系统.pptx'))
print('OK 业务安全态势系统.pptx', len(prs.slides.__iter__.__self__._sldIdLst), 'slides')

# ---------------------------------------------------------------- 业务态势.pptx（单页业务主题，沿用原版式）
prs2 = Presentation()
prs2.slide_width = Inches(W); prs2.slide_height = Inches(H)
s = prs2.slides.add_slide(prs2.slide_layouts[6]); bg(s)
rect(s, 0, 0, W, 0.12, ACC)
txt(s, 0.6, 0.3, 8.9, 0.4, '业务态势　·　密信 / 签阅 / 境外通联', size=22, bold=True)
txt(s, 0.6, 0.8, 8.9, 0.3,
    '业务主题态势聚焦密信传输、签阅流转与境外通联三大核心业务，提供业务量统计、流转状态追踪与链路健康监测。',
    size=13, color=SUB)
bullets(s, 0.6, 1.2, 8.6, [
    '密信态势：用户登录/登出状态监测，消息与文件收发量统计，分时趋势及国家排行实时展示；',
    '签阅态势：收到、已处理、待处理、异常/退回流转状态统计，处理趋势及国家排行可视化；',
    '境外通联：共享链路（50 Mbps）上下行速率、利用率、累计流量与峰值监测，国家流量占比展示。'],
    size=13, gap=0.45)
rect(s, 0.6, 2.85, 8.9, 0.02, BG2)
shot(s, 'business', 1.7, 3.05, 6.6)
txt(s, 0.6, 6.85, 8.9, 0.4,
    '数据为模拟演示场景，与综合态势页口径一致：业务量 132 万、成功率 99.3%、高峰时延 420ms、文件传输 8.6TB；链路利用率 = max(上下行) / 50 Mbps。',
    size=10.5, color=SUB)
prs2.save(os.path.join(DEMO, '业务态势.pptx'))
print('OK 业务态势.pptx')
