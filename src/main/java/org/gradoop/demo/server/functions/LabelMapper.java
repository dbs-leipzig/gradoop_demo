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
