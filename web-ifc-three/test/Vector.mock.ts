import {Vector} from "web-ifc";

export class VectorMock<T> implements Vector<T> {

    constructor(private list: T[]) {}

    public get (index: number): T {
        return this.list[index]
    }

    public size(): number {
        return this.list.length;
    }
}
