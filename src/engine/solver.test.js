import * as R from "ramda";
import { solve, filterCandidates, NAKED_SINGLE, applySteps } from "./solver";
import { init, atBoard, updateCandidates } from "../board/actions/board";
import { newCell } from "../board/actions/cell";
import formatSteps from "../formatSteps";

const size = 9;

const TEST_SOLVED = `629543817
158762493
734891625
876219534
412635789
395487261
241976358
583124976
967358142
`;

const TEST_SINGLES_SIMPLE = `62.543817
158762493
734891625
8762195.4
412635789
395487261
241976.58
583124976
967358142
`;

const TEST_SINGLES_COMPLEX = `1.4.9..68
956.18.34
..84.6951
51.....86
8..6...12
642.8..97
781923645
495.6.823
.6.854179
`;

const TEST_NAKED_PAIRS = `597.4..3.
348....6.
612.9..84
75....49.
8.9....7.
4..6...5.
17..2.64.
96..83.2.
28.....1.
`;

const TEST_NAKED_SINGLES_AND_PAIRS = `41.928...
.56.1.82.
283.75149
56...7..2
8....961.
..42.175.
64985.271
7.519.486
..87.639.
`;

const TEST_POINTING_PAIRS = `.32..61..
41.......
...9.1...
5...9...4
.6.....71
3...2...5
...5.8...
......519
.57..986.
`;

const blockOf = data => {
  return data.split(" ").map((spec, i) => {
    const cell = newCell(0, i);
    let value = spec;
    if (spec.startsWith("u")) {
      value = Number(value.substr(1));
      cell.solvedValue = value;
      cell.value = value;
    } else {
      cell.candidates = spec.split("").map(Number);
      if (cell.candidates.length === 1) {
        cell.value = cell.candidates[0];
      }
      cell.solvedCandidates = [...cell.candidates];
    }
    return cell;
  });
};

describe("solver", () => {
  describe("filterCandidates", () => {
    it("finds singles", () => {
      const block = blockOf("u4 6 1 125 12567 2567 u9 u3 u8");
      const candidates = filterCandidates(1)(block);
      const values = Object.values(candidates);
      expect(values.length).toEqual(2);
      const collected = [];
      values.forEach(value => {
        expect(value.length).toEqual(1);
        collected.push(value[0].value);
      });
      expect(collected).toContain(1);
      expect(collected).toContain(6);
    });

    it("finds pairs", () => {
      const block = blockOf("u7 u6 2348 19 19 38 23 u5 23");
      const candidates = filterCandidates(2)(block);
      const values = Object.values(candidates);
      expect(values.length).toEqual(2);
      expect(values[0].length).toEqual(2);
      expect(values[1].length).toEqual(2);
    });
  });

  describe("updateCandidates", () => {
    it("sets the correct initial state", () => {
      const data = TEST_NAKED_SINGLES_AND_PAIRS;
      const board = init(size)(data);
      const result = updateCandidates(size)(board)();
      expect(atBoard(size)(result)(2, 0).candidates).toEqual([7]);
      expect(atBoard(size)(result)(2, 4).candidates).toEqual([2, 7]);
      expect(atBoard(size)(result)(0, 1).candidates).toEqual([9]);
      expect(atBoard(size)(result)(4, 5).candidates).toEqual([3, 6, 8]);
    });
  });

  describe("solve", () => {
    it("return 0 steps for solved puzzle", () => {
      const data = TEST_SOLVED;
      const board = init(size)(data);
      expect(solve(size)(board)).toEqual([]);
      expect(atBoard(size)(board)(0, 0).solvedValue !== null).toBeTruthy();
    });

    it("solves naked singles, simple case", () => {
      const data = TEST_SINGLES_SIMPLE;
      const board = init(size)(data);
      const steps = solve(size)(board);
      const coords = steps.map(a => ({ x: a.solved[0].x, y: a.solved[0].y }));
      const types = steps.map(a => a.type);
      expect(types).toEqual(["nakedSingle", "nakedSingle", "nakedSingle"]);
      expect(coords.length).toEqual(3);
      expect(coords).toContainEqual({ x: 2, y: 0 });
      expect(coords).toContainEqual({ x: 7, y: 3 });
      expect(coords).toContainEqual({ x: 6, y: 6 });
    });

    it("solves naked singles, complex case", () => {
      const data = TEST_SINGLES_COMPLEX;
      const board = init(size)(data);
      const steps = solve(size)(board);
      const coords = steps
        .filter(a => a.type === NAKED_SINGLE)
        .map(a => ({ x: a.solved[0].x, y: a.solved[0].y }));
      const types = steps.map(a => a.type);
      expect(types).toContain("nakedSingle");
      expect(coords).toContainEqual({ x: 2, y: 8 });
    });

    it("solves naked pairs", () => {
      const data = TEST_NAKED_PAIRS;
      const board = init(size)(data);
      const steps = solve(size)(board);
      // expect(steps.length).toEqual(27);
      expect(steps.map(a => a.type)).toContain("nakedPair");
    });

    it("solves pointing pairs", () => {
      const data = TEST_POINTING_PAIRS;
      const board = init(size)(data);
      const steps = solve(size)(board, true);
      expect(steps.map(a => a.type)).toContain("pointingPair");
    });

    it("creates a solution that does not change during applying steps", () => {
      const data = TEST_NAKED_SINGLES_AND_PAIRS;
      const board = init(size)(data);
      const steps = solve(size)(board);
      //console.log(formatSteps(steps));
      let result = board;
      // TODO
      /* for (let i = 0; i < steps.length; ++i) {
        const step = steps[i];
        const remainingSteps = steps.slice(i + 1);
        result = applySteps(size)(result)([step]);
        const newSteps = solve(size)(result);
        for (let j = 0; j < remainingSteps.length; ++j) {
          const remStep = remainingSteps[j];
          if (!R.equals(remStep, newSteps[j])) {
            console.log(
              "No match at",
              i,
              j,
              "\n",
              formatSteps([remStep, newSteps[j]])
            );
          } else {
            console.log("matched", i, j, formatSteps([remStep]));
          }
        }
        expect(remainingSteps).toEqual(newSteps);
      } */
    });
  });
});
