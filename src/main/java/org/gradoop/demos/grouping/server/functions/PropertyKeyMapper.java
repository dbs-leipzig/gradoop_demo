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
