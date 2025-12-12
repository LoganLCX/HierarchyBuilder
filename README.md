# HierarchyBuilder

一个用于构建层次化可视化图表的数据转换工具，支持 TreeMap、Sunburst 和 Circle Packing 等多种图表类型。基于 VSeed 的 pipeline 模式设计，轻松将扁平数据转换为层次化结构。

##  特性

- **多图表支持**：支持 TreeMap、Sunburst、Circle Packing 三种层次化图表
- **自动转换**：自动识别数据字段，智能构建层次结构
- **灵活配置**：支持自定义颜色方案、标签样式等
- **数据聚合**：自动处理数据聚合和父节点计算
- **Pipeline 设计**：基于 VSeed 的 pipeline 模式，易于扩展

##  安装

项目依赖 VChart 和 VSeed：

```bash
npm install
```

依赖包：
- @visactor/vchart: ^2.0.10
- @visactor/vseed: ^0.2.2

## 快速开始

### 基本用法

```javascript
// 1. 准备扁平数据
const dataset = [
    { category: 'A', subcategory: 'A1', value: 100 },
    { category: 'A', subcategory: 'A2', value: 200 },
    { category: 'B', subcategory: 'B1', value: 150 }
];

// 2. 配置 vseed
const vseed = {
    chartType: 'treemap',
    dataset: dataset,
    dimensions: ['category', 'subcategory'],
    measure: 'value'
};

// 3. 生成图表规范
const spec = HierarchyBuilder.from(vseed).build();

// 4. 使用 VChart 渲染
const vchart = new VChart(spec, { dom: 'chart' });
vchart.renderAsync();
```

### TreeMap 示例

```javascript
const vseed = {
    chartType: 'treemap',
    dataset: salesData,
    dimensions: ['region', 'category', 'product'], // 可选
    measure: 'sales' // 可选
};

const spec = HierarchyBuilder.from(vseed).build();
const vchart = new VChart(spec, { dom: 'chart' });
vchart.renderAsync();
```

### Sunburst 示例

```javascript
const vseed = {
    chartType: 'sunburst',
    dataset: organizationData,
    dimensions: ['department', 'team', 'employee'],
    measure: 'headcount'
};

const spec = HierarchyBuilder.from(vseed).build();
const vchart = new VChart(spec, { dom: 'chart' });
vchart.renderAsync();
```

### Circle Packing 示例

```javascript
const vseed = {
    chartType: 'circlePacking',
    dataset: fileSystemData,
    dimensions: ['folder', 'subfolder', 'file'],
    measure: 'size'
};

const spec = HierarchyBuilder.from(vseed).build();
const vchart = new VChart(spec, { dom: 'chart' });
vchart.renderAsync();
```

##  配置选项

### 必填参数

| 参数 | 类型 | 说明 |
|------|------|------|
| chartType | string | 图表类型：'treemap', 'sunburst', 'circlePacking' |
| dataset | Array | 扁平数据数组 |

### 可选参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| dimensions | Array | 按原始顺序自动识别 | 可指定使用的dimensions及其顺序 |
| measure | string | 最后一个数值字段 | 可指定数值字段 |
| colorScheme | Object | 默认配色 | 颜色方案配置 |
| drill | Bool | true | 默认开启下钻 |
| showParentNodes | Bool | true | treemap默认显示父类 |

### 颜色方案配置

```javascript
const vseed = {
    // ...其他配置
    colorScheme: {
        type: 'ordinal',
        range: [
            '#8D72F6', '#5766EC', '#66A3FE', '#51D5E6',
            '#4EC0B3', '#F9DF90', '#F9AD71', '#ED8888'
        ]
    }
};
```

## 项目结构

```
HierarchyBuilder/
├── HierarchyBuilder.js          # 核心转换库
├── my_VSeed.js                  # VSeed 辅助文件
├── my_VSeed.html                # VSeed 示例页面
├── package.json                 # 项目配置
├── demos/                       # 示例文件
│   ├── ……
└── lib/                        # 依赖库
```

##  工作原理

HierarchyBuilder 使用 pipeline 模式处理数据：

1. **initAdvancedVSeed** - 初始化和验证输入
2. **identifyFields** - 识别维度和度量字段
3. **buildMeasures** - 构建度量配置
4. **buildDimensions** - 构建维度配置
5. **buildColorConfig** - 配置颜色方案
6. **buildLabelConfig** - 配置标签样式
7. **transformData** - 将扁平数据转换为层次结构
8. **buildChartSpec** - 生成 VChart 图表规范

##  数据格式

### 输入数据（扁平格式）

```javascript
[
    { region: 'North', category: 'Electronics', product: 'Laptop', sales: 5000 },
    { region: 'North', category: 'Electronics', product: 'Phone', sales: 3000 },
    { region: 'South', category: 'Furniture', product: 'Desk', sales: 2000 }
]
```

### 输出数据（层次格式）

```javascript
{
    name: 'root',
    children: [
        {
            name: 'North',
            children: [
                {
                    name: 'Electronics',
                    children: [
                        { name: 'Laptop', value: 5000 },
                        { name: 'Phone', value: 3000 }
                    ]
                }
            ]
        },
        // ...
    ]
}
```

##  相关链接

- [VChart 官方文档](https://www.visactor.io/vchart)
- [VSeed 官方文档](https://www.visactor.io/vseed)