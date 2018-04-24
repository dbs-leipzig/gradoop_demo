/*
 * Copyright © 2014 - 2018 Leipzig University (Database Research Group)
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**---------------------------------------------------------------------------------------------------------------------
 * Global Values
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * Prefixes of the aggregation functions
 */
let aggrPrefixes = ['min ', 'max ', 'sum '];

/**
 * Map of all possible values for the vertexLabelKey to a color in RGB format.
 * @type {{}}
 */
let colorMap = {};

/**
 * Buffers the last graph response from the server to improve redrawing speed.
 */
let bufferedData;

/**
 * True, if the graph layout should be force based
 * @type {boolean}
 */
let useForceLayout = true;

/**
 * True, if the default label should be used
 * @type {boolean}
 */
let useDefaultLabel = true;

/**
 * Maximum value for the count attribute of vertices
 * @type {number}
 */
let maxVertexCount = 0;

/**
 * Maximum value for the count attribute of edges
 * @type {number}
 */
let maxEdgeCount = 0;


/**---------------------------------------------------------------------------------------------------------------------
 * Callbacks
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * Reload the database properties whenever the database selection is changed
 */
$(document).on("change", "#databaseName", loadDatabaseProperties);

/**
 * When the 'Show whole graph' button is clicked, send a request to the server for the whole graph
 */
$(document).on("click",'#showWholeGraph', function(e) {
    e.preventDefault();
    let btn = $(this);
    btn.addClass("loading");
    let databaseName = getSelectedDatabase();
    $.post('http://localhost:2342/graph/' + databaseName, function(data) {
        useDefaultLabel = true;
        useForceLayout = false;
        drawGraph(data, true);
        btn.removeClass("loading");
    }, "json");
});

/**
 * Whenever one of the view options is changed, redraw the graph
 */
$(document).on("change", '.redraw', function() {
    drawGraph(bufferedData, false);
});

/**
 * When the 'Execute' button is clicked, construct a request and send it to the server
 */
$(document).on('click', ".execute-button", function () {
    let btn = $(this);
    btn.addClass("loading");
    let reqData = {
        dbName: getSelectedDatabase(),
        vertexKeys: getValues("#vertexPropertyKeys"),
        edgeKeys: getValues("#edgePropertyKeys"),
        vertexAggrFuncs: getValues("#vertexAggrFuncs"),
        edgeAggrFuncs: getValues("#edgeAggrFuncs"),
        vertexFilters: getValues("#vertexFilters"),
        edgeFilters: getValues("#edgeFilters"),
        filterAllEdges: getValues("#edgeFilters") === ["none"]
    };

    $.ajax({
        url: 'http://localhost:2342/grouping/',
        datatype: "text",
        type: "post",
        contentType: "application/json",
        data: JSON.stringify(reqData),
        success: function(data) {
            useDefaultLabel = false;
            useForceLayout = true;
            drawGraph(data, true);
            btn.removeClass('loading');
        }
    });
});

/**
 * Runs when the DOM is ready
 */
$(document).ready(function () {
    cy = buildCytoscape();
    loadDatabaseProperties();
    $('select').select2();
});

/**---------------------------------------------------------------------------------------------------------------------
 * Graph Drawing
 *-------------------------------------------------------------------------------------------------------------------*/
function buildCytoscape() {
    return cytoscape({
        container: document.getElementById('canvas'),
        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                // define label content and font
                'content': function (node) {

                    let labelString = getLabel(node, getVertexLabelKey(), useDefaultLabel);

                    let properties = node.data('properties');

                    if (properties['count'] != null) {
                        labelString += ' (' + properties['count'] + ')';
                    }
                    return labelString;
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
                        if (count != null) {
                            count = count / maxVertexCount;
                            // surface of vertices is proportional to count
                            return Math.max(2, Math.sqrt(count * 10000 / Math.PI));
                        }
                    }
                    return 10;
                },
                'text-valign': 'center',
                'color': 'black',
                // this function changes the text color according to the background color
                // unnecessary atm because only light colors can be generated
                /* function (vertices) {
                 let label = getLabel(vertices, vertexLabelKey, useDefaultLabel);
                 let bgColor = colorMap[label];
                 if (bgColor[0] + bgColor[1] + (bgColor[2] * 0.7) < 300) {
                 return 'white';
                 }
                 return 'black';
                 },*/
                // set background color according to color map
                'background-color': function (node) {
                    let label = getLabel(node, getVertexLabelKey(), useDefaultLabel);
                    let color = colorMap[label];
                    let result = '#';
                    result += ('0' + color[0].toString(16)).substr(-2);
                    result += ('0' + color[1].toString(16)).substr(-2);
                    result += ('0' + color[2].toString(16)).substr(-2);
                    return result;
                },

                /* size of vertices can be determined by property count
                 count specifies that the vertex stands for
                 1 or more other vertices */
                'width': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxVertexCount;
                            // surface of vertex is proportional to count
                            return Math.sqrt(count * 1000000 / Math.PI) + 'px';
                        }
                    }
                    return '60px';

                },
                'height': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxVertexCount;
                            // surface of vertex is proportional to count
                            return Math.sqrt(count * 1000000 / Math.PI) + 'px';
                        }
                    }
                    return '60px';
                },
                'text-wrap': 'wrap'
            })
            .selector('edge')
            .css({
                'curve-style': 'bezier',
                // layout of edge and edge label
                'content': function (edge) {

                    if (!$('#showEdgeLabels').is(':checked')) {
                        return '';
                    }

                    let labelString = getLabel(edge, getEdgeLabelKey(), useDefaultLabel);

                    let properties = edge.data('properties');

                    if (properties['count'] !== null) {
                        labelString += ' (' + properties['count'] + ')';
                    }

                    return labelString;
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': function (node) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = node.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxVertexCount;
                            // surface of vertices is proportional to count
                            return Math.max(2, Math.sqrt(count * 10000 / Math.PI));
                        }
                    }
                    return 10;
                },
                'line-color': '#999',
                // width of edges can be determined by property count
                // count specifies that the edge represents 1 or more other edges
                'width': function (edge) {
                    if ($('#showCountAsSize').is(':checked')) {
                        let count = edge.data('properties')['count'];
                        if (count !== null) {
                            count = count / maxEdgeCount;
                            return Math.sqrt(count * 1000);
                        }
                    }
                    return 2;
                },
                'target-arrow-shape': 'triangle',
                'target-arrow-color': '#000'
            })
            // properties of edges and vertices in special states, e.g. invisible or faded
            .selector('.faded')
            .css({
                'opacity': 0.25,
                'text-opacity': 0
            })
            .selector('.invisible')
            .css({
                'opacity': 0,
                'text-opacity': 0
            }),
        ready: function () {
            window.cy = this;
            cy.elements().unselectify();
            /* if a vertex is selected, fade all edges and vertices
            that are not in direct neighborhood of the vertex */
            cy.on('tap', 'node', function (e) {
                let node = e.cyTarget;
                let neighborhood = node.neighborhood().add(node);

                cy.elements().addClass('faded');
                neighborhood.removeClass('faded');
            });
            // remove fading by clicking somewhere else
            cy.on('tap', function (e) {

                if (e.cyTarget === cy) {
                    cy.elements().removeClass('faded');
                }
            });
        }
    });
}

/**
 * function called when the server returns the data
 * @param data graph data
 * @param initial indicates whether the data is drawn initially
 */
function drawGraph(data, initial = true) {
    // lists of vertices and edges
    let nodes = data.nodes;
    let edges = data.edges;

    if(initial) {
        // buffer the data to speed up redrawing
        bufferedData = data;

        // compute maximum count of all vertices, used for scaling the vertex sizes
        maxVertexCount = nodes.reduce((acc, node) => {
            return Math.max(acc, Number(node['data']['properties']['count']))
        }, 0);

        let labels = new Set(nodes.map((node) => {
            return (!useDefaultLabel && getVertexLabelKey() !== 'label') ?
                node['data']['properties'][getVertexLabelKey()] : node['data']['label']
        }));

        // generate random colors for the vertex labels
        generateRandomColors(labels);

        // compute maximum count of all edges, used for scaling the edge sizes
        maxEdgeCount = edges.reduce((acc, edge) => {
            return Math.max(acc, Number(edge['data']['properties']['count']))
        }, 0);
    }

    cy.elements().remove();
    cy.add(nodes);
    cy.add(edges);

    if ($('#hideNullGroups').is(':checked')) {
        hideNullGroups();
    }

    if ($('#hideDisconnected').is(':checked')) {
        hideDisconnected();
    }

    addQtip();

    cy.layout(chooseLayout());
}


function chooseLayout() {
// options for the force layout
    let cose = {
        name: 'cose',

        // called on `layoutready`
        ready: function () {
        },

        // called on `layoutstop`
        stop: function () {
        },

        // whether to animate while running the layout
        animate: true,

        // number of iterations between consecutive screen positions update (0 ->
        // only updated on the end)
        refresh: 4,

        // whether to fit the network view after when done
        fit: true,

        // padding on fit
        padding: 30,

        // constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
        boundingBox: undefined,

        // whether to randomize node positions on the beginning
        randomize: true,

        // whether to use the JS console to print debug messages
        debug: false,

        // node repulsion (non overlapping) multiplier
        nodeRepulsion: 8000000,

        // node repulsion (overlapping) multiplier
        nodeOverlap: 10,

        // ideal edge (non nested) length
        idealEdgeLength: 1,

        // divisor to compute edge forces
        edgeElasticity: 100,

        // nesting factor (multiplier) to compute ideal edge length for nested edges
        nestingFactor: 5,

        // gravity force (constant)
        gravity: 250,

        // maximum number of iterations to perform
        numIter: 100,

        // initial temperature (maximum node displacement)
        initialTemp: 200,

        // cooling factor (how the temperature is reduced between consecutive iterations
        coolingFactor: 0.95,

        // lower temperature threshold (below this point the layout will end)
        minTemp: 1.0
    };

    let radialRandom = {
        name: 'preset',
        positions: function() {

            let r = Math.random() * 1000001;
            let theta = Math.random() * 2 * (Math.PI);
            return {
                x: Math.sqrt(r) * Math.sin(theta),
                y: Math.sqrt(r) * Math.cos(theta)
            };
        },
        zoom: undefined,
        pan: undefined,
        fit: true,
        padding: 30,
        animate: false,
        animationDuration: 500,
        animationEasing: undefined,
        ready: undefined,
        stop: undefined
    };

    if (useForceLayout) {
        return cose;
    } else {
        return radialRandom;
    }
}

/**
 * Add a custom Qtip to the vertices and edges of the graph.
 */
function addQtip() {
    cy.elements().qtip({
        content: function () {
            let qtipText = '';
            for (let [key, value] of Object.entries(this.data())) {
                if (key !== 'properties' && key !== 'pie_parameters') {
                    qtipText += key + ' : ' + value + '<br>';
                }
            }
            for (let [key, value] of Object.entries(this.data('properties'))) {
                qtipText += key + ' : ' + value + '<br>';
            }
            return qtipText;
        },
        position: {
            my: 'top center',
            at: 'bottom center'
        },
        style: {
            classes: 'MyQtip'
        }
    });
}

/**
 * Hide all vertices and edges, that have a NULL property.
 */
function hideNullGroups() {
    let vertexKeys = getValues("#vertexPropertyKeys");
    let edgeKeys = getValues("#edgePropertyKeys");

    let nodes = [];
    for(let i = 0; i < cy.nodes().length; i++) {
        nodes[i] = cy.nodes()[i]
    }

    let edges = [];
    for(let i = 0; i < cy.edges().length; i++) {
        edges[i] = cy.edges()[i];
    }

    nodes
        .filter(node => vertexKeys.find((key) => node.data().properties[key] === "NULL"))
        .forEach(node => node.remove());

    edges
        .filter(edge => edgeKeys.find((key) => edge.data().properties[key] === "NULL"))
        .forEach(edge => edge.remove());
}

/**
 * Function to hide all disconnected vertices (vertices without edges).
 */
function hideDisconnected() {
    let nodes = [];
    for(let i = 0; i < cy.nodes().length; i++) {
        nodes[i] = cy.nodes()[i]
    }

    nodes.filter(node => {
        return (cy.edges('[source="' + node.id() + '"]').length === 0)
            && (cy.edges('[target="' + node.id() + '"]').length === 0)
    }).forEach(node => node.remove());
}

/**---------------------------------------------------------------------------------------------------------------------
 * UI Initialization
 *-------------------------------------------------------------------------------------------------------------------*/

/**
 * Initialize the database menu according to the selected database
 */
function loadDatabaseProperties() {
    let databaseName = $('#databaseName').val();
    $.post('http://localhost:2342/keys/' + databaseName, function(response) {
        initializeFilterKeyMenus(response);
        initializePropertyKeyMenus(response);
        initializeAggregateFunctionMenus(response);
    }, "json");
}

/**
 * Initialize the filter menus with the labels
 * @param keys labels of the input vertices
 */
function initializeFilterKeyMenus(keys) {
    let vertexFilters = $('#vertexFilters');
    let edgeFilters = $('#edgeFilters');

    // clear previous entries
    vertexFilters.html("");
    edgeFilters.html("");


    // add one entry per vertex label
    keys.vertexLabels.forEach(label => {
        vertexFilters.append($("<option value='" + label + "'>" + label + "</option>"))
    });

    keys.edgeLabels.forEach(label => {
        edgeFilters.append($("<option value='" + label + "'>" + label + "</option>"))
    });
    edgeFilters.append($("<option value='none'>None</option>"))

}

/**
 * Initialize the key propertyKeys menus.
 * @param keys array of vertex and edge keys
 */
function initializePropertyKeyMenus(keys) {
    // get the propertyKeys menus in their current form
    let vertexPropertyKeys = $('#vertexPropertyKeys');
    let edgePropertyKeys = $('#edgePropertyKeys');

    // clear previous entries
    vertexPropertyKeys.html("");
    edgePropertyKeys.html("");

    // add default key (label)
    vertexPropertyKeys.append($("<option value='label'>label</option>"));
    edgePropertyKeys.append($("<option value='label'>label</option>"));

    // add one entry per property key
    keys.vertexKeys.forEach(key => {
        vertexPropertyKeys.append($("<option value='" + key.name + "'>" + key.name + "</option>"))
    });

    keys.edgeKeys.forEach(key => {
        edgePropertyKeys.append($("<option value='" + key.name + "'>" + key.name + "</option>"))
    });
}

/**
 * initialize the aggregate function propertyKeys menu
 */
function initializeAggregateFunctionMenus(keys) {
    let vertexAggrFuncs = $('#vertexAggrFuncs');
    let edgeAggrFuncs = $('#edgeAggrFuncs');

    // clear previous entries
    vertexAggrFuncs.html("");
    edgeAggrFuncs.html("");

    // add default key (label)
    vertexAggrFuncs.append($("<option value='count'>count</option>"));
    edgeAggrFuncs.append($("<option value='count'>count</option>"));

    // add one entry per property key
    keys.vertexKeys
        .filter(k => {return k.numerical})
        .forEach(key => {
             aggrPrefixes.forEach(prefix => {
                 let functionName = prefix + key.name;
                 vertexAggrFuncs.append($("<option value='" + functionName + "'>" + functionName + "</option>"))
             });
        });

    keys.edgeKeys
        .filter(k => {return k.numerical})
        .forEach(key => {
            aggrPrefixes.forEach(prefix => {
                let functionName = prefix + key.name;
                edgeAggrFuncs.append($("<option value='" + functionName + "'>" + functionName + "</option>"))
            });
        });
}

/**---------------------------------------------------------------------------------------------------------------------
 * Utility Functions
 *-------------------------------------------------------------------------------------------------------------------*/

/**
 * Generate a random color for each label
 * @param labels array of labels
 */
function generateRandomColors(labels) {
    colorMap = {};
    labels.forEach(function (label) {
        let r = 0;
        let g = 0;
        let b = 0;
        while (r + g + b < 382) {
            r = Math.floor((Math.random() * 255));
            g = Math.floor((Math.random() * 255));
            b = Math.floor((Math.random() * 255));
        }
        colorMap[label] = [r, g, b];
    });
}

/**
 * Get the label of the given element, either the default label ('label') or the value of the
 * given property key
 * @param element the element whose label is needed
 * @param key key of the non-default label
 * @param useDefaultLabel boolean specifying if the default label shall be used
 * @returns {string} the label of the element
 */
function getLabel(element, key, useDefaultLabel) {
    let label = '';
    if (!useDefaultLabel && key !== 'label') {
        label += element.data('properties')[key];
    } else {
        label += element.data('label');
    }
    return label;
}

/**
 * get the selected database
 * @returns selected database name
 */
function getSelectedDatabase() {
    return $('#databaseName').val();
}

/**
 * Retrieve the values of the specified element as Array
 * @param element the html element
 * @returns {Array}
 */
function getValues(element) {
    return $(element).val() || []
}

/**
 * Property keys that are used to specify the vertex and edge labels.
 */
function getVertexLabelKey() {
    let values = getValues("#vertexPropertyKeys");
    return values.length === 0 ? "label" : values[0];
}

function getEdgeLabelKey() {
    let values = getValues("#edgePropertyKeys");
    return values.length === 0 ? "label" : values[0];
}