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

import com.google.common.collect.Sets;
import org.apache.flink.api.common.functions.MapFunction;
import org.gradoop.common.model.api.entities.EPGMElement;

import java.util.Set;

/**
 * Extracts all labels from an epgm element
 * @param <E> epgm element type
 */
public class LabelMapper<E extends EPGMElement> implements MapFunction<E, Set<String>> {
  /**
   * {@inheritDoc}
   */
  @Override
  public Set<String> map(E e) throws Exception {
    return Sets.newHashSet(e.getLabel());
  }
}
