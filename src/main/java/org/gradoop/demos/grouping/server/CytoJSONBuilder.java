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
 * along with Gradoop.  If not, see <http://www.gnu.org/licenses/>.
 */

package org.gradoop.demos.grouping.server;

import org.codehaus.jettison.json.JSONArray;
import org.codehaus.jettison.json.JSONException;
import org.codehaus.jettison.json.JSONObject;
import org.gradoop.common.model.impl.pojo.Edge;
import org.gradoop.common.model.impl.pojo.GraphHead;
import org.gradoop.common.model.impl.pojo.Vertex;
import org.gradoop.common.model.impl.properties.Property;

import java.util.Iterator;
import java.util.List;

/**
 * Converts a logical graph or a read JSON into a cytoscape-conform JSON.
 */

public class CytoJSONBuilder {
  /**
   * Key for vertex, edge and graph id.
   */
  private static final String IDENTIFIER = "id";
  /**
   * Key for the type of the returned JSON, either graph or collection.
   */
  private static final String TYPE = "type";
  /**
   * Key for meta Json object.
   */
  private static final String META = "meta";
  /**
   * Key for data Json object.
   */
  private static final String DATA = "data";
  /**
   * Key for vertex, edge and graph label.
   */
  private static final String LABEL = "label";
  /**
   * Key for graph identifiers at vertices and edges.
   */
  private static final String GRAPHS = "graphs";
  /**
   * Key for properties of graphs, vertices and edges.
   */
  private static final String PROPERTIES = "properties";
  /**
   * Key for vertex identifiers at graphs.
   */
  private static final String VERTICES = "nodes";
  /**
   * Key for edge identifiers at graphs.
   */
  private static final String EDGES = "edges";
  /**
   * Key for edge source vertex id.
   */
  private static final String EDGE_SOURCE = "source";
  /**
   * Key for edge target vertex id.
   */
  private static final String EDGE_TARGET = "target";

  /**
   * Takes a logical graph and converts it into a cytoscape-conform JSON.
   *
   * @param graphHead the graph head
   * @param vertices  the vertices
   * @param edges     the edges
   * @return a cytoscape-conform JSON
   * @throws JSONException if the creation of the JSON fails
   */
  String getJSON(GraphHead graphHead, List<Vertex> vertices, List<Edge> edges) throws
    JSONException {

    JSONObject returnedJSON = new JSONObject();

    returnedJSON.put(TYPE, "graph");

    JSONArray graphArray = new JSONArray();
    JSONObject graphObject = new JSONObject();
    JSONObject graphProperties = new JSONObject();
    graphObject.put(IDENTIFIER, graphHead.getId());
    graphObject.put(LABEL, graphHead.getLabel());
    if (graphHead.getProperties() != null) {
      for (Property prop : graphHead.getProperties()) {
        graphProperties.put(prop.getKey(), prop.getValue());
      }
    }
    graphObject.put(PROPERTIES, graphProperties);
    graphArray.put(graphObject);

    returnedJSON.put(GRAPHS, graphArray);

    JSONArray vertexArray = new JSONArray();
    for (Vertex vertex : vertices) {
      JSONObject vertexObject = new JSONObject();
      JSONObject vertexData = new JSONObject();

      vertexData.put(IDENTIFIER, vertex.getId());
      vertexData.put(LABEL, vertex.getLabel());
      JSONObject vertexProperties = new JSONObject();
      if (vertex.getProperties() != null) {
        for (Property prop : vertex.getProperties()) {
          vertexProperties.put(prop.getKey(), prop.getValue());
        }
      }
      vertexData.put(PROPERTIES, vertexProperties);
      vertexObject.put(DATA, vertexData);
      vertexArray.put(vertexObject);
    }
    returnedJSON.put(VERTICES, vertexArray);

    JSONArray edgeArray = new JSONArray();
    for (Edge edge : edges) {
      JSONObject edgeObject = new JSONObject();
      JSONObject edgeData = new JSONObject();
      edgeData.put(EDGE_SOURCE, edge.getSourceId());
      edgeData.put(EDGE_TARGET, edge.getTargetId());
      edgeData.put(IDENTIFIER, edge.getId());
      edgeData.put(LABEL, edge.getLabel());
      JSONObject edgeProperties = new JSONObject();
      if (edge.getProperties() != null) {
        for (Property prop : edge.getProperties()) {
          edgeProperties.put(prop.getKey(), prop.getValue());
        }
      }
      edgeData.put(PROPERTIES, edgeProperties);
      edgeObject.put(DATA, edgeData);
      edgeArray.put(edgeObject);
    }


    returnedJSON.put(EDGES, edgeArray);
    return returnedJSON.toString();

  }

  /**
   * Takes a JSON containing a logical graph and converts it into a cytoscape-conform JSON.
   *
   * @param graph    graph JSON object
   * @param vertices vertices JSON array
   * @param edges    edges JSON array
   * @return cytoscape-conform JSON
   * @throws JSONException if JSON creation fails
   */
  String getJSON(JSONObject graph, JSONArray vertices, JSONArray edges) throws JSONException {

    JSONObject returnedJSON = new JSONObject();

    returnedJSON.put(TYPE, "graph");


    JSONObject graphObject = new JSONObject();
    graphObject.put(IDENTIFIER, graph.getString("id"));
    graphObject.put(LABEL, graph.getJSONObject("meta").getString("label"));

    graphObject.put(PROPERTIES, graph.getJSONObject("data"));

    JSONArray graphArray = new JSONArray();
    graphArray.put(graphObject);

    returnedJSON.put(GRAPHS, graphArray);

    JSONArray vertexArray = new JSONArray();
    for (int i = 0; i < vertices.length(); i++) {
      JSONObject vertex = vertices.getJSONObject(i);

      JSONObject vertexData = new JSONObject();
      vertexData.put(IDENTIFIER, vertex.getString("id"));
      vertexData.put(LABEL, vertex.getJSONObject("meta").getString("label"));

      vertexData.put(PROPERTIES, vertex.getJSONObject("data"));

      JSONObject vertexObject = new JSONObject();
      vertexObject.put(DATA, vertexData);

      vertexArray.put(vertexObject);
    }
    returnedJSON.put(VERTICES, vertexArray);

    JSONArray edgeArray = new JSONArray();
    for (int i = 0; i < edges.length(); i++) {
      JSONObject edge = edges.getJSONObject(i);

      JSONObject edgeData = new JSONObject();
      edgeData.put(EDGE_SOURCE, edge.getString("source"));
      edgeData.put(EDGE_TARGET, edge.getString("target"));
      edgeData.put(IDENTIFIER, edge.getString("id"));
      edgeData.put(LABEL, edge.getJSONObject("meta").getString("label"));

      edgeData.put(PROPERTIES, edge.getJSONObject("data"));

      JSONObject edgeObject = new JSONObject();
      edgeObject.put(DATA, edgeData);

      edgeArray.put(edgeObject);
    }
    returnedJSON.put(EDGES, edgeArray);
    return returnedJSON.toString();

  }
}
