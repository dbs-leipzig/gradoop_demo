package org.gradoop.demos.grouping.server.functions;

import org.apache.commons.lang.ArrayUtils;
import org.apache.flink.api.common.functions.FilterFunction;
import org.gradoop.common.model.api.entities.EPGMElement;

/**
 * Created by niklas on 23.01.17.
 */
public class LabelFilter<E extends EPGMElement> implements FilterFunction<E> {

  private String[] labels;

  public LabelFilter(String[] labels) {
    this.labels = labels;
  }

  @Override
  public boolean filter(E e) throws Exception {
    if (labels.length == 0) {
      return true;
    }
    return ArrayUtils.contains(labels, e.getLabel());

  }
}
