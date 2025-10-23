#!/usr/bin/env python3
"""绘制 ReAct 工作流程图"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import matplotlib.lines as mlines

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

fig, ax = plt.subplots(1, 1, figsize=(14, 8))
ax.set_xlim(0, 14)
ax.set_ylim(0, 8)
ax.axis('off')

# 颜色定义
llm_color = '#E3F2FD'
env_color = '#F3E5F5'
thought_color = '#FFF9C4'
action_color = '#FFECB3'
pause_color = '#FFCDD2'
tool_color = '#E1BEE7'
obs_color = '#C5CAE9'
final_color = '#C8E6C9'

# LLM 层外框
llm_box = FancyBboxPatch((0.5, 4.5), 13, 3, 
                         boxstyle="round,pad=0.1", 
                         edgecolor='#1976D2', 
                         facecolor=llm_color, 
                         linewidth=2)
ax.add_patch(llm_box)
ax.text(7, 7.3, 'LLM', fontsize=14, weight='bold', ha='center')

# 执行环境外框
env_box = FancyBboxPatch((0.5, 0.5), 13, 3.5, 
                         boxstyle="round,pad=0.1", 
                         edgecolor='#7B1FA2', 
                         facecolor=env_color, 
                         linewidth=2)
ax.add_patch(env_box)
ax.text(7, 3.7, '人类/执行环境', fontsize=14, weight='bold', ha='center')

# LLM 层的节点
def draw_node(x, y, width, height, text, color):
    node = FancyBboxPatch((x-width/2, y-height/2), width, height,
                          boxstyle="round,pad=0.05",
                          edgecolor='#333',
                          facecolor=color,
                          linewidth=1.5)
    ax.add_patch(node)
    ax.text(x, y, text, fontsize=11, ha='center', va='center', weight='bold')

# Input
draw_node(1.5, 6.5, 1.5, 0.8, 'Input', thought_color)

# Thought
draw_node(3.5, 6.5, 1.5, 0.8, 'Thought', thought_color)

# Action
draw_node(6, 6.5, 1.5, 0.8, 'Action', action_color)

# Action Input
draw_node(8.5, 6.5, 1.8, 0.8, 'Action\nInput', action_color)

# PAUSE
draw_node(11.5, 6.5, 1.5, 0.8, 'PAUSE', pause_color)

# 执行环境的节点
# 工具执行
draw_node(11.5, 2.5, 1.8, 0.8, '工具执行', tool_color)

# Observation
draw_node(8.5, 2.5, 2, 0.8, 'Observation', obs_color)

# Final Answer
draw_node(3.5, 1.2, 2.2, 0.8, 'Final Answer', final_color)

# 绘制箭头
def draw_arrow(x1, y1, x2, y2, style='solid', color='#333'):
    arrow = FancyArrowPatch((x1, y1), (x2, y2),
                           arrowstyle='->', 
                           mutation_scale=20,
                           linewidth=2,
                           color=color,
                           linestyle=style)
    ax.add_patch(arrow)

# LLM 层内部流程
draw_arrow(2.25, 6.5, 2.75, 6.5)  # Input -> Thought
draw_arrow(4.25, 6.5, 5.25, 6.5)  # Thought -> Action
draw_arrow(6.75, 6.5, 7.6, 6.5)   # Action -> Action Input
draw_arrow(9.4, 6.5, 10.75, 6.5)  # Action Input -> PAUSE

# PAUSE 到工具执行
draw_arrow(11.5, 6.1, 11.5, 2.9, color='#7B1FA2')

# 工具执行到 Observation
draw_arrow(10.6, 2.5, 9.5, 2.5, color='#7B1FA2')

# Observation 回到 Thought (循环)
# 先向下，再向左，再向上
ax.plot([8.5, 8.5], [2.1, 1.5], 'k-', linewidth=2, color='#1976D2')
ax.plot([8.5, 3.5], [1.5, 1.5], 'k-', linewidth=2, color='#1976D2')
ax.plot([3.5, 3.5], [1.5, 4.0], 'k-', linewidth=2, color='#1976D2')
# 箭头
draw_arrow(3.5, 4.0, 3.5, 6.1, color='#1976D2')

# Thought 到 Final Answer (虚线，表示条件判断)
ax.plot([3.5, 3.5], [6.1, 1.6], 'k--', linewidth=2, color='#4CAF50', alpha=0.7)
draw_arrow(3.5, 1.8, 3.5, 1.6, color='#4CAF50')

# 添加文字说明
ax.text(12.5, 4.3, '①', fontsize=16, weight='bold', color='#7B1FA2')
ax.text(10, 2.8, '②', fontsize=16, weight='bold', color='#7B1FA2')
ax.text(6, 1.5, '③ 循环', fontsize=12, weight='bold', color='#1976D2')
ax.text(4.5, 4, '④ 完成', fontsize=12, weight='bold', color='#4CAF50')

plt.tight_layout()
plt.savefig('/Users/youxingzhi/ayou/Geek03/js/doc/images/react-workflow.png', 
            dpi=300, bbox_inches='tight', facecolor='white')
print("✅ 流程图已生成：/Users/youxingzhi/ayou/Geek03/js/doc/images/react-workflow.png")


