$(document).ready(function () {

    //hide everything that is invisible at the beginning
    hideElements();

    //get the available databases from the server
    //if the request is a success, add them to the database dropdown menu
    $.get("http://localhost:9998/databases/")
        .done(initializeDatabaseMenu)
        .fail(function (jqXHR, textStatus, errorThrown) {
            alert(errorThrown);
        });


    $("#exec").bind("click", function () {

        var request = {};

        request.dbName = getSelectedDatabase();
        request.vertexKeys = getSelectedVertexKeys();
        request.edgeKeys = getSelectedEdgeKeys();
        request.vertexAggrFunc = getSelectedVertexAggregateFunction();
        request.edgeAggrFunc = getSelectedEdgeAggregateFunction();

        if(isValidRequest(request)) {
            //Show a loading gif
            $('#loading').show();

            //Send a POST request to the server

            $.ajax({
                url: 'http://localhost:9998/data/',
                datatype: 'text',
                type: "post",
                contentType: "application/json",
                data: JSON.stringify(request),
                success: showGraph
            });
        } else {
            alert("Not a valid request.");
        }

    });
});

function showGraph(data) {


    //hide the loading gif
    $('#loading').hide();

    //get data from the servers response
    var nodes = data.nodes;
    var edges = data.edges;

    //update vertex and edge count
    var rows = '';
    rows += '<tr><td>Vertex Count</td><td>:</td><td>'
        + nodes.length + '</td></tr>';
    rows += '<tr><td>Edge Count</td><td>:</td><td>'
        + edges.length + '</td></tr>';
    $('#stats').html(rows);
    //start cytoscape
    $(function () {
        cytoscape({
            container: document.getElementById('canvas'),
            style: cytoscape.stylesheet()
                .selector('node')
                .css({

                    //define label content and font
                    'content': function (node) {
                        var labelString = '';
                        labelString += node.data('label') + " ";
                        var properties = node.data('properties');

                        var aggregate = null;

                        if(properties['count'] != null) {
                            aggregate = properties['count'];
                        } else if (properties['min'] != null ) {
                            aggregate = properties['min'];
                        } else if (properties['max'] != null ) {
                            aggregate = properties['max'];
                        } else if (properties['sum'] != null ) {
                            aggregate = properties['sum'];
                        }

                        if (aggregate != null) {
                            for (var property in properties) {
                                var key = "" + property;
                                if (!($.inArray(key, ['count', 'min', 'max', 'sum']) > -1)  ) {
                                    var value = properties[key];
                                    if (value != '__NULL') {
                                        labelString += properties[key] + " ";
                                    }
                                }
                            }
                            labelString += '(' + aggregate + ')';
                        }

                        return labelString;
                    },

                    'text-valign': 'center',
                    'color': 'black',
                    'background-color': '#ADD8E6',

                    //size of nodes is determined by property count
                    //count specifies that the node stands for
                    //1 or more other nodes
                    'width': function (node) {
                        var count = node.data('properties')['count'];
                        if (count != null) {
                            //surface of nodes is proportional to count
                            return Math.sqrt(count * 10000 / Math.PI) + 'px';
                        }
                        else {
                            return '60px';
                        }
                    },

                    'height': function (node) {
                        var count = node.data('properties')['count'];
                        if (count != null) {
                            return Math.sqrt(count * 10000 / Math.PI) + 'px';
                        }
                        else {
                            return '60px';
                        }
                    },
                    'text-wrap': 'wrap'
                })
                .selector('edge')
                .css({
                    //layout of edge and edge label
                    'content': function (edge) {

                        //at the moment, edge labels are too noisy to be useful
                        return "";

                        var labelString = '';
                        labelString += edge.data('label') + " ";
                        var properties = edge.data('properties');

                        var aggregate = null;

                        if(properties['count'] != null) {
                            aggregate = properties['count'];
                        } else if (properties['min'] != null ) {
                            aggregate = properties['min'];
                        } else if (properties['max'] != null ) {
                            aggregate = properties['max'];
                        } else if (properties['sum'] != null ) {
                            aggregate = properties['sum'];
                        }

                        if (aggregate != null) {
                            for (var property in properties) {
                                var key = "" + property;
                                if (!($.inArray(key, ['count', 'min', 'max', 'sum']) > -1)  ) {
                                    var value = properties[key];
                                    if (value != '__NULL') {
                                        labelString += properties[key] + " ";
                                    }
                                }
                            }
                            labelString += '(' + aggregate + ')';
                        }

                        return labelString;
                    },
                    'line-color': '#999',
                    'stroke-width': 2,
                    'target-arrow-shape': 'triangle',
                    'target-arrow-color': '#000'
                })
                //properties of edges and nodes in special states
                //e.g. invisible or faded
                .selector(':selected')
                .css({
                    'background-color': 'black',
                    'line-color': 'black',
                    'target-arrow-color': 'black',
                    'source-arrow-color': 'black'
                })
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
            elements: {
                nodes: nodes,
                edges: edges
            },

            ready: function () {
                window.cy = this;
                cy.elements().unselectify();
                //if a node is selected, fade all edges and nodes
                //that are not in direct neighborhood of the node
                cy.on('tap', 'node', function (e) {
                    var node = e.cyTarget;
                    var neighborhood = node.neighborhood().add(node);

                    cy.elements().addClass('faded');
                    neighborhood.removeClass('faded');
                });
                //remove fading by clicking somewhere else
                cy.on('tap', function (e) {

                    if (e.cyTarget === cy) {
                        cy.elements().removeClass('faded');
                    }
                });
                //add a property box whenever a node or edge is
                //selected
                cy.elements().qtip({
                    content: function () {
                        var qtipText = '';
                        for (var key in this.data()) {
                            if (key != 'properties' && key != 'pie_parameters') {
                                qtipText += key + " : " + this.data(key) + '<br>';
                            }
                        }
                        var properties = this.data('properties');
                        for (var property in properties) {
                            qtipText += property + " : " + properties[property] + '<br>';
                        }
                        return qtipText;
                    },
                    position: {
                        my: 'top center',
                        at: 'bottom center'
                    },
                    style: {
                        classes: 'qtip-bootstrap'
                    }
                });
                //options for the force layout
                var options = {
                    name: 'cose',

                    //called on `layoutready`
                    ready: function () {
                    },

                    //called on `layoutstop`
                    stop: function () {
                    },

                    //whether to animate while running the layout
                    animate: true,

                    //number of iterations between consecutive screen positions update (0 ->
                    // only updated on the end)
                    refresh: 4,

                    //whether to fit the network view after when done
                    fit: true,

                    //padding on fit
                    padding: 30,

                    //constrain layout bounds; { x1, y1, x2, y2 } or { x1, y1, w, h }
                    boundingBox: undefined,

                    //whether to randomize node positions on the beginning
                    randomize: true,

                    //whether to use the JS console to print debug messages
                    debug: false,

                    //node repulsion (non overlapping) multiplier
                    nodeRepulsion: 8000000,

                    //node repulsion (overlapping) multiplier
                    nodeOverlap: 10,

                    //ideal edge (non nested) length
                    idealEdgeLength: 1,

                    //divisor to compute edge forces
                    edgeElasticity: 100,

                    //nesting factor (multiplier) to compute ideal edge length for nested edges
                    nestingFactor: 5,

                    //gravity force (constant)
                    gravity: 250,

                    //maximum number of iterations to perform
                    numIter: 100,

                    //initial temperature (maximum node displacement)
                    initialTemp: 200,

                    //cooling factor (how the temperature is reduced between consecutive iterations
                    coolingFactor: 0.95,

                    //lower temperature threshold (below this point the layout will end)
                    minTemp: 1.0
                };
                cy.layout(options);

            }
        });

    });
}

/**
 * Function for initializing the database dropdown menu. Adds on-click listener to the elements.
 * @param databases list of all available databases
 */
function initializeDatabaseMenu(databases) {
    var databaseSelect = $("#databases");
    databaseSelect.show();
    for (var i = 0; i < databases.length; i++) {
        var name = databases[i];
        databaseSelect.append('<option value="' + name + '">' + name + '</option>');
    }
    databaseSelect.children().on('click', sendKeyRequest);
}

/**
 * If a database is selected, send request to the server, asking for the vertex and edge keys of
 * this database. If the request succeeds, initialize the other interface menus.
 */
function sendKeyRequest() {
    var databaseName = getSelectedDatabase();
    if (databaseName != "Select a database") {
        $.post("http://localhost:9998/keys/" + databaseName)
            .done(initializeOtherMenus)
            .fail(function (jqXHR, textStatus, errorThrown) {
                alert(errorThrown);
            });
    }
}

/**
 * Initialize the dropdown menus for the keys and the aggregation functions.
 * @param keys
 */
function initializeOtherMenus(keys) {
    initializeDropDownMenus(keys);
    initializeAggregateFunctionSelect();
}

/**
 * Initialize the key dropdown menus.
 * @param keys array of vertex and edge keys
 */
function initializeDropDownMenus(keys) {

    //get the dropdown menus in their current form
    var vertexDropdown = $("#vertexDropdown");
    var edgeDropdown = $("#edgeDropdown");

    //remove the current keys from the dropdown menus
    var vertexSelect = vertexDropdown.find("dd .multiSelect ul").empty();
    var edgeSelect = edgeDropdown.find("dd .multiSelect ul").empty();

    //add the new keys to the dropdown menus, the property data-numerical holds the information
    //if the property is of numerical type

    var vertexLabelHtml = '' +
        '<li><input type ="checkbox" value ="label" data-numerical="false" /> label</li>';

    vertexSelect.append(vertexLabelHtml);

    for (var i = 0; i < keys.vertexKeys.length; i++) {
        var vertexKey = keys.vertexKeys[i];
        var vertexHtml =
            '<li><input type="checkbox" value="' + vertexKey.name + '" ' +
            'data-numerical="' + vertexKey.numerical + '"/>'
             + '&lt;' + vertexKey.labels + '&gt;.' + vertexKey.name +
            '</li>';
        vertexSelect.append(vertexHtml);
    }

    var edgeLabelHtml = '' +
        '<li><input type ="checkbox" value ="label" data-numerical="false" /> label</li>';

    edgeSelect.append(edgeLabelHtml);

    for (var j = 0; j < keys.edgeKeys.length; j++) {
        var edgeKey = keys.edgeKeys[j];
        var edgeHtml =
            '<li><input type="checkbox" value="' + edgeKey.name + '" ' +
            'data-numerical="' + edgeKey.numerical + '"/>'
            + '&lt;' + edgeKey.labels + '&gt;.' +  edgeKey.name + '</li>';
        edgeSelect.append(edgeHtml);
    }

    //show the dropdown menus
    $('.dropdown').show();

    //remove the currently selected keys, they are saved in <span> elements
    $('.multiSel').children().remove();

    //show instructions
    $('.instruction').show();

    $('input[type="checkbox"]').on('click', keySelected);

    $(vertexDropdown).find('input[type="checkbox"]').on('click', vertexKeySelected);
    $(edgeDropdown).find('input[type="checkbox"]').on('click', edgeKeySelected);

    //on click, the dropdown menus open
    $('.dropdown dt a').on('click', function () {
        $(this).closest('.dropdown').find("ul").slideToggle('fast');
    });

    //if the document is clicked anywhere else, close the dropdown menus
    $(document).bind('click', function (e) {
        var $clicked = $(e.target);
        if (!$clicked.parents().hasClass("dropdown")) $(".dropdown dd ul").hide();
    });

}

/**
 * function that is executed if a key is selected from vertex key dropdown box
 */
function vertexKeySelected() {
    //get the vertex aggregation dropdown menu
    var vertexAggrFuncs = $('#vertexAggrFuncs');
    if ($(this).attr('data-numerical') == "true") {
        var val = $(this).val();
        //if the clicked value is checked, add aggregation function choices, else remove them
        if (this.checked) {
            var minHtml = '<option value="min ' + val + '">min ' + val + '</option>';
            vertexAggrFuncs.append(minHtml);
            var maxHtml = '<option value="max ' + val + '">max ' + val + '</option>';
            vertexAggrFuncs.append(maxHtml);
            var sumHtml = '<option value="sum ' + val + '">sum ' + val + '</option>';
            vertexAggrFuncs.append(sumHtml);
        } else {
            vertexAggrFuncs.find('option[value="min ' + val + '"]').remove();
            vertexAggrFuncs.find('option[value="max ' + val + '"]').remove();
            vertexAggrFuncs.find('option[value="sum ' + val + '"]').remove();
        }
    }

}

/**
 * function that is executed if a key is selected from edge key dropdown box
 */
function edgeKeySelected() {
    //get the edge aggregation dropdown menu
    var edgeAggrFuncs = $('#edgeAggrFuncs');
    if ($(this).attr('data-numerical') == 'true') {
        var val = $(this).val();
        //if the clicked value is checked, add aggregation function choices, else remove them
        if (this.checked) {
            var minHtml = '<option value="min ' + val + '">min ' + val + '</option>';
            edgeAggrFuncs.append(minHtml);
            var maxHtml = '<option value="max ' + val + '">max ' + val + '</option>';
            edgeAggrFuncs.append(maxHtml);
            var sumHtml = '<option value="sum ' + val + '">sum ' + val + '</option>';
            edgeAggrFuncs.append(sumHtml);
        } else {
            edgeAggrFuncs.find('option[value="min ' + val + '"]').remove();
            edgeAggrFuncs.find('option[value="max ' + val + '"]').remove();
            edgeAggrFuncs.find('option[value="sum ' + val + '"]').remove();
        }
    }
}

/**
 * function that is executed if a key is selected from any of the 2 dropdown boxes
 * used to avoid code duplication
 */

function keySelected() {
    var title = $(this).val() + ",";
    var dropdown = $(this).closest('.dropdown');

    //if a key is selected, add it as a span to the title of the dropdown box
    //else make the instruction visible
    if ($(this).is(':checked')) {
        var html = '<span title="' + title + '">' + title + '</span>';
        dropdown.find('.multiSel').append(html);
        dropdown.find('.instruction').hide();
    } else {
        var multiSel = dropdown.find('.multiSel');
        multiSel.find('span[title="' + title + '"]').remove();
        if (multiSel.children().length == 0) dropdown.find('.instruction').show();
    }
}

/**
 * initialize the aggregate function dropdown menu
 */
function initializeAggregateFunctionSelect() {

    var aggrFuncs = $('.aggrFuncs');
    //remove all choices, except for the instruction one
    $(aggrFuncs).find('option:not(:disabled)').remove();

    aggrFuncs.show();

    //add count by default
    var countHtml = '<option value="count">count</option>';
    aggrFuncs.append(countHtml)
}

/**
 * hide elements when the page is loaded for the first time
 */
function hideElements() {
    $('#loading').hide();
    $('.dropdown').hide();
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
 * get the selected vertex keys
 * @returns array of selected vertex keys
 */
function getSelectedVertexKeys() {
    return $.map(
        $("#vertexDropdown").find("dt a .multiSel span"),
        function (item) {
            return $(item).text().slice(0, -1);
        });
}

/**
 * get the selected edge keys
 * @returns array of selected edge keys
 */
function getSelectedEdgeKeys() {
    return $.map(
        $("#edgeDropdown").find("dt a .multiSel span"),
        function (item) {
            return $(item).text().slice(0, -1);
        });
}

/**
 * get the selected vertex aggregate function
 * @returns name of the selected vertex aggregate function
 */
function getSelectedVertexAggregateFunction() {
    return $("#vertexAggrFuncs").find("option:selected").text();
}

/**
 * get the selected edge aggregate function
 * @returns name of the selected edge aggregate function
 */
function getSelectedEdgeAggregateFunction() {
    return $("#edgeAggrFuncs").find("option:selected").text();
}

/**
 * Checks if a grouping request is valid (all fields are set).
 * @param request
 * @returns {boolean} true, if the request was valid
 */
function isValidRequest(request) {
    return (request.dbName != "Select a database") &&
        (!(request.vertexKeys.length == 0)) &&
        (!(request.edgeKeys.length == 0)) &&
        (request.vertexAggrFunc != "Select a vertex aggregate function") &&
        (request.edgeAggrFunc != "Select an edge aggregate function");
}