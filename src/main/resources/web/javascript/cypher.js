/**---------------------------------------------------------------------------------------------------------------------
 * Global Values
 *-------------------------------------------------------------------------------------------------------------------*/

/**
 * Map of all possible values for the vertexLabelKey to a color in RGB format.
 * @type {{}}
 */
let colorMap = {};

/**
 * Defines a force layout
 */
let forceLayout = {
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

/**---------------------------------------------------------------------------------------------------------------------
 * Event listeners
 *-------------------------------------------------------------------------------------------------------------------*/

/**
 * Initialize the page
 * */
$(document).ready(function(){
    buildCytoscape();
    initializeCypherEditor();
    $('select').select2();
});

/**
 * Submit a new query
 */
$(document).on("click",'.query-button', function(){
    let btn = $(this);
    btn.addClass("loading");
    $.post('/cypher', $('#cypher-query-form').serialize(), function(response){
        btn.removeClass('loading');
        cy.resize();
        drawGraph(response);
        drawTable(response);
    },"json")
});

/**
 * Show the graph view tab
 */
$(document).on("click",'#show-tab-graph-view', function(){
    $("#tab-graph-view").show();
    $("#tab-table-view").hide();
    $(this).addClass("active");
    $("#show-tab-table-view").removeClass("active");
    cy.resize();
});

/**
 * Show the tabular view
 */
$(document).on("click",'#show-tab-table-view', function(){
    $("#tab-table-view").show();
    $("#tab-graph-view").hide();
    $(this).addClass("active");
    $("#show-tab-graph-view").removeClass("active")
});




/**---------------------------------------------------------------------------------------------------------------------
 * Graph Drawing
 *-------------------------------------------------------------------------------------------------------------------*/
/**
 * Initialize the Cytoscape environment
 * @returns {Cytoscape} the cytoscape environment
 */
function buildCytoscape() {
    return cytoscape({
        container: document.getElementById('canvas'),
        style: cytoscape.stylesheet()
            .selector('node')
            .css({
                // define label content and font
                'content': function (node) {
                    return node.data('label');
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': '10px',
                'text-valign': 'center',
                'color': 'black',
                'background-color': function (node) {
                    let label = node.data('label');
                    let color = colorMap[label];
                    let result = '#';
                    result += ('0' + color[0].toString(16)).substr(-2);
                    result += ('0' + color[1].toString(16)).substr(-2);
                    result += ('0' + color[2].toString(16)).substr(-2);
                    return result;
                },
                'width': '60px',
                'height': '60px',
                'text-wrap': 'wrap'
            })
            .selector('edge')
            .css({
                'curve-style': 'bezier',
                // layout of edge and edge label
                'content': function (edge) {
                    return edge.data('label');
                },
                // if the count shall effect the vertex size, set font size accordingly
                'font-size': '10',
                'line-color': '#999',
                // width of edges can be determined by property count
                // count specifies that the edge represents 1 or more other edges
                'width': 2,
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
 */
function drawGraph(data) {
    // buffer the data to speed up redrawing
    bufferedData = data;

    // lists of vertices and edges
    let nodes = data.nodes;
    let edges = data.edges;

    // set conaining all distinct labels (property key specified by vertexLabelKey)
    let labels = new Set();

    // compute maximum count of all vertices, used for scaling the vertex sizes
    for (let i = 0; i < nodes.length; i++) {
        let node = nodes[i];
        labels.add(node['data']['label']);
    }
    for (let i = 0; i < edges.length; i++) {
        let edge = edges[i];
        labels.add(edge['data']['label']);
    }

    // generate random colors for the vertex labels
    generateRandomColors(labels);

    // hide the loading gif
    $('#loading').hide();
    // update vertex and edge count
    let rows = '';
    rows += '<tr><td>Vertex Count</td><td>:</td><td>'
        + nodes.length + '</td></tr>';
    rows += '<tr><td>Edge Count</td><td>:</td><td>'
        + edges.length + '</td></tr>';
    $('#stats').html(rows);


    cy.elements().remove();
    cy.add(nodes);
    cy.add(edges);

    addQtip();

    cy.layout(forceLayout);
    changed = false;
}

/**
 * Add a custom Qtip to the vertices and edges of the graph.
 */
function addQtip() {
    cy.elements().qtip({
        content: function () {
            let element = this.data();
            let qtipText = '';

            Object.keys(element)
                .filter(key => key !== 'properties' && key !== 'pie_parameters' )
                .forEach(key => qtipText += key + ' : ' + element[key] + '<br>');

            Object.keys(element["properties"])
                .forEach(prop => qtipText += prop + ' : ' + element["properties"][prop] + '<br>');

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

/**---------------------------------------------------------------------------------------------------------------------
 * Table Rendering
 *-------------------------------------------------------------------------------------------------------------------*/

/**
 * Renders the result data in tabular form
 * @param data the result data
 */
function drawTable(data) {
    let table = $("#cypher-result-table");

    let tableHead = table.find("thead");
    tableHead.html("");
    let tr = $("<tr></tr>");
    data["graphs"][0]["properties"]["__variable_mapping"]
        .replace("{","")
        .replace("}","")
        .split(", ")
        .map(str =>$("<th>"+str.split("=")[0]+"</th>"))
        .forEach(th => tr.append(th));
    tableHead.append(tr);

    let tableBody = table.find("tbody");
    tableBody.html("");
    for(graph of data["graphs"]) {
        let tr = $("<tr></tr>");
        graph["properties"]["__variable_mapping"]
            .replace("{","")
            .replace("}","")
            .split(", ")
            .map(str => $("<td><pre>" + JSON.stringify(cy.$('#' + str.split("=")[1]).data(), null, 2) + "</pre></td>"))
            .forEach(td => tr.append(td));
        tableBody.append(tr)
    }
}

/**---------------------------------------------------------------------------------------------------------------------
 * Utility functions
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
 * Initializes an instance of the ACE editor with a custom cypher syntax highlighter
 */
function initializeCypherEditor() {
    let textArea = document.getElementById("query");
    CodeMirror.fromTextArea(textArea, {
        mode: "cypher",
        theme: "neo",
        lineNumbers: true,
    }).on("change", function(editor) {
        $("#query").val(editor.doc.getValue());
    });
}
