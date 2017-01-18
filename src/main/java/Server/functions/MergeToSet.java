package Server.functions;

import org.apache.flink.api.common.functions.ReduceFunction;
import org.apache.flink.api.java.tuple.Tuple2;

import java.util.Set;

/**
 * Reduces a dataset of sets by merging them.
 * @param <T> content type of the sets
 */
public class MergeToSet<T> implements ReduceFunction<Set<T>> {

  /**
   * {@inheritDoc}
   */
  public Set<T> reduce(
    Set<T> set1,
    Set<T> set2) throws Exception {
    set1.addAll(set2);
    return set1;
  }
}
