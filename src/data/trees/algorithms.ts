/// Auto-split from the original `src/data/trees.ts` monolith — see
/// `scripts/split-trees.mjs` for the splitter. The shape of the data
/// is unchanged; only the file boundaries moved.
import type { SkillTree } from "./_core";
export const ALGORITHMS: SkillTree = {
  id: "algorithms",
  title: "Data & Algorithms",
  short: "Algorithms",
  audience: "specialty",
  accent: "#3f8a7c",
  description:
    "Big-O up through divide-and-conquer, dynamic programming, graph traversal. Pulls from Open Data Structures + Erickson's Algorithms.",
  nodes: [
    {
      id: "bigo",
      label: "Big-O Analysis",
      summary: "Asymptotic complexity, amortised cost.",
      prereqs: [],
      matches: [
      ],
    },
    {
      id: "arrays-algo",
      label: "Arrays",
      summary: "Random access, doubling resize, amortisation.",
      prereqs: ["bigo"],
      matches: [
        { courseId: "the-rust-programming-language", lessonId: "creating-vectors" },
      ],
    },
    {
      id: "linked-lists-algo",
      label: "Linked Lists",
      summary: "Singly + doubly linked, pointer manipulation.",
      prereqs: ["arrays-algo"],
      matches: [
      ],
    },
    {
      id: "stacks-queues",
      label: "Stacks & Queues",
      summary: "ArrayStack, ArrayQueue, the circular-buffer trick.",
      prereqs: ["arrays-algo"],
      matches: [
      ],
    },
    {
      id: "hash-tables",
      label: "Hash Tables",
      summary: "Chaining vs linear probing, load factor.",
      prereqs: ["arrays-algo"],
      matches: [
      ],
    },
    {
      id: "trees-bst",
      label: "BSTs",
      summary: "Search, insert, delete; balanced variants.",
      prereqs: ["linked-lists-algo"],
      matches: [
      ],
    },
    {
      id: "graphs-bfs-dfs",
      label: "Graphs (BFS/DFS)",
      summary: "Adjacency lists, traversal orderings.",
      prereqs: ["trees-bst", "hash-tables"],
      matches: [
      ],
    },
    {
      id: "sorting-basic",
      label: "Sorting (Basic)",
      summary: "Comparison-based sorts: bubble, insertion, selection.",
      prereqs: ["arrays-algo"],
      matches: [
      ],
    },
    {
      id: "sorting-advanced",
      label: "Sorting (Advanced)",
      summary: "Mergesort, quicksort, the recurrence T(n)=2T(n/2)+n.",
      prereqs: ["sorting-basic"],
      matches: [
      ],
    },
    {
      id: "binary-search",
      label: "Binary Search",
      summary: "Halving the search space, the canonical lg n.",
      prereqs: ["arrays-algo"],
      matches: [
      ],
    },
    {
      id: "recursion-divide-conquer",
      label: "Divide & Conquer",
      summary: "The recursion fairy, master theorem.",
      prereqs: ["bigo"],
      matches: [
      ],
    },
    {
      id: "dp-basic",
      label: "DP (Basic)",
      summary: "Memoisation, tabulation, LCS.",
      prereqs: ["recursion-divide-conquer"],
      matches: [
      ],
    },
    {
      id: "dp-advanced",
      label: "DP (Advanced)",
      summary: "Edit distance, knapsack, multi-dimensional state.",
      prereqs: ["dp-basic"],
      matches: [
      ],
    },
    {
      id: "greedy",
      label: "Greedy Algorithms",
      summary: "Exchange arguments, interval scheduling.",
      prereqs: ["bigo"],
      matches: [
      ],
    },
    {
      id: "tries",
      label: "Tries",
      summary: "Prefix trees for fast string lookup.",
      prereqs: ["trees-bst"],
      matches: [],
      gapNote: "No trie lesson. Host in `open-data-structures` or `algorithms-erickson`.",
    },
    {
      id: "heaps",
      label: "Heaps",
      summary: "Binary heap as implicit tree, priority queue ops.",
      prereqs: ["trees-bst"],
      matches: [
      ],
    },
  ],
};
