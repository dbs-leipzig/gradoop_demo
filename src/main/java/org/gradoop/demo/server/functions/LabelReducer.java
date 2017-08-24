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

import org.apache.flink.api.common.functions.ReduceFunction;

import java.util.Set;

/**
 * Reduce the DEataset of labels to one set.
 */
public class LabelReducer implements ReduceFunction<Set<String>> {

  /**
   * {@inheritDoc}
   */
  @Override
  public Set<String> reduce(Set<String> set1, Set<String> set2) throws Exception {
    set1.addAll(set2);
    return set1;
  }
}
