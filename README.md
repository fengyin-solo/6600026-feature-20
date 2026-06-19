# solo-6600026: 基因序列比对与进化树可视化

## 技术栈
- Vue 3 + TypeScript + Vite + Pinia + Tailwind CSS + Canvas 2D

## 核心特性
1. **Needleman-Wunsch 全局比对**：动态规划全局序列比对算法
2. **Smith-Waterman 局部比对**：动态规划局部序列比对算法
3. **Canvas 碱基着色矩阵**：A=绿/T=红/G=蓝/C=黄 彩色比对显示
4. **Neighbor-Joining 进化树**：基于距离矩阵构建系统发育树
5. **GC 含量滑动窗口分析**：基因序列 GC 含量分布图
6. **5 条 Mock DNA 序列**：人类/黑猩猩/大猩猩/小鼠/斑马鱼 COI 基因片段
