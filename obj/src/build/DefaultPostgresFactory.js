"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** @module build */
const pip_services3_components_node_1 = require("pip-services3-components-node");
const pip_services3_commons_node_1 = require("pip-services3-commons-node");
const PostgresConnection_1 = require("../persistence/PostgresConnection");
/**
 * Creates Postgres components by their descriptors.
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/build.factory.html Factory]]
 * @see [[PostgresConnection]]
 */
class DefaultPostgresFactory extends pip_services3_components_node_1.Factory {
    /**
     * Create a new instance of the factory.
     */
    constructor() {
        super();
        this.registerAsType(DefaultPostgresFactory.PostgresConnectionDescriptor, PostgresConnection_1.PostgresConnection);
    }
}
exports.DefaultPostgresFactory = DefaultPostgresFactory;
DefaultPostgresFactory.Descriptor = new pip_services3_commons_node_1.Descriptor("pip-services", "factory", "postgres", "default", "1.0");
DefaultPostgresFactory.PostgresConnectionDescriptor = new pip_services3_commons_node_1.Descriptor("pip-services", "connection", "postgres", "*", "1.0");
//# sourceMappingURL=DefaultPostgresFactory.js.map