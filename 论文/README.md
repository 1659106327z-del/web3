# 毕业论文生成脚本

按江西农业大学本科毕业论文（设计）撰写要求（附件 1/2）排版的 Word 论文生成器。

## 文件结构

```
论文/
├── build_thesis.py        // 主脚本：定义页面 / 样式 / 编排
├── content/
│   ├── front.py           // 封面 / 摘要 / Abstract
│   ├── ch1_intro.py       // 第 1 章 绪论
│   ├── ch2_tech.py        // 第 2 章 相关技术与理论基础
│   ├── ch3_req.py         // 第 3 章 需求分析
│   ├── ch4_design.py      // 第 4 章 系统设计
│   ├── ch5_impl.py        // 第 5 章 系统实现
│   ├── ch6_test.py        // 第 6 章 测试与性能评估
│   ├── ch7_summary.py     // 第 7 章 总结与展望
│   └── back.py            // 参考文献 + 致谢
└── 基于Web的操作系统进程调度算法可视化演示系统的设计与开发.docx  // 输出
```

## 使用

```bash
pip install python-docx     # 仅首次
python 论文/build_thesis.py
```

输出文件位于 `论文/` 目录下，可直接用 Microsoft Word 打开。

## 排版规范

- 页面：A4 纵向，页边距 上 2.5 / 下 2.5 / 左 2.8 / 右 2.5 cm
- 一级标题：黑体四号
- 二级标题：黑体小四号
- 三级标题：宋体小四号
- 正文：宋体小四号，行距固定值 20 磅，首行缩进 2 字符
- 数字与英文：Times New Roman 小四号
- 参考文献：宋体五号，悬挂缩进 1.5 字符
- 页码：Times New Roman 五号居中
