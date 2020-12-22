"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PostgresConnectionResolver = void 0;
/** @module connect */
/** @hidden */
const async = require('async');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_components_node_2 = require("pip-services3-components-node");
/**
 * Helper class that resolves PostgreSQL connection and credential parameters,
 * validates them and generates a connection URI.
 *
 * It is able to process multiple connections to PostgreSQL cluster nodes.
 *
 *  ### Configuration parameters ###
 *
 * - connection(s):
 *   - discovery_key:               (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                        host name or IP address
 *   - port:                        port number (default: 27017)
 *   - database:                    database name
 *   - uri:                         resource URI or connection string with all parameters in it
 * - credential(s):
 *   - store_key:                   (optional) a key to retrieve the credentials from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                    user name
 *   - password:                    user password
 *
 * ### References ###
 *
 * - <code>\*:discovery:\*:\*:1.0</code>             (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code>      (optional) Credential stores to resolve credentials
 */
class PostgresConnectionResolver {
    constructor() {
        /**
         * The connections resolver.
         */
        this._connectionResolver = new pip_services3_components_node_1.ConnectionResolver();
        /**
         * The credentials resolver.
         */
        this._credentialResolver = new pip_services3_components_node_2.CredentialResolver();
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        this._connectionResolver.configure(config);
        this._credentialResolver.configure(config);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._connectionResolver.setReferences(references);
        this._credentialResolver.setReferences(references);
    }
    validateConnection(correlationId, connection) {
        let uri = connection.getUri();
        if (uri != null)
            return null;
        let host = connection.getHost();
        if (host == null)
            return new pip_services3_commons_node_1.ConfigException(correlationId, "NO_HOST", "Connection host is not set");
        let port = connection.getPort();
        if (port == 0)
            return new pip_services3_commons_node_1.ConfigException(correlationId, "NO_PORT", "Connection port is not set");
        let database = connection.getAsNullableString("database");
        if (database == null)
            return new pip_services3_commons_node_1.ConfigException(correlationId, "NO_DATABASE", "Connection database is not set");
        return null;
    }
    validateConnections(correlationId, connections) {
        if (connections == null || connections.length == 0)
            return new pip_services3_commons_node_1.ConfigException(correlationId, "NO_CONNECTION", "Database connection is not set");
        for (let connection of connections) {
            let error = this.validateConnection(correlationId, connection);
            if (error)
                return error;
        }
        return null;
    }
    composeConfig(connections, credential) {
        let config = {};
        // Define connection part
        for (let connection of connections) {
            let uri = connection.getUri();
            if (uri)
                config.connectionString = uri;
            let host = connection.getHost();
            if (host)
                config.host = host;
            let port = connection.getPort();
            if (port)
                config.port = port;
            let database = connection.getAsNullableString("database");
            if (database)
                config.database = database;
        }
        // Define authentication part
        if (credential) {
            let username = credential.getUsername();
            if (username)
                config.user = username;
            let password = credential.getPassword();
            if (password)
                config.password = password;
        }
        return config;
    }
    /**
     * Resolves PostgreSQL config from connection and credential parameters.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives resolved connection config or error.
     */
    resolve(correlationId, callback) {
        let connections;
        let credential;
        async.parallel([
            (callback) => {
                this._connectionResolver.resolveAll(correlationId, (err, result) => {
                    connections = result;
                    // Validate connections
                    if (err == null)
                        err = this.validateConnections(correlationId, connections);
                    callback(err);
                });
            },
            (callback) => {
                this._credentialResolver.lookup(correlationId, (err, result) => {
                    credential = result;
                    // Credentials are not validated right now
                    callback(err);
                });
            }
        ], (err) => {
            if (err)
                callback(err, null);
            else {
                let config = this.composeConfig(connections, credential);
                callback(null, config);
            }
        });
    }
}
exports.PostgresConnectionResolver = PostgresConnectionResolver;
//# sourceMappingURL=PostgresConnectionResolver.js.map