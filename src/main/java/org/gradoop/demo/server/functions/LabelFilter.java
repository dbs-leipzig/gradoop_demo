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

package org.gradoop.demo.server.functions;

import org.apache.commons.lang.ArrayUtils;
import org.apache.flink.api.common.functions.FilterFunction;
import org.gradoop.common.model.api.entities.EPGMElement;


/**
 * Apply a filter on a dataset of elements. The filter is given as array of allowed labels.
 * @param <E> epgm element type
 */
public class LabelFilter<E extends EPGMElement> implements FilterFunction<E> {

  /**
   * Array of allowed labels
   */
  private String[] labels;

  /**
   * Constructor
   * @param labels array of allowed labels
   */
  public LabelFilter(String[] labels) {
    this.labels = labels;
  }

  /**
   * {@inheritDoc}
   */
  @Override
  public boolean filter(E e) throws Exception {
    return labels.length == 0 || ArrayUtils.contains(labels, e.getLabel());

  }
}
