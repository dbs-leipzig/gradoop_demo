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

import org.apache.flink.api.common.functions.FlatMapFunction;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.util.Collector;
import org.gradoop.common.model.api.entities.EPGMElement;
import org.gradoop.common.model.impl.properties.PropertyValue;


/**
 * Mapper that extracts all property keys out of an EPGMElement and determines if the associated
 * properties have a numerical type. The result is returned in a set of Tuple2.
 * @param <T> EPGMElement type
 */
public class PropertyKeyMapper<T extends EPGMElement>
  implements FlatMapFunction<T, Tuple3<String, String, Boolean>> {

  @Override
  public void flatMap(T element, Collector<Tuple3<String, String, Boolean>> collector)
    throws Exception {
    for (String key : element.getProperties().getKeys()) {
      PropertyValue value = element.getPropertyValue(key);
      Boolean isNumerical = value.isInt() ||
        value.isLong() ||
        value.isDouble() ||
        value.isFloat() ||
        value.isBigDecimal();

      collector.collect(new Tuple3<>(element.getLabel(), key, isNumerical));
    }
  }
}
