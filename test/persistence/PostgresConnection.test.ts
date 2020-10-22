const assert = require('chai').assert;
const process = require('process');

import { ConfigParams } from 'pip-services3-commons-node';
import { PostgresConnection } from '../../src/persistence/PostgresConnection';

suite('PostgresConnection', ()=> {
    let connection: PostgresConnection;

    let postgresUri = process.env['POSTGRES_URI'];
    let postgresHost = process.env['POSTGRES_HOST'] || 'localhost';
    let postgresPort = process.env['POSTGRES_PORT'] || 5432;
    let postgresDatabase = process.env['POSTGRES_DB'] || 'test';
    let postgresUser = process.env['POSTGRES_USER'] || 'postgres';
    let postgresPassword = process.env['POSTGRES_PASSWORD'] || 'postgres';
    if (postgresUri == null && postgresHost == null)
        return;

    setup((done) => {
        let dbConfig = ConfigParams.fromTuples(
            'connection.uri', postgresUri,
            'connection.host', postgresHost,
            'connection.port', postgresPort,
            'connection.database', postgresDatabase,
            'credential.username', postgresUser,
            'credential.password', postgresPassword
        );

        connection = new PostgresConnection();
        connection.configure(dbConfig);

        connection.open(null, done);
    });

    teardown((done) => {
        connection.close(null, done);
    });

    test('Open and Close', (done) => {
        assert.isObject(connection.getConnection());
        assert.isString(connection.getDatabaseName());

        done();
    });
});