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
