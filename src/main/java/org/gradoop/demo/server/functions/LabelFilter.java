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
