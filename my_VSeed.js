// 实现对矩形树图、旭日图和嵌套圆图的数据重构


// const vseed = {
//     "dataset": [
//         { "country": "A", "region": 1, "name": "Office Supplies", value: 824 },
//         { "country": "A", "region": 1, "name": "Furniture", value: 920 },
//         { "country": "A", "region": 1, "name": "Electronic equipment", value: 936 },
//         { "country": "A", "region": 2, "name": "Office Supplies", value: 345 },
//         { "country": "A", "region": 2, "name": "Furniture", value: 728 },
//         { "country": "A", "region": 2, "name": "Electronic equipment", value: 656 },
//         { "country": "A", "region": 3, "name": "Office Supplies", value: 887 },
//         { "country": "A", "region": 3, "name": "Furniture", value: 577 },
//         { "country": "A", "region": 3, "name": "Electronic equipment", value: 545 },
//         { "country": "B", "region": 1, "name": "Office Supplies", value: 650 },
//         { "country": "B", "region": 1, "name": "Furniture", value: 780 },
//         { "country": "B", "region": 1, "name": "Electronic equipment", value: 890 },
//         { "country": "B", "region": 2, "name": "Office Supplies", value: 420 },
//         { "country": "B", "region": 2, "name": "Furniture", value: 560 },
//         { "country": "B", "region": 2, "name": "Electronic equipment", value: 720 },
//         { "country": "B", "region": 3, "name": "Office Supplies", value: 950 },
//         { "country": "B", "region": 3, "name": "Furniture", value: 680 },
//         { "country": "B", "region": 3, "name": "Electronic equipment", value: 830 },
//         { "country": "C", "region": 1, "name": "Office Supplies", value: 720 },
//         { "country": "C", "region": 1, "name": "Furniture", value: 850 },
//         { "country": "C", "region": 1, "name": "Electronic equipment", value: 960 },
//         { "country": "C", "region": 2, "name": "Office Supplies", value: 380 },
//         { "country": "C", "region": 2, "name": "Furniture", value: 640 },
//         { "country": "C", "region": 2, "name": "Electronic equipment", value: 580 },
//         { "country": "C", "region": 3, "name": "Office Supplies", value: 1100 },
//         { "country": "C", "region": 3, "name": "Furniture", value: 890 },
//         { "country": "C", "region": 3, "name": "Electronic equipment", value: 750 },
//     ],
// }
const vseed = {
    chartType: 'treemap',
    dataset: [
        { value: 100 },
        { value: 200 },
        { value: 150 }
    ]
};


// 全局变量存储当前图表实例
let currentChart = null;

// 渲染图表的函数
function renderChart(chartType) {
    // 销毁之前的图表
    if (currentChart) {
        currentChart.release();
    }

    // 清空容器
    document.getElementById('chart').innerHTML = '';

    // 构建 vseed，继承所有可选配置
    const chartVSeed = {
        ...vseed,              // 继承所有字段
        chartType: chartType   // 覆盖 chartType
    };

    // 生成 spec 并渲染
    const spec = HierarchyBuilder.from(chartVSeed).build();
    console.log(`${chartType} Spec:`, JSON.stringify(spec, null, 2));

    currentChart = new VChart.VChart(spec, { dom: 'chart' });
    currentChart.renderSync();
}

// 添加按钮事件监听
document.getElementById('btn-treemap').addEventListener('click', () => {
    renderChart('treemap');
});

document.getElementById('btn-sunburst').addEventListener('click', () => {
    renderChart('sunburst');
});

document.getElementById('btn-circlepacking').addEventListener('click', () => {
    renderChart('circlePacking');
});

// 默认显示 treemap
renderChart('treemap');