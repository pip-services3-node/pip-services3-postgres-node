"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentifiableJsonPostgresPersistence = void 0;
/** @module persistence */
/** @hidden */
const _ = require('lodash');
const IdentifiablePostgresPersistence_1 = require("./IdentifiablePostgresPersistence");
/**
 * Abstract persistence component that stores data in PostgreSQL in JSON or JSONB fields
 * and implements a number of CRUD operations over data items with unique ids.
 * The data items must implement [[https://pip-services3-node.github.io/pip-services3-commons-node/interfaces/data.iidentifiable.html IIdentifiable]] interface.
 *
 * The JSON table has only two fields: id and data.
 *
 * In basic scenarios child classes shall only override [[getPageByFilter]],
 * [[getListByFilter]] or [[deleteByFilter]] operations with specific filter function.
 * All other operations can be used out of the box.
 *
 * In complex scenarios child classes can implement additional operations by
 * accessing <code>this._collection</code> and <code>this._model</code> properties.

 * ### Configuration parameters ###
 *
 * - collection:                  (optional) PostgreSQL collection name
 * - connection(s):
 *   - discovery_key:             (optional) a key to retrieve the connection from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]]
 *   - host:                      host name or IP address
 *   - port:                      port number (default: 27017)
 *   - uri:                       resource URI or connection string with all parameters in it
 * - credential(s):
 *   - store_key:                 (optional) a key to retrieve the credentials from [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/auth.icredentialstore.html ICredentialStore]]
 *   - username:                  (optional) user name
 *   - password:                  (optional) user password
 * - options:
 *   - connect_timeout:      (optional) number of milliseconds to wait before timing out when connecting a new client (default: 0)
 *   - idle_timeout:         (optional) number of milliseconds a client must sit idle in the pool and not be checked out (default: 10000)
 *   - max_pool_size:        (optional) maximum number of clients the pool should contain (default: 10)
 *
 * ### References ###
 *
 * - <code>\*:logger:\*:\*:1.0</code>           (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/log.ilogger.html ILogger]] components to pass log messages components to pass log messages
 * - <code>\*:discovery:\*:\*:1.0</code>        (optional) [[https://pip-services3-node.github.io/pip-services3-components-node/interfaces/connect.idiscovery.html IDiscovery]] services
 * - <code>\*:credential-store:\*:\*:1.0</code> (optional) Credential stores to resolve credentials
 *
 * ### Example ###
 *
 *     class MyPostgresPersistence extends IdentifiablePostgresJsonPersistence<MyData, string> {
 *
 *     public constructor() {
 *         base("mydata", new MyDataPostgresSchema());
 *     }
 *
 *     private composeFilter(filter: FilterParams): any {
 *         filter = filter || new FilterParams();
 *         let criteria = [];
 *         let name = filter.getAsNullableString('name');
 *         if (name != null)
 *             criteria.push({ name: name });
 *         return criteria.length > 0 ? { $and: criteria } : null;
 *     }
 *
 *     public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams,
 *         callback: (err: any, page: DataPage<MyData>) => void): void {
 *         base.getPageByFilter(correlationId, this.composeFilter(filter), paging, null, null, callback);
 *     }
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
 *         ...
 *     });
 *
 *     persistence.create("123", { id: "1", name: "ABC" }, (err, item) => {
 *         persistence.getPageByFilter(
 *             "123",
 *             FilterParams.fromTuples("name", "ABC"),
 *             null,
 *             (err, page) => {
 *                 console.log(page.data);          // Result: { id: "1", name: "ABC" }
 *
 *                 persistence.deleteById("123", "1", (err, item) => {
 *                    ...
 *                 });
 *             }
 *         )
 *     });
 */
class IdentifiableJsonPostgresPersistence extends IdentifiablePostgresPersistence_1.IdentifiablePostgresPersistence {
    /**
     * Creates a new instance of the persistence component.
     *
     * @param collection    (optional) a collection name.
     */
    constructor(tableName) {
        super(tableName);
    }
    /**
     * Adds DML statement to automatically create JSON(B) table
     *
     * @param idType type of the id column (default: TEXT)
     * @param dataType type of the data column (default: JSONB)
     */
    ensureTable(idType = 'TEXT', dataType = 'JSONB') {
        let query = "CREATE TABLE IF NOT EXISTS " + this.quoteIdentifier(this._tableName)
            + " (\"id\" " + idType + " PRIMARY KEY, \"data\" " + dataType + ")";
        this.autoCreateObject(query);
    }
    /**
     * Converts object value from internal to public format.
     *
     * @param value     an object in internal format to convert.
     * @returns converted object in public format.
     */
    convertToPublic(value) {
        if (value == null)
            return null;
        return value.data;
    }
    /**
     * Convert object value from public to internal format.
     *
     * @param value     an object in public format to convert.
     * @returns converted object in internal format.
     */
    convertFromPublic(value) {
        if (value == null)
            return null;
        let result = {
            id: value.id,
            data: value
        };
        return result;
    }
    /**
     * Updates only few selected fields in a data item.
     *
     * @param correlation_id    (optional) transaction id to trace execution through call chain.
     * @param id                an id of data item to be updated.
     * @param data              a map with fields to be updated.
     * @param callback          callback function that receives updated item or error.
     */
    updatePartially(correlationId, id, data, callback) {
        if (data == null || id == null) {
            if (callback)
                callback(null, null);
            return;
        }
        let query = "UPDATE " + this.quoteIdentifier(this._tableName) + " SET \"data\"=\"data\"||$2 WHERE \"id\"=$1 RETURNING *";
        let values = [id, data.getAsObject()];
        this._client.query(query, values, (err, result) => {
            err = err || null;
            if (!err)
                this._logger.trace(correlationId, "Updated partially in %s with id = %s", this._tableName, id);
            let newItem = result && result.rows && result.rows.length == 1
                ? this.convertToPublic(result.rows[0]) : null;
            if (callback)
                callback(err, newItem);
        });
    }
}
exports.IdentifiableJsonPostgresPersistence = IdentifiableJsonPostgresPersistence;
//# sourceMappingURL=IdentifiableJsonPostgresPersistence.js.map