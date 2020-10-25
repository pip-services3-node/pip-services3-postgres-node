"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module persistence */
const _ = require('lodash');
const async = require('async');
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const pip_services3_commons_node_2 = require("pip-services3-commons-node");
const pip_services3_commons_node_3 = require("pip-services3-commons-node");
const pip_services3_commons_node_4 = require("pip-services3-commons-node");
const pip_services3_commons_node_5 = require("pip-services3-commons-node");
const pip_services3_commons_node_6 = require("pip-services3-commons-node");
const pip_services3_commons_node_7 = require("pip-services3-commons-node");
const pip_services3_components_node_1 = require("pip-services3-components-node");
const PostgresConnection_1 = require("./PostgresConnection");
/**
 * Abstract persistence component that stores data in PostgreSQL using plain driver.
 *
 * This is the most basic persistence component that is only
 * able to store data items of any type. Specific CRUD operations
 * over the data items must be implemented in child classes by
 * accessing <code>this._db</code> or <code>this._collection</code> properties.
 *
 * ### Configuration parameters ###
 *
 * - collection:                  (optional) PostgreSQL collection name
 * - connection(s):
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                      host name or IP address
 *   - port:                      port number (default: 27017)
 *   - uri:                       resource URI or connection string with all parameters in it
 * - credential(s):
 *   - store_key:                 (optional) a key to retrieve the credentials from [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                  (optional) user name
 *   - password:                  (optional) user password
 * - options:
 *   - connect_timeout:      (optional) number of milliseconds to wait before timing out when connecting a new client (default: 0)
 *   - idle_timeout:         (optional) number of milliseconds a client must sit idle in the pool and not be checked out (default: 10000)
 *   - max_pool_size:        (optional) maximum number of clients the pool should contain (default: 10)
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/log.ilogger.html ILogger]] components to pass log messages
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credentials
 *
 * ### Example ###
 *
 *     class MyPostgresPersistence extends PostgresPersistence<MyData> {
 *
 *       public constructor() {
 *           base("mydata");
 *       }
 *
 *       public getByName(correlationId: string, name: string, callback: (err, item) => void): void {
 *         let criteria = { name: name };
 *         this._model.findOne(criteria, callback);
 *       });
 *
 *       public set(correlatonId: string, item: MyData, callback: (err) => void): void {
 *         let criteria = { name: item.name };
 *         let options = { upsert: true, new: true };
 *         this._model.findOneAndUpdate(criteria, item, options, callback);
 *       }
 *
 *     }
 *
 *     let persistence = new MyPostgresPersistence();
 *     persistence.configure(ConfigParams.fromTuples(
 *         "host", "localhost",
 *         "port", 27017
 *     ));
 *
 *     persitence.open("123", (err) => {
 *          ...
 *     });
 *
 *     persistence.set("123", { name: "ABC" }, (err) => {
 *         persistence.getByName("123", "ABC", (err, item) => {
 *             console.log(item);                   // Result: { name: "ABC" }
 *         });
 *     });
 */
class PostgresPersistence {
    /**
     * Creates a new instance of the persistence component.
     *
     * @param tableName    (optional) a table name.
     */
    constructor(tableName) {
        this._autoObjects = [];
        /**
         * The dependency resolver.
         */
        this._dependencyResolver = new pip_services3_commons_node_6.DependencyResolver(PostgresPersistence._defaultConfig);
        /**
         * The logger.
         */
        this._logger = new pip_services3_components_node_1.CompositeLogger();
        this._maxPageSize = 100;
        this._tableName = tableName;
    }
    /**
     * Configures component by passing configuration parameters.
     *
     * @param config    configuration parameters to be set.
     */
    configure(config) {
        config = config.setDefaults(PostgresPersistence._defaultConfig);
        this._config = config;
        this._dependencyResolver.configure(config);
        this._tableName = config.getAsStringWithDefault("collection", this._tableName);
        this._tableName = config.getAsStringWithDefault("table", this._tableName);
        this._maxPageSize = config.getAsIntegerWithDefault("options.max_page_size", this._maxPageSize);
    }
    /**
     * Sets references to dependent components.
     *
     * @param references 	references to locate the component dependencies.
     */
    setReferences(references) {
        this._references = references;
        this._logger.setReferences(references);
        // Get connection
        this._dependencyResolver.setReferences(references);
        this._connection = this._dependencyResolver.getOneOptional('connection');
        // Or create a local one
        if (this._connection == null) {
            this._connection = this.createConnection();
            this._localConnection = true;
        }
        else {
            this._localConnection = false;
        }
    }
    /**
     * Unsets (clears) previously set references to dependent components.
     */
    unsetReferences() {
        this._connection = null;
    }
    createConnection() {
        let connection = new PostgresConnection_1.PostgresConnection();
        if (this._config)
            connection.configure(this._config);
        if (this._references)
            connection.setReferences(this._references);
        return connection;
    }
    /**
     * Adds index definition to create it on opening
     * @param keys index keys (fields)
     * @param options index options
     */
    ensureIndex(name, keys, options) {
        let builder = "CREATE";
        options = options || {};
        if (options.unique) {
            builder += " UNIQUE";
        }
        builder += " INDEX IF NOT EXISTS " + name + " ON " + this.quoteIdentifier(this._tableName);
        if (options.type) {
            builder += " " + options.type;
        }
        let fields = "";
        for (let key in keys) {
            if (fields != "")
                fields += ", ";
            fields += this.quoteIdentifier(key);
            let asc = keys[key];
            if (!asc)
                fields += " DESC";
        }
        builder += "(" + fields + ")";
        this.autoCreateObject(builder);
    }
    /**
     * Adds index definition to create it on opening
     * @param dmlStatement DML statement to autocreate database object
     */
    autoCreateObject(dmlStatement) {
        this._autoObjects.push(dmlStatement);
    }
    /**
     * Converts object value from internal to public format.
     *
     * @param value     an object in internal format to convert.
     * @returns converted object in public format.
     */
    convertToPublic(value) {
        return value;
    }
    /**
     * Convert object value from public to internal format.
     *
     * @param value     an object in public format to convert.
     * @returns converted object in internal format.
     */
    convertFromPublic(value) {
        return value;
    }
    quoteIdentifier(value) {
        if (value == null || value == "")
            return value;
        if (value[0] == '"')
            return value;
        return '"' + value + '"';
    }
    /**
     * Checks if the component is opened.
     *
     * @returns true if the component has been opened and false otherwise.
     */
    isOpen() {
        return this._opened;
    }
    /**
     * Opens the component.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    open(correlationId, callback) {
        if (this._opened) {
            callback(null);
            return;
        }
        if (this._connection == null) {
            this._connection = this.createConnection();
            this._localConnection = true;
        }
        let openCurl = (err) => {
            if (err == null && this._connection == null) {
                err = new pip_services3_commons_node_5.InvalidStateException(correlationId, 'NO_CONNECTION', 'PostgreSQL connection is missing');
            }
            if (err == null && !this._connection.isOpen()) {
                err = new pip_services3_commons_node_4.ConnectionException(correlationId, "CONNECT_FAILED", "PostgreSQL connection is not opened");
            }
            this._opened = false;
            if (err) {
                if (callback)
                    callback(err);
            }
            else {
                this._client = this._connection.getConnection();
                this._databaseName = this._connection.getDatabaseName();
                // Recreate objects
                this.autoCreateObjects(correlationId, (err) => {
                    if (err) {
                        this._client == null;
                        err = new pip_services3_commons_node_4.ConnectionException(correlationId, "CONNECT_FAILED", "Connection to postgres failed").withCause(err);
                    }
                    else {
                        this._opened = true;
                        this._logger.debug(correlationId, "Connected to postgres database %s, collection %s", this._databaseName, this.quoteIdentifier(this._tableName));
                    }
                    if (callback)
                        callback(err);
                });
            }
        };
        if (this._localConnection) {
            this._connection.open(correlationId, openCurl);
        }
        else {
            openCurl(null);
        }
    }
    /**
     * Closes component and frees used resources.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    close(correlationId, callback) {
        if (!this._opened) {
            callback(null);
            return;
        }
        if (this._connection == null) {
            callback(new pip_services3_commons_node_5.InvalidStateException(correlationId, 'NO_CONNECTION', 'Postgres connection is missing'));
            return;
        }
        let closeCurl = (err) => {
            this._opened = false;
            this._client = null;
            if (callback)
                callback(err);
        };
        if (this._localConnection) {
            this._connection.close(correlationId, closeCurl);
        }
        else {
            closeCurl(null);
        }
    }
    /**
     * Clears component state.
     *
     * @param correlationId 	(optional) transaction id to trace execution through call chain.
     * @param callback 			callback function that receives error or null no errors occured.
     */
    clear(correlationId, callback) {
        // Return error if collection is not set
        if (this._tableName == null) {
            if (callback)
                callback(new Error('Table name is not defined'));
            return;
        }
        let query = "DELETE FROM " + this.quoteIdentifier(this._tableName);
        this._client.query(query, (err, result) => {
            if (err) {
                err = new pip_services3_commons_node_4.ConnectionException(correlationId, "CONNECT_FAILED", "Connection to postgres failed")
                    .withCause(err);
            }
            if (callback)
                callback(err);
        });
    }
    autoCreateObjects(correlationId, callback) {
        if (this._autoObjects == null || this._autoObjects.length == 0) {
            callback(null);
            return null;
        }
        // Check if table exist to determine weither to auto create objects
        let query = "SELECT to_regclass('" + this._tableName + "')";
        this._client.query(query, (err, result) => {
            if (err) {
                callback(err);
                return;
            }
            // If table already exists then exit
            if (result.rows && result.rows.length > 0 && result.rows[0].to_regclass != null) {
                callback(err);
                return;
            }
            this._logger.debug(correlationId, 'Table ' + this._tableName + ' does not exist. Creating database objects...');
            // Run all DML commands
            async.eachSeries(this._autoObjects, (dml, callback) => {
                this._client.query(dml, (err, result) => {
                    if (err) {
                        this._logger.error(correlationId, err, 'Failed to autocreate database object');
                    }
                    callback(err);
                });
            }, callback);
        });
    }
    /**
     * Generates a list of column names to use in SQL statements like: "column1,column2,column3"
     * @param values an array with column values or a key-value map
     * @returns a generated list of column names
     */
    generateColumns(values) {
        values = !_.isArray(values) ? _.keys(values) : values;
        let result = "";
        for (let value of values) {
            if (result != "")
                result += ",";
            result += this.quoteIdentifier(value);
        }
        return result;
    }
    /**
     * Generates a list of value parameters to use in SQL statements like: "$1,$2,$3"
     * @param values an array with values or a key-value map
     * @returns a generated list of value parameters
     */
    generateParameters(values) {
        values = !_.isArray(values) ? _.keys(values) : values;
        let index = 1;
        let result = "";
        for (let value of values) {
            if (result != "")
                result += ",";
            result += "$" + index;
            index++;
        }
        return result;
    }
    /**
     * Generates a list of column sets to use in UPDATE statements like: column1=$1,column2=$2
     * @param values a key-value map with columns and values
     * @returns a generated list of column sets
     */
    generateSetParameters(values) {
        let result = "";
        let index = 1;
        for (let column in values) {
            if (result != "")
                result += ",";
            result += this.quoteIdentifier(column) + "=$" + index;
            index++;
        }
        return result;
    }
    /**
     * Generates a list of column parameters
     * @param values a key-value map with columns and values
     * @returns a generated list of column values
     */
    generateValues(values) {
        return _.values(values);
    }
    /**
     * Gets a page of data items retrieved by a given filter and sorted according to sort parameters.
     *
     * This method shall be called by a public getPageByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object
     * @param paging            (optional) paging parameters
     * @param sort              (optional) sorting JSON object
     * @param select            (optional) projection JSON object
     * @param callback          callback function that receives a data page or error.
     */
    getPageByFilter(correlationId, filter, paging, sort, select, callback) {
        select = select && !_.isEmpty(select) ? select : "*";
        let query = "SELECT " + select + " FROM " + this.quoteIdentifier(this._tableName);
        // Adjust max item count based on configuration
        paging = paging || new pip_services3_commons_node_2.PagingParams();
        let skip = paging.getSkip(-1);
        let take = paging.getTake(this._maxPageSize);
        let pagingEnabled = paging.total;
        if (filter && filter != "")
            query += " WHERE " + filter;
        if (sort && !_.isEmpty(sort))
            query += " ORDER BY " + sort;
        if (skip >= 0)
            query += " OFFSET " + skip;
        query += " LIMIT " + take;
        this._client.query(query, (err, result) => {
            err = err || null;
            if (err) {
                callback(err, null);
                return;
            }
            let items = result.rows;
            if (items != null)
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._tableName);
            items = _.map(items, this.convertToPublic);
            if (pagingEnabled) {
                let query = 'SELECT COUNT(*) AS count FROM ' + this.quoteIdentifier(this._tableName);
                if (filter != null && filter != "")
                    query += " WHERE " + filter;
                this._client.query(query, (err, result) => {
                    err = err || null;
                    if (err) {
                        callback(err, null);
                        return;
                    }
                    let count = result.rows && result.rows.length == 1
                        ? pip_services3_commons_node_7.LongConverter.toLong(result.rows[0].count) : 0;
                    let page = new pip_services3_commons_node_3.DataPage(items, count);
                    callback(null, page);
                });
            }
            else {
                let page = new pip_services3_commons_node_3.DataPage(items);
                callback(null, page);
            }
        });
    }
    /**
     * Gets a number of data items retrieved by a given filter.
     *
     * This method shall be called by a public getCountByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object
     * @param callback          callback function that receives a data page or error.
     */
    getCountByFilter(correlationId, filter, callback) {
        let query = 'SELECT COUNT(*) AS count FROM ' + this.quoteIdentifier(this._tableName);
        if (filter && filter != "")
            query += " WHERE " + filter;
        this._client.query(query, (err, result) => {
            err = err || null;
            if (err) {
                callback(err, null);
                return;
            }
            let count = result.rows && result.rows.length == 1
                ? pip_services3_commons_node_7.LongConverter.toLong(result.rows[0].count) : 0;
            if (count != null)
                this._logger.trace(correlationId, "Counted %d items in %s", count, this._tableName);
            callback(null, count);
        });
    }
    /**
     * Gets a list of data items retrieved by a given filter and sorted according to sort parameters.
     *
     * This method shall be called by a public getListByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     *
     * @param correlationId    (optional) transaction id to trace execution through call chain.
     * @param filter           (optional) a filter JSON object
     * @param paging           (optional) paging parameters
     * @param sort             (optional) sorting JSON object
     * @param select           (optional) projection JSON object
     * @param callback         callback function that receives a data list or error.
     */
    getListByFilter(correlationId, filter, sort, select, callback) {
        select = select && !_.isEmpty(select) ? select : "*";
        let query = "SELECT " + select + " FROM " + this.quoteIdentifier(this._tableName);
        if (filter && filter != "")
            query += " WHERE " + filter;
        if (sort && !_.isEmpty(sort))
            query += " ORDER BY " + sort;
        this._client.query(query, (err, result) => {
            err = err || null;
            if (err) {
                callback(err, null);
                return;
            }
            let items = result.rows;
            if (items != null)
                this._logger.trace(correlationId, "Retrieved %d from %s", items.length, this._tableName);
            items = _.map(items, this.convertToPublic);
            callback(null, items);
        });
    }
    /**
     * Gets a random item from items that match to a given filter.
     *
     * This method shall be called by a public getOneRandom method from child class that
     * receives FilterParams and converts them into a filter function.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object
     * @param callback          callback function that receives a random item or error.
     */
    getOneRandom(correlationId, filter, callback) {
        let query = 'SELECT COUNT(*) AS count FROM ' + this.quoteIdentifier(this._tableName);
        if (filter && filter != "")
            query += " WHERE " + filter;
        this._client.query(query, (err, result) => {
            err = err || null;
            if (err) {
                callback(err, null);
                return;
            }
            let query = "SELECT * FROM " + this.quoteIdentifier(this._tableName);
            if (filter && filter != "")
                query += " WHERE " + filter;
            let count = result.rows && result.rows.length == 1 ? result.rows[0].count : 0;
            let pos = _.random(0, count - 1);
            query += " OFFSET " + pos + " LIMIT 1";
            this._client.query(query, (err, result) => {
                err = err || null;
                let items = result.rows;
                let item = (items != null && items.length > 0) ? items[0] : null;
                if (item == null)
                    this._logger.trace(correlationId, "Random item wasn't found from %s", this._tableName);
                else
                    this._logger.trace(correlationId, "Retrieved random item from %s", this._tableName);
                item = this.convertToPublic(item);
                callback(err, item);
            });
        });
    }
    /**
     * Creates a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param item              an item to be created.
     * @param callback          (optional) callback function that receives created item or error.
     */
    create(correlationId, item, callback) {
        if (item == null) {
            callback(null, null);
            return;
        }
        let row = this.convertFromPublic(item);
        let columns = this.generateColumns(row);
        let params = this.generateParameters(row);
        let values = this.generateValues(row);
        let query = "INSERT INTO " + this.quoteIdentifier(this._tableName) + " (" + columns + ") VALUES (" + params + ") RETURNING *";
        this._client.query(query, values, (err, result) => {
            err = err || null;
            if (!err)
                this._logger.trace(correlationId, "Created in %s with id = %s", this._tableName, row.id);
            let newItem = result && result.rows && result.rows.length == 1
                ? this.convertToPublic(result.rows[0]) : null;
            callback(err, newItem);
        });
    }
    /**
     * Deletes data items that match to a given filter.
     *
     * This method shall be called by a public deleteByFilter method from child class that
     * receives FilterParams and converts them into a filter function.
     *
     * @param correlationId     (optional) transaction id to trace execution through call chain.
     * @param filter            (optional) a filter JSON object.
     * @param callback          (optional) callback function that receives error or null for success.
     */
    deleteByFilter(correlationId, filter, callback) {
        let query = "DELETE FROM " + this.quoteIdentifier(this._tableName);
        if (filter != null && filter != "")
            query += " WHERE " + filter;
        this._client.query(query, (err, result) => {
            let count = result ? result.rowCount : 0;
            err = err || null;
            if (!err)
                this._logger.trace(correlationId, "Deleted %d items from %s", count, this._tableName);
            if (callback)
                callback(err);
        });
    }
}
exports.PostgresPersistence = PostgresPersistence;
PostgresPersistence._defaultConfig = pip_services3_commons_node_1.ConfigParams.fromTuples("collection", null, "dependencies.connection", "*:connection:postgres:*:1.0", 
// connections.*
// credential.*
"options.max_pool_size", 2, "options.keep_alive", 1, "options.connect_timeout", 5000, "options.auto_reconnect", true, "options.max_page_size", 100, "options.debug", true);
//# sourceMappingURL=PostgresPersistence.js.map