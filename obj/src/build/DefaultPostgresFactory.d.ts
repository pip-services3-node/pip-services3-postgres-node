/** @module build */
import { Factory } from 'pip-services3-components-node';
import { Descriptor } from 'pip-services3-commons-node';
/**
 * Creates Postgres components by their descriptors.
 *
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/build.factory.html Factory]]
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