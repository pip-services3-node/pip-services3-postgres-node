import { FilterParams } from 'pip-services3-commons-node';
import { PagingParams } from 'pip-services3-commons-node';
import { DataPage } from 'pip-services3-commons-node';

import { IdentifiablePostgresPersistence } from '../../src/persistence/IdentifiablePostgresPersistence';
import { Dummy } from '../fixtures/Dummy';
import { IDummyPersistence } from '../fixtures/IDummyPersistence';

export class DummyPostgresPersistence 
    extends IdentifiablePostgresPersistence<Dummy, string> 
    implements IDummyPersistence
{
    public constructor() {
        super('dummies');
    }

    protected defineSchema(): void {
        this.clearSchema();
        this.ensureSchema('CREATE TABLE ' + this._tableName + ' (id TEXT PRIMARY KEY, key TEXT, content TEXT)');
        this.ensureIndex(this._tableName + '_key', { key: 1 }, { unique: true });
    }

    public getPageByFilter(correlationId: string, filter: FilterParams, paging: PagingParams, 
        callback: (err: any, page: DataPage<Dummy>) => void): void {
        filter = filter || new FilterParams();
        let key = filter.getAsNullableString('key');

        let filterCondition: string = "";
        if (key != null)
            filterCondition += "key='" + key + "'";

        super.getPageByFilter(correlationId, filterCondition, paging, null, null, callback);
    }

    public getCountByFilter(correlationId: string, filter: FilterParams, 
        callback: (err: any, count: number) => void): void {
        filter = filter || new FilterParams();
        let key = filter.getAsNullableString('key');

        let filterCondition: string = "";
        if (key != null)
            filterCondition += "key='" + key + "'";

        super.getCountByFilter(correlationId, filterCondition, callback);
    }
}