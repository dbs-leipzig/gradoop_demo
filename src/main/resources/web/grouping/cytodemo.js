var aggrPrefixes = ["min ", "max ", "sum "];

var vertexFilterMap = {};
var edgeFilterMap = {};


$(document).ready(function () {

    //hide everything that is invisible at the beginning
    hideElements();
    //reset the webpage on reload, this is to keep the browser from trying to keep the current state
    resetPage();

    //get the available databases from the org.gradoop.demos.grouping.server
    //if the request is a success, add them to the database propertyKeys menu
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
        request.vertexAggrFuncs = getSelectedVertexAggregateFunctions();
        request.edgeAggrFuncs = getSelectedEdgeAggregateFunctions();
        request.vertexFilters = getSelectedVertexFilters();
        request.edgeFilters = getSelectedEdgeFilters();

        if (isValidRequest(request)) {
            //Show a loading gif
            $('#loading').show();

            //Send a POST request to the org.gradoop.demos.grouping.server

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

                        if (properties['count'] != null) {
                            aggregate = properties['count'];
                        } else if (properties['min'] != null) {
                            aggregate = properties['min'];
                        } else if (properties['max'] != null) {
                            aggregate = properties['max'];
                        } else if (properties['sum'] != null) {
                            aggregate = properties['sum'];
                        }

                        if (aggregate != null) {
                            for (var property in properties) {
                                var key = "" + property;
                                if (!($.inArray(key, ['count', 'min', 'max', 'sum']) > -1)) {
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

                        if (properties['count'] != null) {
                            aggregate = properties['count'];
                        } else if (properties['min'] != null) {
                            aggregate = properties['min'];
                        } else if (properties['max'] != null) {
                            aggregate = properties['max'];
                        } else if (properties['sum'] != null) {
                            aggregate = properties['sum'];
                        }

                        if (aggregate != null) {
                            for (var property in properties) {
                                var key = "" + property;
                                if (!($.inArray(key, ['count', 'min', 'max', 'sum']) > -1)) {
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
                        classes: 'MyQtip'
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
    databaseSelect.children().on('click', sendKeyRequest);

    //on click, the dropdown menus open, this has to be done here so it is done only once
    $('.dropDown').find('dt a').on('click', function () {
        $(this).closest('.dropDown').find('ul').slideToggle('fast');
    });

    $(document).bind('click', function (e) {
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
        $.post("http://localhost:9998/keys/" + databaseName)
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
    initializeFilterKeyMenus(keys);
    initializePropertyKeyMenus(keys);
    initializeAggregateFunctionMenus(keys);
}

function initializeFilterKeyMenus(keys) {

    var vertexFilters = $('#vertexFilters');
    var edgeFilters = $('#edgeFilters');

    vertexFilters.find('.multiSel').children().remove();
    edgeFilters.find('.multiSel').children().remove();

    var vertexFilterSelect = vertexFilters.find("dd .multiSelect ul").empty();
    var edgeFilterSelect = edgeFilters.find("dd .multiSelect ul").empty();

    for (var i = 0; i < keys.vertexLabels.length; i++) {
        var vertexLabel = keys.vertexLabels[i];

        vertexFilterSelect.append(
            '<li><input type="checkbox" value="' + vertexLabel + '"' +
            ' class="checkbox" checked=true/>' + vertexLabel + '</li>');

        vertexFilters.find('.multiSel').append(
            '<span title="' + vertexLabel + '">' + vertexLabel + '</span>');
    }


    vertexFilters.find('.instruction').hide();

    for (var i = 0; i < keys.edgeLabels.length; i++) {
        var edgeLabel = keys.edgeLabels[i];

        edgeFilterSelect.append(
            '<li><input type="checkbox" value="' + edgeLabel + '"' +
            ' class="checkbox" checked=true/>' + edgeLabel + '</li>');

        edgeFilters.find('.multiSel').append(
            '<span title="' + edgeLabel + '">' + edgeLabel + '</span>');
    }

    edgeFilters.find('.instruction').hide();

    var filter = $('#filter');
    filter.show();
    $('#showFilters').on('click', toggleFilterMenu);


    vertexFilters.find('.checkbox').on('click', elementSelected);
    vertexFilters.find('.checkbox').on('click', vertexFilterSelected);
    edgeFilters.find('.checkbox').on('click', elementSelected);
    edgeFilters.find('.checkbox').on('click', edgeFilterSelected);
}

function toggleFilterMenu() {
    var vertexFilters = $('#vertexFilters');
    var edgeFilters = $('#edgeFilters');
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

    //get the propertyKeys menus in their current form
    var vertexPropertyKeys = $("#vertexPropertyKeys");
    var edgePropertyKeys = $("#edgePropertyKeys");

    //remove the current keys from the property key menus
    var vertexSelect = vertexPropertyKeys.find("dd .multiSelect ul").empty();
    var edgeSelect = edgePropertyKeys.find("dd .multiSelect ul").empty();

    var vertexLabelHtml = '' +
        '<li><input type ="checkbox" value ="label" class="checkbox"/> label</li>';

    vertexSelect.append(vertexLabelHtml);

    for (var i = 0; i < keys.vertexKeys.length; i++) {
        var vertexKey = keys.vertexKeys[i];
        var propertyLabel = '&lt;';
        //insert an entry into the vertex filter map
        createVertexFilterMapEntry(vertexKey);
        for (var j = 0; j < vertexKey.labels.length; j++) {
            propertyLabel += vertexKey.labels[j];
            if (j < vertexKey.labels.length - 1) {
                propertyLabel += ", ";
            }
        }
        propertyLabel += '&gt;.' + vertexKey.name;
        var vertexHtml =
            '<li><input type="checkbox" value="' + vertexKey.name + '" ' +
            ' class="checkbox"/>' + propertyLabel + '</li>';
        vertexSelect.append(vertexHtml);
    }

    var edgeLabelHtml = '' +
        '<li><input type ="checkbox" value ="label" class="checkbox"/>' +
        ' label</li>';

    edgeSelect.append(edgeLabelHtml);

    for (var i = 0; i < keys.edgeKeys.length; i++) {
        var edgeKey = keys.edgeKeys[i];
        var propertyLabel = '&lt;';
        //insert an entry into the edge filter map
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

    //show the propertyKeys menus
    vertexPropertyKeys.show();
    edgePropertyKeys.show();

    //remove the currently selected keys, they are saved in <span> elements
    vertexPropertyKeys.find('.multiSel').children().remove();
    edgePropertyKeys.find('.multiSel').children().remove();

    //show instructions
    vertexPropertyKeys.find('.instruction').show();
    edgePropertyKeys.find('.instruction').show();

    vertexPropertyKeys.find('.checkbox').on('click', elementSelected);
    edgePropertyKeys.find('.checkbox').on('click', elementSelected);

}

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

    //if a key is selected, add it as a span to the title of the property keys box
    //else make the instruction visible
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

// function to hide properties of filtered elements

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

function enablePropertyKey(dropdown, keyObject) {
    var name = keyObject.name;
    var checkbox =  $(dropdown)
        .find('dd .multiSelect ul li input[value = "' + name + '"]')
        .attr('disabled', false);
    checkbox.parent().css('color','black');

}

function disablePropertyKey(dropdown, keyObject) {

    var propertyDropdown = $(dropdown);

    var name = keyObject.name;
    var checkbox =  propertyDropdown
        .find('dd .multiSelect ul li input[value = "' + name + '"]')
        .attr('disabled', true);
    checkbox.attr('checked', false);
    checkbox.parent().css('color','grey');

    propertyDropdown.find('span[title="' + name + '"]').remove();

    if (propertyDropdown.find('.multiSel').children().length == 0)
        propertyDropdown.find('.instruction').show();


}

function enableAggrFunc(dropdown, keyObject) {
    var name = keyObject.name;
    for(var i=0;i<aggrPrefixes.length;i++) {
        var aggrName = aggrPrefixes[i] + name;
        var checkbox =  $(dropdown)
            .find('dd .multiSelect ul li input[value = "' + aggrName + '"]')
            .attr('disabled', false);
        checkbox.parent().css('color','black');
    }
}

function disableAggrFunc(dropdown, keyObject) {

    var propertyDropdown = $(dropdown);

    var name = keyObject.name;

    for(var i=0;i<aggrPrefixes.length;i++) {

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

    //remove the current keys from the property key menus
    var vertexSelect = vertexAggrFuncs.find("dd .multiSelect ul").empty();
    var edgeSelect = edgeAggrFuncs.find("dd .multiSelect ul").empty();

    var vertexLabelHtml = '' +
        '<li><input type ="checkbox" value ="count" class="checkbox"/> count</li>';

    vertexSelect.append(vertexLabelHtml);

    for (var i = 0; i < keys.vertexKeys.length; i++) {
        var vertexKey = keys.vertexKeys[i];
        if (vertexKey.numerical == true) {
            for(var j=0;j<aggrPrefixes.length;j++) {
                var aggrFunc = aggrPrefixes[j] + vertexKey.name;
                var html = '<li><input type="checkbox" value="' + aggrFunc +
                    '" class="checkbox"/>' + aggrFunc + '</li>';
                vertexSelect.append(html);
            }
        }
    }


    var edgeLabelHtml = '<li><input type ="checkbox" value ="count" class="checkbox"/>count</li>';

    edgeSelect.append(edgeLabelHtml);

    for (var i = 0; i < keys.edgeKeys.length; i++) {
        var edgeKey = keys.edgeKeys[i];
        if (edgeKey.numerical == true) {
            for(var j=0;j<aggrPrefixes.length;j++) {
                var aggrFunc = aggrPrefixes[j] + edgeKey.name;
                var html = '<li><input type="checkbox" value="' + aggrFunc +
                    '" class="checkbox"/>' + aggrFunc + '</li>';
                edgeSelect.append(html);
            }
        }
    }

    //show the propertyKeys menus
    vertexAggrFuncs.show();
    edgeAggrFuncs.show()

    //remove the currently selected keys, they are saved in <span> elements
    vertexAggrFuncs.find('.multiSel').children().remove();
    edgeAggrFuncs.find('.multiSel').children().remove();

    //show instructions
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
    $('#filter').hide();
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
 * get the selected vertex keys
 * @returns array of selected vertex keys
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
 * @returns array of selected edge keys
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
 * @returns name of the selected vertex aggregate function
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
 * @returns {boolean} true, if the request was valid
 */
function isValidRequest(request) {
    return (request.dbName != "Select a database") &&
        (request.vertexKeys.length > 0);
}

function resetPage() {
    $('#showFilters').prop("checked", false);
    $("#databases").val("default");
}
