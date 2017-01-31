package org.gradoop.demos.grouping.server.functions;

import org.apache.flink.api.common.functions.ReduceFunction;

import java.util.Set;

/**
 * Created by niklas on 23.01.17.
 */
public class LabelReducer implements ReduceFunction<Set<String>> {

  @Override
  public Set<String> reduce(Set<String> set1, Set<String> set2) throws Exception {
    set1.addAll(set2);
    return set1;
  }
}
