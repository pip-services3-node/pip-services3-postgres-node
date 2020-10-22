/** @module build */
import { Factory } from 'pip-services3-components-node';
import { Descriptor } from 'pip-services3-commons-node';

import { PostgresConnection } from '../persistence/PostgresConnection';

/**
 * Creates Postgres components by their descriptors.
 * 
 * @see [[https://rawgit.com/pip-services-node/pip-services3-components-node/master/doc/api/classes/build.factory.html Factory]]
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
