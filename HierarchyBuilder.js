// HierarchyBuilder - 支持 treemap, sunburst, circlePacking 的数据转换
// 参考 VSeed 的 pipeline 模式设计

// ==================== Pipeline 函数 ====================

// Advanced Pipeline - 数据预处理
const initAdvancedVSeed = (advancedVSeed, context) => {
    const { vseed } = context;
    const { chartType, dataset } = vseed;

    if (!chartType) throw new Error('chartType is required');
    if (!dataset || dataset.length === 0) throw new Error('dataset is required and must not be empty');

    return {
        ...advancedVSeed,
        chartType,
        dataset
    };
};

const identifyFields = (advancedVSeed, context) => {
    const { vseed } = context;
    const { dataset } = advancedVSeed;
    const sample = dataset[0];
    const allFields = Object.keys(sample);

    // 识别所有数值字段
    const numericFields = allFields.filter(field =>
        typeof sample[field] === 'number'
    );

    if (numericFields.length === 0) {
        throw new Error('Dataset must have at least one numeric field');
    }

    // 确定 measure 字段（用于表示 value）
    let measureField;
    if (vseed.measure) {
        // 用户指定了 measure
        measureField = vseed.measure;
        if (!numericFields.includes(measureField)) {
            throw new Error(`Specified measure field "${measureField}" is not a numeric field`);
        }
    } else {
        // 默认使用最后一个数值字段
        measureField = numericFields[numericFields.length - 1];
    }

    // 确定维度字段
    let dimensionFields;
    if (vseed.dimensions && Array.isArray(vseed.dimensions)) {
        // 用户指定了 dimensions，只使用指定的
        dimensionFields = vseed.dimensions;

        // 验证：确保指定的维度字段存在且不是 measure
        dimensionFields.forEach(field => {
            if (!allFields.includes(field)) {
                throw new Error(`Specified dimension "${field}" does not exist in dataset`);
            }
            if (field === measureField) {
                throw new Error(`Dimension "${field}" cannot be the measure field`);
            }
        });
    } else {
        // 默认：所有非 measure 字段，按原始顺序
        dimensionFields = allFields.filter(field => field !== measureField);
    }

    if (dimensionFields.length === 0) {
        throw new Error('Must have at least one dimension field');
    }

    console.log('字段识别结果:', {
        allFields,
        numericFields,
        measureField,
        dimensionFields
    });

    return {
        ...advancedVSeed,
        dimensionFields,
        measureField,
        numericFields
    };
};

const buildMeasures = (advancedVSeed, context) => {
    const { measureField } = advancedVSeed;

    // 只有一个 measure
    const measures = [{
        id: measureField,
        alias: measureField
    }];

    return {
        ...advancedVSeed,
        measures
    };
};

const buildDimensions = (advancedVSeed, context) => {
    const { dimensionFields } = advancedVSeed;

    // dimensionFields 已经是正确的顺序（在 identifyFields 中确定）
    const dimensions = dimensionFields.map(field => ({
        id: field,
        alias: field
    }));

    console.log('维度配置:', dimensions);

    return {
        ...advancedVSeed,
        dimensions
    };
};

const buildColorConfig = (advancedVSeed, context) => {
    const { vseed } = context;

    // 用户自定义颜色 > 默认颜色
    const colorScheme = vseed.colorScheme || {
        type: 'ordinal',
        range: [
            '#8D72F6', '#5766EC', '#66A3FE', '#51D5E6',
            '#4EC0B3', '#F9DF90', '#F9AD71', '#ED8888',
            '#E9A0C3', '#D77DD3'
        ]
    };

    return {
        ...advancedVSeed,
        colorScheme
    };
};

const buildLabelConfig = (advancedVSeed, context) => {
    const { vseed } = context;

    // 用户自定义标签 > 默认标签
    const labelConfig = vseed.label || {
        visible: true,
        style: {
            fontSize: 12
        }
    };

    return {
        ...advancedVSeed,
        labelConfig
    };
};

// Spec Pipeline - 生成 VChart 配置
const buildTreeData = (spec, context) => {
    const { advancedVSeed } = context;
    const { dataset, dimensions, measureField } = advancedVSeed;

    // 递归构建树结构
    const buildTree = (data, dimIndex) => {
        if (dimIndex >= dimensions.length) {
            // 已经处理完所有维度
            return null;
        }

        const currentDim = dimensions[dimIndex].id;
        const grouped = {};

        // 按当前维度分组
        data.forEach(row => {
            const key = String(row[currentDim]);
            if (!grouped[key]) {
                grouped[key] = [];
            }
            grouped[key].push(row);
        });

        // 构建子节点
        return Object.keys(grouped).map(key => {
            const group = grouped[key];

            if (dimIndex === dimensions.length - 1) {
                // 最后一层维度，聚合 measure 值
                const totalValue = group.reduce((sum, row) => sum + row[measureField], 0);
                return {
                    name: key,
                    value: totalValue
                };
            } else {
                // 还有更多维度，递归构建
                return {
                    name: key,
                    children: buildTree(group, dimIndex + 1)
                };
            }
        });
    };

    const treeData = {
        name: 'root',
        children: buildTree(dataset, 0)
    };

    console.log('构建的树结构:', JSON.stringify(treeData, null, 2));

    return {
        ...spec,
        data: [{
            id: 'data',
            values: [treeData]
        }]
    };
};

const applyColorScheme = (spec, context) => {
    const { advancedVSeed } = context;
    const { colorScheme } = advancedVSeed;

    return {
        ...spec,
        color: colorScheme
    };
};

const applyLabels = (spec, context) => {
    const { advancedVSeed } = context;
    const { labelConfig } = advancedVSeed;

    return {
        ...spec,
        label: labelConfig
    };
};

const applyTooltip = (spec, context) => {
    const { vseed } = context;

    // 用户自定义 > 默认配置
    const tooltipConfig = vseed.tooltip !== undefined ? vseed.tooltip : {
        visible: true,
        style: {
            panel: {
                padding: 7,
                border: {
                    radius: 12,
                    width: 1,
                    color: '#e3e5e8'
                },
                backgroundColor: '#fff'
            }
        }
    };

    return {
        ...spec,
        tooltip: tooltipConfig
    };
};

const buildTreemapSpec = (spec, context) => {
    const { vseed } = context;

    // 是否显示父层级节点（默认显示）
    const showParentNodes = vseed.showParentNodes !== undefined ? vseed.showParentNodes : true;

    // 是否启用下钻功能
    // 默认：showParentNodes 为 true 时启用，为 false 时不启用
    const enableDrill = vseed.drill !== undefined ? vseed.drill : showParentNodes;

    // 下钻字段（默认使用 'name'）
    const drillField = vseed.drillField || 'name';

    // Treemap 去掉 root 层（类似 Sunburst）
    const originalData = spec.data[0].values[0];
    const dataWithoutRoot = originalData.children || [];

    const baseSpec = {
        ...spec,
        type: 'treemap',
        categoryField: 'name',
        valueField: 'value',
        data: [{
            id: 'data',
            values: dataWithoutRoot
        }],
        // 下钻配置
        drill: enableDrill,
        drillField: enableDrill ? drillField : undefined,
        tooltip: {
            ...spec.tooltip,
            mark: {
                title: {
                    // 显示从根到当前节点的完整路径
                    value: data => {
                        return data?.datum?.map(d => d.name).join(' / ');
                    }
                }
            }
        }
    };

    if (showParentNodes) {
        // 显示父层级节点
        return {
            ...baseSpec,
            nonLeaf: {
                visible: true
            },
            nonLeafLabel: {
                visible: true,
                position: 'top',
                // 为非叶子节点预留空间，用于显示标签
                padding: 30,
                style: {
                    x: data => {
                        // 标签左对齐，预留 4px 间距
                        return data.labelRect?.x0 + 4;
                    },
                    textAlign: 'left',
                    // 显示节点名称和值
                    text: data => [data.name, data.value]
                }
            }
        };
    }

    // 默认：不显示父层级节点
    return baseSpec;
};

const buildSunburstSpec = (spec, context) => {
    const { vseed } = context;

    // Sunburst 不需要显示 root 层，直接从第一层维度开始
    const originalData = spec.data[0].values[0];
    const dataWithoutRoot = originalData.children || [];

    // 是否显示叶子节点（measure 值节点，默认显示）
    const showLeafNodes = vseed.showLeafNodes !== undefined ? vseed.showLeafNodes : true;

    if (!showLeafNodes) {
        // 如果不显示叶子节点，需要移除最内层的 value 节点
        const removeLeafNodes = (nodes) => {
            return nodes.map(node => {
                if (node.children && node.children.length > 0) {
                    // 检查子节点是否都是叶子节点（有 value 属性）
                    const hasOnlyLeaves = node.children.every(child => child.value !== undefined && !child.children);
                    if (hasOnlyLeaves) {
                        // 如果子节点都是叶子，计算总和作为当前节点的值
                        const totalValue = node.children.reduce((sum, child) => sum + child.value, 0);
                        return { name: node.name, value: totalValue };
                    } else {
                        // 递归处理子节点
                        return { ...node, children: removeLeafNodes(node.children) };
                    }
                }
                return node;
            });
        };

        const dataWithoutLeaves = removeLeafNodes(dataWithoutRoot);

        return {
            ...spec,
            type: 'sunburst',
            categoryField: 'name',
            valueField: 'value',
            data: [{
                id: 'data',
                values: dataWithoutLeaves
            }]
        };
    }

    // 是否启用下钻功能（默认启用）
    const enableDrill = vseed.drill !== undefined ? vseed.drill : true;

    // 下钻字段（默认使用 'name'）
    const drillField = vseed.drillField || 'name';

    return {
        ...spec,
        type: 'sunburst',
        categoryField: 'name',
        valueField: 'value',
        data: [{
            id: 'data',
            values: dataWithoutRoot
        }],
        drill: enableDrill,
        drillField: enableDrill ? drillField : undefined,
        sunburst: {
            visible: true,
            style: {
                // 叶子节点（measure 值）半透明，维度节点更明显
                fillOpacity: datum => {
                    return datum.isLeaf ? 0.4 : 0.8;
                }
            }
        },
        label: {
            ...spec.label,
            style: {
                ...spec.label?.style,
                // 标签透明度也跟随
                fillOpacity: datum => {
                    return datum.isLeaf ? 0.4 : 0.8;
                }
            }
        },
        tooltip: {
            ...spec.tooltip,
            mark: {
                title: {
                    // 显示从根到当前节点的完整路径
                    value: val => {
                        return val?.datum?.map(data => data.name).join(' / ');
                    }
                }
            }
        }
    };
};

const buildCirclePackingSpec = (spec, context) => {
    const { vseed } = context;

    // 是否启用下钻功能（默认启用）
    const enableDrill = vseed.drill !== undefined ? vseed.drill : true;

    // 下钻字段（默认使用 'name'）
    const drillField = vseed.drillField || 'name';

    return {
        ...spec,
        type: 'circlePacking',
        categoryField: 'name',
        valueField: 'value',
        drill: enableDrill,
        drillField: enableDrill ? drillField : undefined,
        circlePacking: {
            style: {
                // 叶子节点透明度高，非叶子节点透明度低
                fillOpacity: d => (d.isLeaf ? 0.75 : 0.25)
            }
        },
        label: {
            style: {
                fontSize: spec.label?.style?.fontSize || 10,
                // 只显示第一层节点（depth === 1）的标签，避免文字重叠
                visible: d => {
                    return d.depth === 1;
                }
            }
        }
    };
};

// ==================== Pipeline 定义 ====================

const hierarchyAdvancedPipeline = [
    initAdvancedVSeed,
    identifyFields,
    buildMeasures,
    buildDimensions,
    buildColorConfig,
    buildLabelConfig
];

const treemapSpecPipeline = [
    buildTreeData,
    applyColorScheme,
    applyLabels,
    applyTooltip,
    buildTreemapSpec
];

const sunburstSpecPipeline = [
    buildTreeData,
    applyColorScheme,
    applyLabels,
    applyTooltip,
    buildSunburstSpec
];

const circlePackingSpecPipeline = [
    buildTreeData,
    applyColorScheme,
    applyLabels,
    applyTooltip,
    buildCirclePackingSpec
];

// ==================== Builder 类 ====================

class HierarchyBuilder {
    constructor(vseed) {
        this._vseed = vseed;
        this._advancedVSeed = null;
        this._spec = null;
    }

    get vseed() {
        return this._vseed;
    }

    get advancedVSeed() {
        return this._advancedVSeed;
    }

    get spec() {
        return this._spec;
    }

    // 执行 pipeline
    static execPipeline(pipeline, context, initialValue = {}) {
        return pipeline.reduce((prev, fn) => fn(prev, context), initialValue);
    }

    // 构建 advanced vseed
    buildAdvanced() {
        const { chartType } = this._vseed;
        const pipeline = HierarchyBuilder._advancedPipelineMap[chartType];

        if (!pipeline) {
            throw new Error(`No advanced pipeline registered for chartType: ${chartType}`);
        }

        const context = { vseed: this._vseed };
        this._advancedVSeed = HierarchyBuilder.execPipeline(pipeline, context);
        return this._advancedVSeed;
    }

    // 构建 spec
    buildSpec(advancedVSeed) {
        const { chartType } = this._vseed;
        const pipeline = HierarchyBuilder._specPipelineMap[chartType];

        if (!pipeline) {
            throw new Error(`No spec pipeline registered for chartType: ${chartType}`);
        }

        const context = {
            vseed: this._vseed,
            advancedVSeed
        };

        this._spec = HierarchyBuilder.execPipeline(pipeline, context);
        return this._spec;
    }

    // 完整构建流程
    build() {
        const advancedVSeed = this.buildAdvanced();
        const spec = this.buildSpec(advancedVSeed);
        return spec;
    }

    // 静态方法：创建 builder
    static from(vseed) {
        return new HierarchyBuilder(vseed);
    }

    // 注册图表类型
    static register(chartType, advancedPipeline, specPipeline) {
        HierarchyBuilder._advancedPipelineMap[chartType] = advancedPipeline;
        HierarchyBuilder._specPipelineMap[chartType] = specPipeline;
    }

    // 注册所有支持的图表类型
    static registerAll() {
        HierarchyBuilder.register('treemap', hierarchyAdvancedPipeline, treemapSpecPipeline);
        HierarchyBuilder.register('sunburst', hierarchyAdvancedPipeline, sunburstSpecPipeline);
        HierarchyBuilder.register('circlePacking', hierarchyAdvancedPipeline, circlePackingSpecPipeline);
    }

    // Pipeline 存储
    static _advancedPipelineMap = {};
    static _specPipelineMap = {};
}

// 自动注册所有图表类型
HierarchyBuilder.registerAll();

// 导出（浏览器环境）
if (typeof window !== 'undefined') {
    window.HierarchyBuilder = HierarchyBuilder;
}
