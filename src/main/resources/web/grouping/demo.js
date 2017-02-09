/*
 * This file is part of Gradoop.
 *
 * Gradoop is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * Gradoop is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with Gradoop.  If not, see <http:// www.gnu.org/licenses/>.
 */

/**
 * Prefixes of the aggregation functions
 */
var aggrPrefixes = ["min ", "max ", "sum "];

/**
 * Maps of (label) to (property key, number of supporting labels)
 * used to make unsupported property keys diabled
 * @type {Object<String, {String, Integer}>}
 */
var vertexFilterMap = {};
var edgeFilterMap = {};

/**
 * Property keys that are used to specify the vertex and edge labels.
 */
var vertexLabelKey;
var edgeLabelKey;

/**
 * Map of all possible values for the vertexLabelKey to a color in RGB format.
 * @type {{}}
 */
var colorMap = {};

$(document).ready(function () {

    // hide everything that is invisible at the beginning
    hideElements();

    // reset the webpage on reload, this is to keep the browser from trying to keep the current
    // state
    resetPage();

    // get the available databases from the org.gradoop.demos.grouping.server
    // if the request is a success, add them to the database propertyKeys menu
    $.get("http://localhost:2342/databases/")
        .done(initializeDatabaseMenu)
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });


    // when the "Show whole graph" button is clicked, send a request to the server for the whole
    // graph
    $("#wholeGraph").bind("click", function () {

        // show the loading spinner
        $("#loading").show();

        var databaseName = getSelectedDatabase();
        $.post("http://localhost:2342/graph/" + databaseName)
            .done(function (data) {
                showGraph(data, true);
            })
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            });

    });


    // when the "Execute" button is clicked, construct a request and send it to the server
    $("#exec").bind("click", function () {

        var request = {};

        request.dbName = getSelectedDatabase();
        request.vertexKeys = getSelectedVertexKeys();
        request.edgeKeys = getSelectedEdgeKeys();
        request.vertexAggrFuncs = getSelectedVertexAggregateFunctions();
        request.edgeAggrFuncs = getSelectedEdgeAggregateFunctions();
        request.vertexFilters = getSelectedVertexFilters();
        request.edgeFilters = getSelectedEdgeFilters();

        // validate request
        if (isValidRequest(request)) {

            // show the loading gif
            $("#loading").show();

            $.ajax({
                url: "http://localhost:2342/data/",
                datatype: "text",
                type: "post",
                contentType: "application/json",
                data: JSON.stringify(request),
                success: function (data) {
                    showGraph(data, false);
                }
            });
        } else {
            alert("Not a valid request.");
        }
    });
});

// function called when the server returns the data
function showGraph(data, useDefaultLabel) {

    // lists of nodes and edges
    var nodes = data.nodes;
    var edges = data.edges;

    // set conaining all distinct labels (property key specified by vertexLabelKey)
    var labels = new Set();

    // compute maximum count of all vertices, used for scaling the vertex sizes
    var maxVertexCount = 0;
    for (var i = 0; i < nodes.length; i++) {
        var vertex = nodes[i];
        var vertexCount = Number(vertex["data"]["properties"]["count"]);
        if ((vertexCount != null) && (vertexCount > maxVertexCount)) {
            maxVertexCount = vertexCount;
        }
        if (!useDefaultLabel && vertexLabelKey != "label") {
            labels.add(vertex["data"]["properties"][vertexLabelKey]);
        } else {
            labels.add(vertex["data"]["label"]);
        }
    }

    // generate random colors for the vertex labels
    generateRandomColors(labels);

    // compute maximum count of all edges, used for scaling the edge sizes
    var maxEdgeCount = 0;
    for (var j = 0; j < edges.length; j++) {
        var edge = edges[j];
        var edgeCount = Number(edge["data"]["properties"]["count"]);
        if ((edgeCount != null) && (edgeCount > maxEdgeCount)) {
            maxEdgeCount = edgeCount;
        }
    }

    // hide the loading gif
    $("#loading").hide();


    // update vertex and edge count
    var rows = "";
    rows += "<tr><td>Vertex Count</td><td>:</td><td>"
        + nodes.length + "</td></tr>";
    rows += "<tr><td>Edge Count</td><td>:</td><td>"
        + edges.length + "</td></tr>";
    $("#stats").html(rows);

    // start cytoscape
    $(function () {
        cytoscape({
            container: document.getElementById("canvas"),
            style: cytoscape.stylesheet()
                .selector("node")
                .css({

                    // define label content and font
                    "content": function (node) {

                        var labelString = getLabel(node, vertexLabelKey, useDefaultLabel);

                        var properties = node.data("properties");

                        if (properties["count"] != null) {
                            labelString += " (" + properties["count"] + ")";
                        }

                        return labelString;
                    },
                    // if the count shall effect the vertex size, set font size accordingly
                    "font-size": function (node) {
                        if ($("#showCountAsSize").is(":checked")) {
                            var count = node.data("properties")["count"];
                            if (count != null) {
                                count = count / maxVertexCount;
                                // surface of nodes is proportional to count
                                return Math.max(2, Math.sqrt(count * 10000 / Math.PI));
                            }
                        }
                        return 10;
                    },
                    "text-valign": "center",
                    "color": "black",
                    // this function changes the text color according to the background color
                    // unnecessary atm because only light colors can be generated
                    /* function (node) {
                     var label = getLabel(node, vertexLabelKey, useDefaultLabel);
                     var bgColor = colorMap[label];
                     if (bgColor[0] + bgColor[1] + (bgColor[2] * 0.7) < 300) {
                     return "white";
                     }
                     return "black";
                     },*/
                    // set background color according to color map
                    "background-color": function (node) {
                        var label = getLabel(node, vertexLabelKey, useDefaultLabel);
                        var color = colorMap[label];
                        var result = "#";
                        result += ("0" + color[0].toString(16)).substr(-2);
                        result += ("0" + color[1].toString(16)).substr(-2);
                        result += ("0" + color[2].toString(16)).substr(-2);
                        return result;
                    },

                    // size of nodes can be determined by property count
                    // count specifies that the node stands for
                    // 1 or more other nodes
                    "width": function (node) {
                        if ($("#showCountAsSize").is(":checked")) {
                            var count = node.data("properties")["count"];
                            if (count != null) {
                                count = count / maxVertexCount;
                                // surface of nodes is proportional to count
                                return Math.sqrt(count * 1000000 / Math.PI) + "px";
                            }
                        }
                        return "60px";

                    },
                    "height": function (node) {
                        if ($("#showCountAsSize").is(":checked")) {
                            var count = node.data("properties")["count"];
                            if (count != null) {
                                count = count / maxVertexCount;
                                // surface of nodes is proportional to count
                                return Math.sqrt(count * 1000000 / Math.PI) + "px";
                            }
                        }
                        return "60px";
                    },
                    "text-wrap": "wrap"
                })
                .selector("edge")
                .css({
                    // layout of edge and edge label
                    "content": function (edge) {

                        if (!$("#showEdgeLabels").is(":checked")) {
                            return "";
                        }

                        var labelString = getLabel(edge, edgeLabelKey, useDefaultLabel);

                        var properties = edge.data("properties");

                        if (properties["count"] != null) {
                            labelString += " (" + properties["count"] + ")";
                        }

                        return labelString;
                    },
                    // if the count shall effect the vertex size, set font size accordingly
                    "font-size": function (node) {
                        if ($("#showCountAsSize").is(":checked")) {
                            var count = node.data("properties")["count"];
                            if (count != null) {
                                count = count / maxVertexCount;
                                // surface of nodes is proportional to count
                                return Math.max(2, Math.sqrt(count * 60));
                            }
                        }
                        return 10;
                    },
                    "line-color": "#999",
                    // width of edges can be determined by property count
                    // count specifies that the edge represents 1 or more other edges
                    "width": function (edge) {
                        if ($("#showCountAsSize").is(":checked")) {
                            var count = edge.data("properties")["count"];
                            if (count != null) {
                                count = count / maxEdgeCount;
                                return Math.sqrt(count * 1000);
                            }
                        }
                        return 2;
                    },
                    "target-arrow-shape": "triangle",
                    "target-arrow-color": "#000"
                })
                // properties of edges and nodes in special states
                // e.g. invisible or faded
                .selector(":selected")
                .css({
                    "background-color": "black",
                    "line-color": "black",
                    "target-arrow-color": "black",
                    "source-arrow-color": "black"
                })
                .selector(".faded")
                .css({
                    "opacity": 0.25,
                    "text-opacity": 0
                })
                .selector(".invisible")
                .css({
                    "opacity": 0,
                    "text-opacity": 0
                }),
            elements: {
                nodes: nodes,
                edges: edges
            },

            ready: function () {
                window.cy = this;
                cy.elements().unselectify();
                // if a node is selected, fade all edges and nodes
                // that are not in direct neighborhood of the node
                cy.on("tap", "node", function (e) {
                    var node = e.cyTarget;
                    var neighborhood = node.neighborhood().add(node);

                    cy.elements().addClass("faded");
                    neighborhood.removeClass("faded");
                });
                // remove fading by clicking somewhere else
                cy.on("tap", function (e) {

                    if (e.cyTarget === cy) {
                        cy.elements().removeClass("faded");
                    }
                });
                // add a property box whenever a node or edge is
                // selected
                cy.elements().qtip({
                    content: function () {
                        var qtipText = "";
                        for (var key in this.data()) {
                            if (key != "properties" && key != "pie_parameters") {
                                qtipText += key + " : " + this.data(key) + "<br>";
                            }
                        }
                        var properties = this.data("properties");
                        for (var property in properties) {
                            qtipText += property + " : " + properties[property] + "<br>";
                        }
                        return qtipText;
                    },
                    position: {
                        my: "top center",
                        at: "bottom center"
                    },
                    style: {
                        classes: "MyQtip"
                    }
                });
                // options for the force layout
                var options = {
                    name: "cose",

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
                cy.layout(options);

            }
        });

    });
}

/**
 * Function for initializing the database propertyKeys menu. Adds on-click listener to the elements.
 * @param databases list of all available databases
 */
function initializeDatabaseMenu(databases) {
    var databaseSelect = $("#databases");
    databaseSelect.show();
    for (var i = 0; i < databases.length; i++) {
        var name = databases[i];
        databaseSelect.append('<option value="' + name + '">' + name + '</option>');
    }
    databaseSelect.children().on("click", sendKeyRequest);

    // on click, the dropdown menus open, this has to be done here so it is done only once
    $(".dropDown").find("dt a").on("click", function () {
        $(this).closest(".dropDown").find("ul").slideToggle("fast");
    });

    // hide dropdown menus when something else is clicked
    $(document).bind("click", function (e) {
        var $clicked = $(e.target);
        if (!$clicked.parents("#vertexPropertyKeys").length)
            $("#vertexPropertyKeys").find("dd ul").hide();
        if (!$clicked.parents("#edgePropertyKeys").length)
            $("#edgePropertyKeys").find("dd ul").hide();
        if (!$clicked.parents("#vertexFilters").length)
            $("#vertexFilters").find("dd ul").hide();
        if (!$clicked.parents("#edgeFilters").length)
            $("#edgeFilters").find("dd ul").hide();
        if (!$clicked.parents("#vertexAggrFuncs").length)
            $("#vertexAggrFuncs").find("dd ul").hide();
        if (!$clicked.parents("#edgeAggrFuncs").length)
            $("#edgeAggrFuncs").find("dd ul").hide();
    });
}

/**
 * If a database is selected, send request to the org.gradoop.demos.grouping.server, asking for the vertex and edge keys of
 * this database. If the request succeeds, initialize the other interface menus.
 */
function sendKeyRequest() {
    var databaseName = getSelectedDatabase();
    if (databaseName != "Select a database") {
        $.post("http://localhost:2342/keys/" + databaseName)
            .done(initializeOtherMenus)
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            });
    }
}


/**
 * Initialize the property key menus, the filter menus and the aggregate function selects.
 * @param keys
 */
function initializeOtherMenus(keys) {
    $("#exec").show();
    $("#wholeGraph").show();
    $(".show").show();
    initializeFilterKeyMenus(keys);
    initializePropertyKeyMenus(keys);
    initializeAggregateFunctionMenus(keys);
}

/**
 * Initialize the filter menus with the labels
 * @param keys labels of the input vertices
 */
function initializeFilterKeyMenus(keys) {

    var vertexFilters = $("#vertexFilters");
    var edgeFilters = $("#edgeFilters");

    // clear previous entries
    vertexFilters.find(".multiSel").children().remove();
    edgeFilters.find(".multiSel").children().remove();

    var vertexFilterSelect = vertexFilters.find("dd .multiSelect ul").empty();
    var edgeFilterSelect = edgeFilters.find("dd .multiSelect ul").empty();

    // add one entry per vertex label
    for (var i = 0; i < keys.vertexLabels.length; i++) {
        var vertexLabel = keys.vertexLabels[i];

        vertexFilterSelect.append(
            '<li><input type="checkbox" value="' + vertexLabel + '"' +
            ' class="checkbox" checked=true/>' + vertexLabel + '</li>');

        vertexFilters.find('.multiSel').append(
            '<span title="' + vertexLabel + '">' + vertexLabel + '</span>');
    }

    // hide the instructions
    vertexFilters.find('.instruction').hide();

    // add one entry per vertex label
    for (var i = 0; i < keys.edgeLabels.length; i++) {
        var edgeLabel = keys.edgeLabels[i];

        edgeFilterSelect.append(
            '<li><input type="checkbox" value="' + edgeLabel + '"' +
            ' class="checkbox" checked=true/>' + edgeLabel + '</li>');

        edgeFilters.find('.multiSel').append(
            '<span title="' + edgeLabel + '">' + edgeLabel + '</span>');
    }

    // hide the instructions
    edgeFilters.find(".instruction").hide();

    // on click, toggle filter menu
    $("#showFilters").on("click", toggleFilterMenu);

    // on click, select filters
    vertexFilters.find(".checkbox").on("click", elementSelected);
    vertexFilters.find(".checkbox").on("click", vertexFilterSelected);
    edgeFilters.find(".checkbox").on("click", elementSelected);
    edgeFilters.find(".checkbox").on("click", edgeFilterSelected);
}

/**
 * Show or hide the filter menu
 */
function toggleFilterMenu() {
    var vertexFilters = $("#vertexFilters");
    var edgeFilters = $("#edgeFilters");
    if (this.checked) {
        vertexFilters.show();
        edgeFilters.show();
    } else {
        vertexFilters.hide();
        edgeFilters.hide();
    }
}

/**
 * Initialize the key propertyKeys menus.
 * @param keys array of vertex and edge keys
 */
function initializePropertyKeyMenus(keys) {

    // get the propertyKeys menus in their current form
    var vertexPropertyKeys = $("#vertexPropertyKeys");
    var edgePropertyKeys = $("#edgePropertyKeys");

    // remove the current keys from the property key menus
    var vertexSelect = vertexPropertyKeys.find("dd .multiSelect ul").empty();
    var edgeSelect = edgePropertyKeys.find("dd .multiSelect ul").empty();

    var vertexLabelHtml = "" +
        '<li><input type ="checkbox" value ="label" class="checkbox"/> label</li>';

    vertexSelect.append(vertexLabelHtml);

    for (var i = 0; i < keys.vertexKeys.length; i++) {
        var vertexKey = keys.vertexKeys[i];
        var propertyLabel = "&lt;";
        // insert an entry into the vertex filter map
        createVertexFilterMapEntry(vertexKey);
        for (var j = 0; j < vertexKey.labels.length; j++) {
            propertyLabel += vertexKey.labels[j];
            if (j < vertexKey.labels.length - 1) {
                propertyLabel += ", ";
            }
        }
        propertyLabel += "&gt;." + vertexKey.name;
        var vertexHtml =
            '<li><input type="checkbox" value="' + vertexKey.name + '" ' +
            ' class="checkbox"/>' + propertyLabel + '</li>';
        vertexSelect.append(vertexHtml);
    }

    var edgeLabelHtml = '' +
        '<li><input type ="checkbox" value ="label" class="checkbox"/> label</li>';

    edgeSelect.append(edgeLabelHtml);

    for (var i = 0; i < keys.edgeKeys.length; i++) {
        var edgeKey = keys.edgeKeys[i];
        var propertyLabel = '&lt;';
        // insert an entry into the edge filter map
        createEdgeFilterMapEntry(edgeKey);
        for (var j = 0; j < edgeKey.labels.length; j++) {
            propertyLabel += edgeKey.labels[j];
            if (j < edgeKey.labels.length - 1) {
                propertyLabel += ", ";
            }
        }
        propertyLabel += '&gt;.' + edgeKey.name;
        var edgeHtml =
            '<li><input type="checkbox" value="' + edgeKey.name + '" ' +
            ' class="checkbox"/>' + propertyLabel + '</li>';
        edgeSelect.append(edgeHtml);
    }

    // show the propertyKeys menus
    vertexPropertyKeys.show();
    edgePropertyKeys.show();

    // remove the currently selected keys, they are saved in <span> elements
    vertexPropertyKeys.find('.multiSel').children().remove();
    edgePropertyKeys.find('.multiSel').children().remove();

    // show instructions
    vertexPropertyKeys.find('.instruction').show();
    edgePropertyKeys.find('.instruction').show();

    vertexPropertyKeys.find('.checkbox').on('click', elementSelected);
    vertexPropertyKeys.find('.checkbox').on('click', setVertexLabel);
    edgePropertyKeys.find('.checkbox').on('click', elementSelected);
    edgePropertyKeys.find('.checkbox').on('click', setEdgeLabel);

}

/**
 * create a new entry in the vertex filter map via a vertex key
 * @param vertexKey key that shall be inserted into the map
 */
function createVertexFilterMapEntry(vertexKey) {

    var vertexKeyObject = {};

    vertexKeyObject.name = vertexKey.name;
    vertexKeyObject.support = 0;

    for (var i = 0; i < vertexKey.labels.length; i++) {
        var label = vertexKey.labels[i];
        vertexKeyObject.support++;
        if (vertexFilterMap[label] == null) {
            var array = [];
            array.push(vertexKeyObject);
            vertexFilterMap[label] = array;
        } else {
            vertexFilterMap[label].push(vertexKeyObject);
        }
    }
}

/**
 * create a new entry in the edge filter map via an edge key
 * @param edgeKey key that shall be inserted into the map
 */
function createEdgeFilterMapEntry(edgeKey) {

    var edgeKeyObject = {};

    edgeKeyObject.name = edgeKey.name;
    edgeKeyObject.support = 0;

    for (var i = 0; i < edgeKey.labels.length; i++) {
        var label = edgeKey.labels[i];
        edgeKeyObject.support++;
        if (edgeFilterMap[label] == null) {
            var array = [];
            array.push(edgeKeyObject);
            edgeFilterMap[label] = array;
        } else {
            edgeFilterMap[label].push(edgeKeyObject);
        }
    }
}

/**
 * function that is executed if a key is selected from any of the 2 propertyKeys boxes
 */

function elementSelected() {
    var title = $(this).val();
    var propertyKeys = $(this).closest('.dropDown');

    // if a key is selected, add it as a span to the title of the property keys box
    // else make the instruction visible
    if ($(this).is(':checked')) {
        var html = '<span title="' + title + '">' + title + '</span>';
        propertyKeys.find('.multiSel').append(html);
        propertyKeys.find('.instruction').hide();
    } else {
        var multiSel = propertyKeys.find('.multiSel');
        multiSel.find('span[title="' + title + '"]').remove();
        if (multiSel.children().length == 0) propertyKeys.find('.instruction').show();
    }
}

/**
 * set the first selected property as vertex label
 * also make it bold in the selection
 */
function setVertexLabel() {
    var selectedLabels = $(this).closest('.dropDown').find('.multiSel span');
    selectedLabels.each(function () {
        $(this).css("font-weight", "normal");
    });
    selectedLabels.first().css("font-weight", "bold");
    vertexLabelKey = selectedLabels.first().text();
}

/**
 * set the first selected property as edge label
 * also make it bold in the selection
 */
function setEdgeLabel() {
    var selectedLabels = $(this).closest('.dropDown').find('.multiSel span');
    selectedLabels.each(function () {
        $(this).css("font-weight", "normal");
    });
    selectedLabels.first().css("font-weight", "bold");
    edgeLabelKey = selectedLabels.first().text();
}

/**
 * function to hide properties of filtered elements
 */

function vertexFilterSelected() {
    if ($(this).is(':checked')) {
        var label = $(this).val();
        for (var i = 0; i < vertexFilterMap[label].length; i++) {

            var keyObject = vertexFilterMap[label][i];
            keyObject.support++;

            var propertyKeys = '#vertexPropertyKeys';
            enablePropertyKey(propertyKeys, keyObject);


            var aggrFuncs = '#vertexAggrFuncs';
            enableAggrFunc(aggrFuncs, keyObject);
        }
    } else {
        var label = $(this).val();
        for (var i = 0; i < vertexFilterMap[label].length; i++) {

            var keyObject = vertexFilterMap[label][i];
            keyObject.support--;

            if (keyObject.support == 0) {
                var propertyKeys = '#vertexPropertyKeys';
                disablePropertyKey(propertyKeys, keyObject);


                var aggrFuncs = '#vertexAggrFuncs';
                disableAggrFunc(aggrFuncs, keyObject);
            }
        }
    }
}

/**
 * function called when a edge filter was selected
 */
function edgeFilterSelected() {
    if ($(this).is(':checked')) {
        var label = $(this).val();
        for (var i = 0; i < edgeFilterMap[label].length; i++) {

            var keyObject = edgeFilterMap[label][i];
            keyObject.support++;

            var propertyKeys = '#edgePropertyKeys';
            enablePropertyKey(propertyKeys, keyObject);


            var aggrFuncs = '#edgeAggrFuncs';
            enableAggrFunc(aggrFuncs, keyObject);
        }
    } else {
        var label = $(this).val();
        for (var i = 0; i < edgeFilterMap[label].length; i++) {

            var keyObject = edgeFilterMap[label][i];
            keyObject.support--;

            if (keyObject.support == 0) {
                var propertyKeys = '#edgePropertyKeys';
                disablePropertyKey(propertyKeys, keyObject);

                var aggrFuncs = '#edgeAggrFuncs';
                disableAggrFunc(aggrFuncs, keyObject);
            }
        }
    }
}

/**
 * Enable a property key in the dropdown menu
 * @param dropdown the dropdown menu
 * @param keyObject the property key object
 */
function enablePropertyKey(dropdown, keyObject) {
    var name = keyObject.name;
    var checkbox = $(dropdown)
        .find('dd .multiSelect ul li input[value = "' + name + '"]')
        .attr('disabled', false);
    checkbox.parent().css('color', 'black');

}

/**
 * Disable a property key in the dropdown menu
 * @param dropdown the dropdown menu
 * @param keyObject the property key object
 */
function disablePropertyKey(dropdown, keyObject) {

    var propertyDropdown = $(dropdown);

    var name = keyObject.name;
    var checkbox = propertyDropdown
        .find('dd .multiSelect ul li input[value = "' + name + '"]')
        .attr('disabled', true);
    checkbox.attr('checked', false);
    checkbox.parent().css('color', 'grey');

    propertyDropdown.find('span[title="' + name + '"]').remove();

    if (propertyDropdown.find('.multiSel').children().length == 0)
        propertyDropdown.find('.instruction').show();
}

/**
 * Enable a aggregation functions of a property key in the dropdown menu
 * @param dropdown the dropdown menu
 * @param keyObject the property key
 */
function enableAggrFunc(dropdown, keyObject) {
    var name = keyObject.name;
    for (var i = 0; i < aggrPrefixes.length; i++) {
        var aggrName = aggrPrefixes[i] + name;
        var checkbox = $(dropdown)
            .find('dd .multiSelect ul li input[value = "' + aggrName + '"]')
            .attr('disabled', false);
        checkbox.parent().css('color', 'black');
    }
}

/**
 * Disable the aggregation functions of a property key in the dropdown menu
 * @param dropdown the dropdown menu
 * @param keyObject the property key
 */
function disableAggrFunc(dropdown, keyObject) {

    var propertyDropdown = $(dropdown);

    var name = keyObject.name;

    for (var i = 0; i < aggrPrefixes.length; i++) {

        var aggrName = aggrPrefixes[i] + name;

        var checkbox = propertyDropdown
            .find('dd .multiSelect ul li input[value = "' + aggrName + '"]')
            .attr('disabled', true);
        checkbox.attr('checked', false);
        checkbox.parent().css('color', 'grey');

        propertyDropdown.find('span[title="' + aggrName + '"]').remove();

        if (propertyDropdown.find('.multiSel').children().length == 0)
            propertyDropdown.find('.instruction').show();
    }

}

/**
 * initialize the aggregate function propertyKeys menu
 */
function initializeAggregateFunctionMenus(keys) {
    var vertexAggrFuncs = $("#vertexAggrFuncs");
    var edgeAggrFuncs = $("#edgeAggrFuncs");

    // remove the current keys from the property key menus
    var vertexSelect = vertexAggrFuncs.find("dd .multiSelect ul").empty();
    var edgeSelect = edgeAggrFuncs.find("dd .multiSelect ul").empty();

    // add count as default aggregation function
    var vertexLabelHtml = '' +
        '<li><input type ="checkbox" value ="count" class="checkbox"/> count</li>';

    vertexSelect.append(vertexLabelHtml);

    // add aggregation functions for each numerical property
    for (var i = 0; i < keys.vertexKeys.length; i++) {
        var vertexKey = keys.vertexKeys[i];
        if (vertexKey.numerical == true) {
            for (var j = 0; j < aggrPrefixes.length; j++) {
                var aggrFunc = aggrPrefixes[j] + vertexKey.name;
                var html = '<li><input type="checkbox" value="' + aggrFunc +
                    '" class="checkbox"/>' + aggrFunc + '</li>';
                vertexSelect.append(html);
            }
        }
    }

    // add count as default aggregation function
    var edgeLabelHtml = '<li><input type ="checkbox" value ="count" class="checkbox"/>count</li>';

    edgeSelect.append(edgeLabelHtml);

    // add aggregation functions for each numerical property
    for (var i = 0; i < keys.edgeKeys.length; i++) {
        var edgeKey = keys.edgeKeys[i];
        if (edgeKey.numerical == true) {
            for (var j = 0; j < aggrPrefixes.length; j++) {
                var aggrFunc = aggrPrefixes[j] + edgeKey.name;
                var html = '<li><input type="checkbox" value="' + aggrFunc +
                    '" class="checkbox"/>' + aggrFunc + '</li>';
                edgeSelect.append(html);
            }
        }
    }

    // show the propertyKeys menus
    vertexAggrFuncs.show();
    edgeAggrFuncs.show()

    // remove the currently selected keys, they are saved in <span> elements
    vertexAggrFuncs.find('.multiSel').children().remove();
    edgeAggrFuncs.find('.multiSel').children().remove();

    // show instructions
    vertexAggrFuncs.find('.instruction').show();
    edgeAggrFuncs.find('.instruction').show();

    vertexAggrFuncs.find('.checkbox').on('click', elementSelected);
    edgeAggrFuncs.find('.checkbox').on('click', elementSelected);
}

/**
 * hide elements when the page is loaded for the first time
 */
function hideElements() {
    $('#loading').hide();
    $('.show').hide();
    $('.dropDown').hide();
    $('.aggrFuncs').hide();
}

/**
 * get the selected database
 * @returns selected database name
 */
function getSelectedDatabase() {
    return $("#databases").find("option:selected").text();
}

/**
 *  * get the selected vertex keys
 * @returns selected vertex keys
 */
function getSelectedVertexKeys() {
    return $.map(
        $("#vertexPropertyKeys").find("dt a .multiSel span"),
        function (item) {
            return $(item).text();
        });
}

/**
 * get the selected edge keys
 * @returns selected edge keys
 */
function getSelectedEdgeKeys() {
    return $.map(
        $("#edgePropertyKeys").find("dt a .multiSel span"),
        function (item) {
            return $(item).text();
        });
}

/**
 * get the selected vertex aggregate function
 * @returns  name of the selected vertex aggregate function
 */
function getSelectedVertexAggregateFunctions() {
    return $.map(
        $("#vertexAggrFuncs").find("dt a .multiSel span"),
        function (item) {
            return $(item).text();
        });
}

/**
 * get the selected edge aggregate function
 * @returns name of the selected edge aggregate function
 */
function getSelectedEdgeAggregateFunctions() {
    return $.map(
        $("#edgeAggrFuncs").find("dt a .multiSel span"),
        function (item) {
            return $(item).text();
        });
}

/**
 * get the selected vertex filters
 * @returns selected edge filters
 */
function getSelectedVertexFilters() {
    if ($('#showFilters').is(':checked')) {
        return $.map(
            $("#vertexFilters").find("dt a .multiSel span"),
            function (item) {
                return $(item).text();
            });
    } else {
        return [];
    }
}

/**
 * get the selected edge filters
 * @returns selected edge filters
 */
function getSelectedEdgeFilters() {
    if ($('#showFilters').is(':checked')) {
        return $.map(
            $("#edgeFilters").find("dt a .multiSel span"),
            function (item) {
                return $(item).text();
            });

    } else {
        return [];
    }
}

/**
 * Checks if a grouping request is valid (all fields are set).
 * @param request
 * @returns true, if the request was valid
 */
function isValidRequest(request) {
    return (request.dbName != "Select a database") &&
        (request.vertexKeys.length > 0);
}

/**
 * Reset the page on reload
 */
function resetPage() {
    $("#showFilters").prop("checked", false);
    $("#showEdgeLabels").prop("checked", false);
    $("#showCountAsSize").prop("checked", false);
    $("#databases").val("default");
}

/**
 * Generate a random color for each label
 * @param labels array of labels
 */
function generateRandomColors(labels) {
    colorMap = {};
    labels.forEach(function (label) {
        var r = 0;
        var g = 0;
        var b = 0;
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
 * @returns the label of the element
 */
function getLabel(element, key, useDefaultLabel) {
    var label = "";
    if (!useDefaultLabel && key != "label") {
        label += element.data("properties")[key];
    } else {
        label += element.data("label");
    }
    return label;
}