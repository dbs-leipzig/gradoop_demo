package org.gradoop.demos.grouping.server.functions;

import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.java.tuple.Tuple3;

import java.util.Set;

/**
 * Reduces a dataset of sets by merging them.
 */
public class MergeSets implements ReduceFunction<Tuple3<Set<String>, String, Boolean>> {


  @Override
  public Tuple3<Set<String>, String, Boolean> reduce(
    Tuple3<Set<String>, String, Boolean> t1,
    Tuple3<Set<String>, String, Boolean> t2) throws Exception {
    t1.f0.addAll(t2.f0);
    return t1;
  }
}
