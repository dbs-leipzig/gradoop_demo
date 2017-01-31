package org.gradoop.demos.grouping.server.functions;

import com.google.common.collect.Sets;
import org.apache.flink.api.common.functions.MapFunction;
import org.gradoop.common.model.api.entities.EPGMElement;

import java.util.Set;

/**
 * Created by niklas on 23.01.17.
 */
public class LabelMapper<E extends EPGMElement> implements MapFunction<E, Set<String>> {
  @Override
  public Set<String> map(E e) throws Exception {
    return Sets.newHashSet(e.getLabel());
  }
}
