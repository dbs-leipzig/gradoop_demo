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


import org.apache.flink.api.common.functions.GroupReduceFunction;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.util.Collector;

import java.util.HashSet;
import java.util.Set;

/**
 * Reduce the Dataset of properties, represented as tuples3 of label of vertices with this
 * property, property key and a boolean specifying if it is numerical into one tuple3 with all
 * vertex labels in the first field.
 */
public class LabelGroupReducer implements GroupReduceFunction<
  Tuple3<String, String, Boolean>, Tuple3<Set<String>, String, Boolean>> {

  /**
   * {@inheritDoc}
   */
  @Override
  public void reduce(
    Iterable<Tuple3<String, String, Boolean>> iterable,
    Collector<Tuple3<Set<String>, String, Boolean>> collector) throws Exception {

    Tuple3<Set<String>, String, Boolean> result = new Tuple3<>();

    result.f0 = new HashSet<>();
    for(Tuple3<String, String, Boolean> tuple : iterable) {
      result.f0.add(tuple.f0);
      result.f1 = tuple.f1;
      result.f2 = tuple.f2;
    }

    collector.collect(result);
  }
}
