import { Vector } from "web-ifc";
export declare class VectorMock<T> implements Vector<T> {
    private list;
    constructor(list: T[]);
    get(index: number): T;
    size(): number;
}
