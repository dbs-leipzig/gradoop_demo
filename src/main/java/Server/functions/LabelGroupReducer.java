package Server.functions;


import org.apache.flink.api.common.functions.GroupReduceFunction;
import org.apache.flink.api.java.tuple.Tuple3;
import org.apache.flink.util.Collector;

import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

/**
 * Created by niklas on 18.01.17.
 */
public class LabelGroupReducer implements GroupReduceFunction<
  Tuple3<String, String, Boolean>, Set<Tuple3<String, String, Boolean>>> {
  @Override
  public void reduce(Iterable<Tuple3<String, String, Boolean>> iterable,
    Collector<Set<Tuple3<String, String, Boolean>>> collector) throws Exception {
    Iterator<Tuple3<String, String, Boolean>> it = iterable.iterator();
    Tuple3<String, String, Boolean> first = it.next();
    Set<String> labels = new HashSet<>();
    labels.add(first.f0);

    first.f0 = "";
    while (it.hasNext()) {
      labels.add(it.next().f0);
    }

    Iterator<String> labelIt = labels.iterator();
    while(labelIt.hasNext()) {
      first.f0 += labelIt.next();
      if(labelIt.hasNext()) {
        first.f0 += ", ";
      }
    }
    System.out.println(first.f0);
    HashSet<Tuple3<String, String, Boolean>> result = new HashSet<>();
    result.add(first);
    collector.collect(result);
  }
}
