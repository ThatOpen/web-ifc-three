import {SubsetUtils} from "../../../src/IFC/components/subsets/SubsetUtils";

describe("SubsetUtils", () => {

    test("groups indices by material with one map lookup per express ID", () => {

        const sourceMap = new Map<number, any>([
            [7, {0: [0, 1, 4, 4], 2: [6, 7]}],
            [8, {0: [5, 5], 1: [2, 3]}],
        ]);
        const items = {
            indexCache: Uint32Array.from([10, 11, 12, 13, 14, 15, 16, 17]),
            map: {
                get: jest.fn((id: number) => sourceMap.get(id))
            }
        };

        const result = SubsetUtils.getAllIndicesByMaterial([7, 8, 404], items);

        expect(items.map.get).toHaveBeenCalledTimes(3);
        expect(result[0]).toEqual([10, 11, 14, 15]);
        expect(result[1]).toEqual([12, 13]);
        expect(result[2]).toEqual([16, 17]);
        expect(result[3]).toBeUndefined();
        expect(result[0]).toEqual(SubsetUtils.getAllIndicesOfGroup(0, [7, 8, 404], 0, items));
    });
});
