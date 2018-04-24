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

package org.gradoop.demo.server.pojo;

import java.util.Arrays;

/**
 * POJO class that contains the data required to run a Grouping. Required for automatic
 * conversion of JSON delivered via POST.
 */
public class GroupingRequest {
  /**
   * name of the database
   */
  private String dbName;

  /**
   * array of vertex grouping keys
   */
  private String[] vertexKeys;

  /**
   * array of edge grouping keys
   */
  private String[] edgeKeys;

  /**
   * array of vertex filters
   */
  private String[] vertexFilters;

  /**
   * array of edge filters
   */
  private String[] edgeFilters;

  /**
   * vertex aggregation function
   */
  private String[] vertexAggrFuncs;

  /**
   * edge aggregation function
   */
  private String[] edgeAggrFuncs;

  /**
   * true, if all edges shall be filtered
   */

  private boolean filterAllEdges;

  /**
   * set the database name
   *
   * @param dbName database name
   */
  public void setDbName(String dbName) {
    this.dbName = dbName;
  }

  /**
   * set the vertex grouping keys
   *
   * @param vertexKeys vertex grouping keys
   */
  public void setVertexKeys(String[] vertexKeys) {
    this.vertexKeys = vertexKeys;
  }

  /**
   * set the edge grouping keys
   *
   * @param edgeKeys edge grouping keys
   */
  public void setEdgeKeys(String[] edgeKeys) {
    this.edgeKeys = edgeKeys;
  }

  /**
   * set the vertex aggregation function
   *
   * @param vertexAggrFuncs vertex aggregation function
   */
  public void setVertexAggrFuncs(String[] vertexAggrFuncs) {
    this.vertexAggrFuncs = vertexAggrFuncs;
  }

  /**
   * set the edge aggregation function
   *
   * @param edgeAggrFuncs edge aggregation function
   */
  public void setEdgeAggrFuncs(String[] edgeAggrFuncs) {
    this.edgeAggrFuncs = edgeAggrFuncs;
  }

  /**
   * set the vertex filters
   *
   * @param vertexFilters vertex filters
   */
  public void setVertexFilters(String[] vertexFilters) {
    this.vertexFilters = vertexFilters;
  }

  /**
   * set the edge filters
   *
   * @param edgeFilters edge filters
   */
  public void setEdgeFilters(String[] edgeFilters) {
    this.edgeFilters = edgeFilters;
  }

  /**
   * set if all edges should be filtered
   */
  public void setFilterAllEdges(boolean filterAllEdges) {
    this.filterAllEdges = filterAllEdges;
  }

  /**
   * get the database name
   *
   * @return database name
   */
  public String getDbName() {
    return dbName;
  }

  /**
   * get the vertex grouping keys
   *
   * @return vertex grouping keys
   */
  public String[] getVertexKeys() {
    return vertexKeys;
  }

  /**
   * get the edge grouping keys
   *
   * @return edge grouping keys
   */
  public String[] getEdgeKeys() {
    return edgeKeys;
  }

  /**
   * get the vertex aggregation function
   *
   * @return vertex aggregation function
   */
  public String[] getVertexAggrFuncs() {
    return vertexAggrFuncs;
  }

  /**
   * get the edge aggregation function
   *
   * @return edge aggregation function
   */
  public String[] getEdgeAggrFuncs() {
    return edgeAggrFuncs;
  }


  /**
   * get the vertex filters
   *
   * @return vertex filters
   */
  public String[] getVertexFilters() {
    return vertexFilters;
  }

  /**
   * get the edge filters
   *
   * @return edge filters
   */
  public String[] getEdgeFilters() {
    return edgeFilters;
  }


  /**
   * get if all edges shall be filtered
   *
   * @return true, if all edges shall be filtered
   */
  public boolean getFilterAllEdges() {
    return filterAllEdges;
  }

  /**
   * Returns a human readable representation of the request.
   *
   * @return human readable string
   */

  @Override
  public String toString() {
    return "DB name: " + dbName + "\n" + "Vertex keys: " + Arrays.toString(vertexKeys) + "\n" +
      "Edge keys: " + Arrays.toString(edgeKeys) + "\n" + "Vertex aggrFunc: " + vertexAggrFuncs +
      "\n" + "Edge aggrFunc: " + edgeAggrFuncs + "\n" + "Vertex filters: " +
      Arrays.toString(vertexFilters) + "\n" + "Edge filters: " + Arrays.toString(edgeFilters) +
      "\n";
  }
}
