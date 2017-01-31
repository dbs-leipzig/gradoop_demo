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
