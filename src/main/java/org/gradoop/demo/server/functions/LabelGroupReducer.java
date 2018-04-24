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
