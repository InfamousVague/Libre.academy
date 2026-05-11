/// Auto-split from the original `src/data/trees.ts` monolith — see
/// `scripts/split-trees.mjs` for the splitter. The shape of the data
/// is unchanged; only the file boundaries moved.
import type { SkillTree } from "./_core";
export const MOBILE: SkillTree = {
  id: "mobile",
  title: "Mobile Development",
  short: "Mobile",
  audience: "specialty",
  accent: "#a78bfa",
  description:
    "Two parallel tracks: React Native (TypeScript) and Swift / SwiftUI for iOS. The RN track is well-covered; the Swift track is mostly content gaps today.",
  nodes: [
    {
      id: "ts-types",
      label: "TypeScript Types",
      summary: "Type annotations, interfaces, generics.",
      prereqs: [],
      matches: [],
      gapNote: "No TypeScript course exists. Host in a new `typescript-fundamentals`.",
    },
    {
      id: "rn-components",
      label: "RN Components",
      summary: "Native components vs HTML, View / Text / Image.",
      prereqs: ["ts-types"],
      matches: [
      ],
    },
    {
      id: "rn-styling",
      label: "RN Styling",
      summary: "StyleSheet.create, Yoga flexbox.",
      prereqs: ["rn-components"],
      matches: [
      ],
    },
    {
      id: "rn-state",
      label: "RN State",
      summary: "Component state, props vs state.",
      prereqs: ["rn-components"],
      matches: [
      ],
    },
    {
      id: "rn-navigation",
      label: "RN Navigation",
      summary: "Stack and tab navigators, route params.",
      prereqs: ["rn-state"],
      matches: [
      ],
    },
    {
      id: "rn-forms",
      label: "RN Forms",
      summary: "TextInput, controlled state.",
      prereqs: ["rn-state"],
      matches: [
      ],
    },
    {
      id: "rn-async-storage",
      label: "AsyncStorage",
      summary: "Persistent key-value store on the device.",
      prereqs: ["rn-state"],
      matches: [
      ],
    },
    {
      id: "rn-fetch-api",
      label: "RN Fetch",
      summary: "HTTP requests from the device.",
      prereqs: ["rn-state"],
      matches: [
      ],
    },
    {
      id: "rn-flatlist",
      label: "RN Lists",
      summary: "Virtualised scrolling lists, item rendering.",
      prereqs: ["rn-state"],
      matches: [
      ],
    },
    {
      id: "swift-basics",
      label: "Swift Basics",
      summary: "let / var, types, control flow.",
      prereqs: [],
      matches: [],
      gapNote: "Only challenge bank. Host in a new `swift-fundamentals`.",
    },
    {
      id: "swift-optionals",
      label: "Optionals",
      summary: "?, !, if let, guard let.",
      prereqs: ["swift-basics"],
      matches: [],
      gapNote: "Pair with swift-fundamentals.",
    },
    {
      id: "swift-classes",
      label: "Swift Classes & Structs",
      summary: "Reference vs value semantics.",
      prereqs: ["swift-basics"],
      matches: [],
      gapNote: "Pair with swift-fundamentals.",
    },
    {
      id: "ios-views",
      label: "SwiftUI Views",
      summary: "Declarative UI, state, modifiers.",
      prereqs: ["swift-classes", "swift-optionals"],
      matches: [],
      gapNote: "No SwiftUI/UIKit course. Host in a new `swiftui-fundamentals`.",
    },
    {
      id: "watch-companion",
      label: "watchOS Companion",
      summary: "Apple Watch app paired with iPhone.",
      prereqs: ["ios-views"],
      matches: [],
      gapNote: "No watchOS course. Host in a new `watchos-fundamentals`.",
    },
  ],
};
