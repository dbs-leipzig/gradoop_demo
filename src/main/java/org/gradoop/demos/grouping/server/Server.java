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

package org.gradoop.demos.grouping.server;

import com.sun.jersey.api.container.grizzly2.GrizzlyServerFactory;
import com.sun.jersey.api.core.PackagesResourceConfig;
import com.sun.jersey.api.core.ResourceConfig;
import com.sun.jersey.api.json.JSONConfiguration;
import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.grizzly.http.server.StaticHttpHandler;

import javax.ws.rs.core.UriBuilder;
import java.io.IOException;
import java.net.URI;

/**
 * Basic class, used for starting and stopping the org.gradoop.demos.grouping.server.
 */
public class Server {

  /**
   * URI that specifies where the org.gradoop.demos.grouping.server is run.
   */
  private static final URI BASE_URI = getBaseURI();

  /**
   * Creates the base URI.
   * @return Base URI
   */
  private static URI getBaseURI() {
    return UriBuilder.fromUri("http://localhost/").port(9998).build();
  }

  /**
   * Starts the org.gradoop.demos.grouping.server and adds the request handlers.
   * @return the running org.gradoop.demos.grouping.server
   * @throws IOException if org.gradoop.demos.grouping.server creation fails
   */
  private static HttpServer startServer() throws IOException {
    System.out.println("Starting grizzly...");
    ResourceConfig rc = new PackagesResourceConfig("org/gradoop/demos/grouping/server");
    rc.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, true);
    HttpServer server = GrizzlyServerFactory.createHttpServer(BASE_URI, rc);
    HttpHandler staticHandler = new StaticHttpHandler(
      Server.class.getResource("/web/grouping").getPath());
    server.getServerConfiguration().addHttpHandler( staticHandler, "/gradoop" );

    return server;
  }

  /**
   * Main method. Run this to start the org.gradoop.demos.grouping.server.
   * @param args command line parameters
   * @throws IOException if org.gradoop.demos.grouping.server creation fails
   */
  public static void main(String[] args) throws IOException {
    HttpServer httpServer = startServer();
    System.out.println("org.gradoop.demos.grouping.server started at localhost:9998/\n" +
      "Press any key to stop it.\n");
    System.in.read();
    httpServer.stop();
  }
}
