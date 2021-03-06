var widgets = require('@jupyter-widgets/base');
var _ = require('lodash');
var cytoscape = require('cytoscape');
var cyjs = require('./cytoscape-util');

const FORMAT = {
    CX: 'cx',
    CYJS: 'cyjs',
    EDGELIST: 'el',
}

const DEF_BG = '#FFFFFF'
const DEF_LAYOUT = 'cose'
const DEF_HEIGHT = '500px'

const DEF_STYLE = [{
        selector: 'node',
        style: {
            'background-color': '#37474F',
            'label': 'data(id)',
            'width': 12,
            'height': 12,
            'color': '#333333',
            'font-weight': 400,
            'text-halign': 'right',
            'text-valign': 'bottom',
            'font-size': 16
        }
    },
    {
        selector: 'edge',
        style: {
            'width': 1,
            'line-color': '#37474F',
            'target-arrow-color': '#37474F',
            'target-arrow-shape': 'triangle'
        }
    }
];

// Cytoscape Model. Custom widgets models must at least provide default values
// for model attributes, including
//
//  - `_view_name`
//  - `_view_module`
//  - `_view_module_version`
//
//  - `_model_name`
//  - `_model_module`
//  - `_model_module_version`
//
//  when different from the base class.

// When serialiazing the entire widget state for embedding, only values that
// differ from the defaults will be specified.
var CytoscapeModel = widgets.DOMWidgetModel.extend({
    defaults: _.extend(widgets.DOMWidgetModel.prototype.defaults(), {
        _model_name: 'CytoscapeModel',
        _view_name: 'CytoscapeView',
        _model_module: 'cytoscape-jupyter-widget',
        _view_module: 'cytoscape-jupyter-widget',
        _model_module_version: '0.3.0',
        _view_module_version: '0.3.0'
    })
});


// Custom View. Renders the widget model.
var CytoscapeView = widgets.DOMWidgetView.extend({

    render: function() {
        this.value_changed();
        this.model.on('change:value', this.value_changed, this);
    },

    value_changed: function() {
        let background = this.model.get('background');
        const layoutModel = this.model.get('layout')
        let cellHeight = layoutModel.attributes.height

        if (!background) {
            background = DEF_BG
        }
        if (!cellHeight) {
            cellHeight = DEF_HEIGHT
        }

        this.el.classList.add('cytoscape-widget')
        this.el.id = 'cyjs'
        this.$el.css({
            background: background,
            height: cellHeight
        })
        this.displayed.then(_.bind(this.renderCy, this));
    },

    checkPositions: function(elements) {

        const nodes = elements.nodes
        if (!nodes) {
            return false
        }

        const firstNode = nodes[0]

        if (!firstNode) {
            return false
        }

        if (firstNode.position) {
            return true
        }
    },

    renderCy: function() {
        var that = this;

        // Extract parameters
        const data = that.model.get('data');
        const format = that.model.get('format');
        var layoutName = that.model.get('layout_name');

        let network = data
        let visualStyle = null;

        if (format === FORMAT.CX) {
            // Convert to CYJS
            network = cyjs.fromCx(data)
            visualStyle = network.style
        }
        const vsParam = that.model.get('visual_style');
        if (vsParam) {
            // Override VS
            visualStyle = vsParam
        }

        if (!visualStyle) {
            visualStyle = DEF_STYLE;
        }

        if (!layoutName || typeof layoutName !== 'string') {
            if (this.checkPositions(network.elements)) {
                // This network has layout information
                layoutName = 'preset'
            } else {
                layoutName = DEF_LAYOUT
            }
        }

        var cy = cytoscape({
            container: that.el, // container to render in
            elements: network.elements,
            style: visualStyle,
            layout: {
                name: layoutName
            }
        });
    }
});


module.exports = {
    CytoscapeModel: CytoscapeModel,
    CytoscapeView: CytoscapeView
};