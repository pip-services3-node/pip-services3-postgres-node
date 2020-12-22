/** @module build */
import { Factory } from 'pip-services3-components-node';
import { Descriptor } from 'pip-services3-commons-node';
/**
 * Creates Postgres components by their descriptors.
 *
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/build.factory.html Factory]]
 * @see [[PostgresConnection]]
 */
export declare class DefaultPostgresFactory extends Factory {
    static readonly Descriptor: Descriptor;
    static readonly PostgresConnectionDescriptor: Descriptor;
    /**
     * Create a new instance of the factory.
     */
    constructor();
}
