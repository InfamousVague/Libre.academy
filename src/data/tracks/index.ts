/// Public surface for learning-track data.
///
/// Mirrors the layout of `data/trees/` — a tiny `_core.ts` with
/// shared types/helpers and one file per track. Exports a flat
/// `TRACKS` array consumed by the UI; export each track
/// individually as well so single-track imports stay
/// tree-shake-friendly.

export * from "./_core";

import type { LearningTrack } from "./_core";

/// "Front-End Engineer" — the most common starting outcome. Walks
/// the learner from variables/loops up through React + TypeScript
/// + a deploy strategy. Cross-tree: leans on Foundations for the
/// language basics and Web for everything browser-shaped.
const FRONT_END_ENGINEER: LearningTrack = {
  id: "front-end-engineer",
  title: "Front-End Engineer",
  short: "Front-End",
  outcome: "Ship a polished, accessible single-page app to the web.",
  description:
    "Take a fresh learner from \"hello world\" to a deployed React + TypeScript app. Covers the language fundamentals, the browser platform, component thinking, and the toolchain you'll see at any modern web shop.",
  accent: "#7faaff",
  difficulty: "beginner",
  estimatedHours: 80,
  steps: [
    { treeId: "foundations", nodeId: "variables" },
    { treeId: "foundations", nodeId: "if-else" },
    { treeId: "foundations", nodeId: "for-loops" },
    { treeId: "foundations", nodeId: "functions" },
    { treeId: "foundations", nodeId: "arrays" },
    { treeId: "foundations", nodeId: "objects" },
    { treeId: "web", nodeId: "html-structure" },
    { treeId: "web", nodeId: "css-selectors" },
    { treeId: "web", nodeId: "css-flexbox" },
    { treeId: "web", nodeId: "css-grid" },
    { treeId: "web", nodeId: "css-responsive" },
    { treeId: "web", nodeId: "js-dom" },
    { treeId: "web", nodeId: "js-events" },
    { treeId: "web", nodeId: "fetch" },
    { treeId: "web", nodeId: "promises" },
    { treeId: "web", nodeId: "async-await" },
    { treeId: "web", nodeId: "ts-basics" },
    { treeId: "web", nodeId: "react-components" },
    { treeId: "web", nodeId: "react-state" },
    { treeId: "web", nodeId: "react-effects" },
    { treeId: "web", nodeId: "ts-react" },
    { treeId: "web", nodeId: "routing" },
    { treeId: "web", nodeId: "forms" },
    { treeId: "web", nodeId: "static-deployment" },
  ],
};

/// "Smart-Contract Developer" — Solidity-on-EVM track. Assumes the
/// learner already has the Foundations basics; if they don't, the
/// track's first few steps double as a quick refresher and the gap
/// surfacing on incomplete steps will tell them where to backfill.
const SMART_CONTRACT_DEVELOPER: LearningTrack = {
  id: "smart-contract-developer",
  title: "Smart-Contract Developer",
  short: "Contracts",
  outcome: "Write, test, and deploy production-grade EVM contracts.",
  description:
    "Land a Solidity-on-EVM job. The track maps the mental model (storage, gas, calldata), the standard token interfaces (ERC-20 / 721 / 1155), and the security primitives you'll be asked about in any audit-track interview.",
  accent: "#a78bfa",
  difficulty: "intermediate",
  estimatedHours: 60,
  steps: [
    { treeId: "foundations", nodeId: "variables" },
    { treeId: "foundations", nodeId: "functions" },
    { treeId: "foundations", nodeId: "arrays" },
    { treeId: "foundations", nodeId: "objects" },
    { treeId: "foundations", nodeId: "error-handling" },
    { treeId: "smart-contracts", nodeId: "evm-mental-model" },
    { treeId: "smart-contracts", nodeId: "solidity-storage" },
    { treeId: "smart-contracts", nodeId: "solidity-functions" },
    { treeId: "smart-contracts", nodeId: "solidity-events" },
    { treeId: "smart-contracts", nodeId: "modifiers" },
    { treeId: "smart-contracts", nodeId: "erc20-basics" },
    { treeId: "smart-contracts", nodeId: "erc20-allowance" },
    { treeId: "smart-contracts", nodeId: "erc721-nfts" },
    { treeId: "smart-contracts", nodeId: "security-cei" },
    { treeId: "smart-contracts", nodeId: "security-reentrancy" },
    { treeId: "smart-contracts", nodeId: "security-overflow" },
    { treeId: "smart-contracts", nodeId: "gas-storage-cost" },
    { treeId: "smart-contracts", nodeId: "factories-create2" },
    { treeId: "smart-contracts", nodeId: "proxies-uups" },
    { treeId: "smart-contracts", nodeId: "amm-basics" },
  ],
};

/// "Mobile Engineer" — React-Native-first cross-platform track.
/// Pulls in the JS / TS basics from Foundations + Web, then walks
/// the RN component model. iOS-Swift as a bonus capstone for the
/// learner who wants the native side too.
const MOBILE_ENGINEER: LearningTrack = {
  id: "mobile-engineer",
  title: "Mobile Engineer",
  short: "Mobile",
  outcome: "Ship a cross-platform app to the App Store + Play Store.",
  description:
    "React Native–first track for the learner who wants one codebase on two stores. Closes with an optional Swift / SwiftUI capstone so you can drop into the native iOS layer when the cross-platform abstraction leaks.",
  accent: "#34d399",
  difficulty: "intermediate",
  estimatedHours: 70,
  steps: [
    { treeId: "foundations", nodeId: "variables" },
    { treeId: "foundations", nodeId: "functions" },
    { treeId: "foundations", nodeId: "arrays" },
    { treeId: "foundations", nodeId: "objects" },
    { treeId: "web", nodeId: "ts-basics" },
    { treeId: "web", nodeId: "promises" },
    { treeId: "web", nodeId: "async-await" },
    { treeId: "web", nodeId: "react-components" },
    { treeId: "web", nodeId: "react-state" },
    { treeId: "web", nodeId: "react-effects" },
    { treeId: "mobile", nodeId: "ts-types" },
    { treeId: "mobile", nodeId: "rn-components" },
    { treeId: "mobile", nodeId: "rn-styling" },
    { treeId: "mobile", nodeId: "rn-state" },
    { treeId: "mobile", nodeId: "rn-navigation" },
    { treeId: "mobile", nodeId: "rn-forms" },
    { treeId: "mobile", nodeId: "rn-fetch-api" },
    { treeId: "mobile", nodeId: "rn-async-storage" },
    { treeId: "mobile", nodeId: "rn-flatlist" },
    { treeId: "mobile", nodeId: "swift-basics" },
    { treeId: "mobile", nodeId: "ios-views" },
  ],
};

/// "Interview Prep" — focused on the data-structures + algorithms
/// drills that show up in coding interviews. Doesn't promise a
/// career outcome by itself; pairs naturally with one of the
/// engineering tracks above.
const INTERVIEW_PREP: LearningTrack = {
  id: "interview-prep",
  title: "Interview Prep",
  short: "Interview",
  outcome: "Pass the algorithms round at any tech-interview pipeline.",
  description:
    "Targeted DS&A drill list. Walks Big-O up through dynamic programming with the canonical interview patterns layered in (two pointers, sliding window, BFS / DFS, divide-and-conquer). Pair with a language track for the syntax muscle.",
  accent: "#fb923c",
  difficulty: "intermediate",
  estimatedHours: 50,
  steps: [
    { treeId: "foundations", nodeId: "arrays" },
    { treeId: "foundations", nodeId: "recursion" },
    { treeId: "algorithms", nodeId: "bigo" },
    { treeId: "algorithms", nodeId: "arrays-algo" },
    { treeId: "algorithms", nodeId: "linked-lists-algo" },
    { treeId: "algorithms", nodeId: "stacks-queues" },
    { treeId: "algorithms", nodeId: "hash-tables" },
    { treeId: "algorithms", nodeId: "binary-search" },
    { treeId: "algorithms", nodeId: "sorting-basic" },
    { treeId: "algorithms", nodeId: "sorting-advanced" },
    { treeId: "algorithms", nodeId: "trees-bst" },
    { treeId: "algorithms", nodeId: "graphs-bfs-dfs" },
    { treeId: "algorithms", nodeId: "recursion-divide-conquer" },
    { treeId: "algorithms", nodeId: "heaps" },
    { treeId: "algorithms", nodeId: "tries" },
    { treeId: "algorithms", nodeId: "greedy" },
    { treeId: "algorithms", nodeId: "dp-basic" },
    { treeId: "algorithms", nodeId: "dp-advanced" },
  ],
};

/// "Full-Stack Web" — bigger and more ambitious than Front-End.
/// Adds backend-shaped skills (REST, auth, JWT, edge deployment)
/// on top of the front-end core, so the learner can build BOTH
/// halves of a SaaS by themselves.
const FULL_STACK_WEB: LearningTrack = {
  id: "full-stack-web",
  title: "Full-Stack Web",
  short: "Full-Stack",
  outcome: "Build, deploy, and operate an end-to-end SaaS solo.",
  description:
    "Bigger sibling of Front-End Engineer. Same browser + React core, plus the backend-shaped skills you need to own the API, auth, and deploy story for a real product.",
  accent: "#f472b6",
  difficulty: "advanced",
  estimatedHours: 110,
  steps: [
    { treeId: "foundations", nodeId: "variables" },
    { treeId: "foundations", nodeId: "functions" },
    { treeId: "foundations", nodeId: "arrays" },
    { treeId: "foundations", nodeId: "objects" },
    { treeId: "foundations", nodeId: "error-handling" },
    { treeId: "web", nodeId: "html-structure" },
    { treeId: "web", nodeId: "css-flexbox" },
    { treeId: "web", nodeId: "css-grid" },
    { treeId: "web", nodeId: "js-dom" },
    { treeId: "web", nodeId: "js-events" },
    { treeId: "web", nodeId: "fetch" },
    { treeId: "web", nodeId: "promises" },
    { treeId: "web", nodeId: "async-await" },
    { treeId: "web", nodeId: "ts-basics" },
    { treeId: "web", nodeId: "react-components" },
    { treeId: "web", nodeId: "react-state" },
    { treeId: "web", nodeId: "react-effects" },
    { treeId: "web", nodeId: "react-query" },
    { treeId: "web", nodeId: "routing" },
    { treeId: "web", nodeId: "forms" },
    { treeId: "web", nodeId: "rest-apis" },
    { treeId: "web", nodeId: "auth-basics" },
    { treeId: "web", nodeId: "jwt" },
    { treeId: "web", nodeId: "oauth" },
    { treeId: "web", nodeId: "nextjs" },
    { treeId: "web", nodeId: "edge-deployment" },
  ],
};

export {
  FRONT_END_ENGINEER,
  SMART_CONTRACT_DEVELOPER,
  MOBILE_ENGINEER,
  INTERVIEW_PREP,
  FULL_STACK_WEB,
};

/// All shipped tracks, in the order they render on the Tracks
/// shelf. Roughly easiest-to-hardest so the new learner sees
/// "Front-End Engineer" first.
export const TRACKS: readonly LearningTrack[] = [
  FRONT_END_ENGINEER,
  MOBILE_ENGINEER,
  SMART_CONTRACT_DEVELOPER,
  FULL_STACK_WEB,
  INTERVIEW_PREP,
];
