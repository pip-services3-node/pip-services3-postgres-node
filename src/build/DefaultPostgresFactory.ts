/** @module build */
import { Factory } from 'pip-services3-components-node';
import { Descriptor } from 'pip-services3-commons-node';

import { PostgresConnection } from '../persistence/PostgresConnection';

/**
 * Creates Postgres components by their descriptors.
 * 
 * @see [[https://pip-services3-node.github.io/pip-services3-components-node/classes/build.factory.html Factory]]
 * @see [[PostgresConnection]]
 */
export class DefaultPostgresFactory extends Factory {
	public static readonly Descriptor: Descriptor = new Descriptor("pip-services", "factory", "postgres", "default", "1.0");
    public static readonly PostgresConnectionDescriptor: Descriptor = new Descriptor("pip-services", "connection", "postgres", "*", "1.0");

    /**
	 * Create a new instance of the factory.
	 */
    public constructor() {
        super();
        this.registerAsType(DefaultPostgresFactory.PostgresConnectionDescriptor, PostgresConnection);
    }
}
