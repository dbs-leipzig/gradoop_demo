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
