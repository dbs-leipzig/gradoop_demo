package Server;

import com.sun.jersey.api.container.grizzly2.GrizzlyServerFactory;
import com.sun.jersey.api.core.PackagesResourceConfig;
import com.sun.jersey.api.core.ResourceConfig;
import com.sun.jersey.api.json.JSONConfiguration;
import org.apache.flink.api.java.ExecutionEnvironment;
import org.glassfish.grizzly.http.server.HttpHandler;
import org.glassfish.grizzly.http.server.HttpServer;
import org.glassfish.grizzly.http.server.StaticHttpHandler;

import javax.ws.rs.core.UriBuilder;
import java.io.IOException;
import java.net.URI;

/**
 * Basic class, used for starting and stopping the server.
 */
public class Server {

  /**
   * URI that specifies where the server is run.
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
   * Starts the server and adds the request handlers.
   * @return the running server
   * @throws IOException if server creation fails
   */
  private static HttpServer startServer() throws IOException {
    System.out.println("Starting grizzly...");
    ResourceConfig rc = new PackagesResourceConfig("Server");
    rc.getFeatures().put(JSONConfiguration.FEATURE_POJO_MAPPING, true);
    HttpServer server = GrizzlyServerFactory.createHttpServer(BASE_URI, rc);
    HttpHandler staticHandler = new StaticHttpHandler(Server.class.getResource("/web/").getPath());
    server.getServerConfiguration().addHttpHandler( staticHandler, "/gradoop" );

    return server;
  }

  /**
   * Main method. Run this to start the server.
   * @param args command line parameters
   * @throws IOException if server creation fails
   */
  public static void main(String[] args) throws IOException {
    HttpServer httpServer = startServer();
    System.out.println("Server started at localhost:9998/\n" +
      "Press enter to stop it.\n");
    System.in.read();
    httpServer.stop();
  }
}
