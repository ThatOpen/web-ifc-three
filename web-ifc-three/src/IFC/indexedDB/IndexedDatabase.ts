export enum DBOperation {
    transferIfcModel,
    transferIndividualItems
}

export class IndexedDatabase {
    async save(item: any, id: DBOperation) {
        const open = IndexedDatabase.openOrCreateDB(id);
        this.createSchema(open, id)
        return new Promise<any>((resolve, reject) => {
            open.onsuccess = () => this.saveItem(item, open, id, resolve);
        });
    }

    async load(id: number) {
        const open = IndexedDatabase.openOrCreateDB(id);
        return new Promise<any>((resolve, reject) => {
            open.onsuccess = () => this.loadItem(open, id, resolve);
        })
    }

    private createSchema(open: IDBOpenDBRequest, id: DBOperation) {
        open.onupgradeneeded = function () {
            const db = open.result;
            db.createObjectStore(id.toString(), {keyPath: "id"});
        };
    }

    private saveItem(item: any, open: IDBOpenDBRequest, id: DBOperation, resolve: (value: any) => void ) {
        const {db, tx, store} = IndexedDatabase.getDBItems(open, id);
        item.id = id;
        store.put(item);
        tx.oncomplete = () => IndexedDatabase.closeDB(db, tx, resolve);
    }

    private loadItem(open: IDBOpenDBRequest, id: DBOperation, resolve: (value: any) => void ) {
        const {db, tx, store} = IndexedDatabase.getDBItems(open, id);
        const item = store.get(id);
        const callback = () => {
            delete item.result.id;
            resolve(item.result)
        };
        tx.oncomplete = () => IndexedDatabase.closeDB(db, tx, callback);
    }

    private static getDBItems(open: IDBOpenDBRequest, id: DBOperation) {
        const db = open.result;
        const tx = db.transaction(id.toString(), "readwrite");
        const store = tx.objectStore(id.toString());
        return {db, tx, store};
    }

    private static openOrCreateDB(id: DBOperation) {
        return indexedDB.open(id.toString(), 1);
    }

    private static closeDB(db: IDBDatabase, tx: IDBTransaction, resolve: (value: any) => void) {
        db.close();
        resolve("success");
    }
}