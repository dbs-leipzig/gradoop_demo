package Server.pojo;

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

  private String[] vertexFilters;

  private String[] edgeFilters;

  /**
   * vertex aggregation function
   */
  private String vertexAggrFunc;

  /**
   * edge aggregation function
   */
  private String edgeAggrFunc;

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
   * @param vertexAggrFunc vertex aggregation function
   */
  public void setVertexAggrFunc(String vertexAggrFunc) {
    this.vertexAggrFunc = vertexAggrFunc;
  }

  /**
   * set the edge aggregation function
   *
   * @param edgeAggrFunc edge aggregation function
   */
  public void setEdgeAggrFunc(String edgeAggrFunc) {
    this.edgeAggrFunc = edgeAggrFunc;
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
  public String getVertexAggrFunc() {
    return vertexAggrFunc;
  }

  /**
   * get the edge aggregation function
   *
   * @return edge aggregation function
   */
  public String getEdgeAggrFunc() {
    return edgeAggrFunc;
  }

  /**
   * Returns a human readable representation of the request.
   *
   * @return human readable string
   */
  @Override
  public String toString() {
    return
      "DB name: " + dbName + "\n" +
      "Vertex keys: " + Arrays.toString(vertexKeys) + "\n" +
      "Edge keys: " + Arrays.toString(edgeKeys) + "\n" +
      "Vertex aggrFunc: " + vertexAggrFunc + "\n" +
      "Edge aggrFunc: " + edgeAggrFunc + "\n" +
      "Vertex filters: " + Arrays.toString(vertexFilters) + "\n" +
      "Edge filters: " + Arrays.toString(edgeFilters) + "\n";


  }

  public String[] getVertexFilters() {
    return vertexFilters;
  }

  public void setVertexFilters(String[] vertexFilters) {
    this.vertexFilters = vertexFilters;
  }

  public String[] getEdgeFilters() {
    return edgeFilters;
  }

  public void setEdgeFilters(String[] edgeFilters) {
    this.edgeFilters = edgeFilters;
  }
}
