// Mermaid template gallery for the toolbar dropdown.
// Covers every diagram type Mermaid 10.x ships with in this project's bundle.
// Each template is a self-contained ```mermaid``` block — Mermaid will throw
// a parse error if a skeleton is wrong, so the body must be runnable as-is.

export type MermaidTemplateKey =
  | "flowchart-td"
  | "flowchart-lr"
  | "sequence"
  | "class"
  | "state"
  | "er"
  | "gantt"
  | "pie"
  | "mindmap"
  | "journey"
  | "timeline"
  | "gitgraph"
  | "quadrant"
  | "sankey"
  | "xychart"
  | "block"
  | "requirement"
  | "c4-context"

export interface MermaidTemplate {
  key: MermaidTemplateKey
  labelEn: string
  labelJa: string
  skeleton: string
}

function fenced(body: string): string {
  return `\n\`\`\`mermaid\n${body}\n\`\`\`\n`
}

export const mermaidTemplates: MermaidTemplate[] = [
  {
    key: "flowchart-td",
    labelEn: "Flowchart (top-down)",
    labelJa: "フローチャート (上下)",
    skeleton: fenced(
      `graph TD
    A[Start] --> B{Decision}
    B -->|Yes| C[Action]
    B -->|No| D[End]
    C --> D`,
    ),
  },
  {
    key: "flowchart-lr",
    labelEn: "Flowchart (left-right)",
    labelJa: "フローチャート (左右)",
    skeleton: fenced(
      `graph LR
    A[Input] --> B[Process]
    B --> C[Output]`,
    ),
  },
  {
    key: "sequence",
    labelEn: "Sequence diagram",
    labelJa: "シーケンス図",
    skeleton: fenced(
      `sequenceDiagram
    participant U as User
    participant A as App
    participant S as Server
    U->>A: Action
    A->>S: Request
    S-->>A: Response
    A-->>U: Render`,
    ),
  },
  {
    key: "class",
    labelEn: "Class diagram",
    labelJa: "クラス図",
    skeleton: fenced(
      `classDiagram
    class Animal {
      +String name
      +int age
      +eat() void
    }
    class Dog {
      +bark() void
    }
    Animal <|-- Dog`,
    ),
  },
  {
    key: "state",
    labelEn: "State diagram",
    labelJa: "状態遷移図",
    skeleton: fenced(
      `stateDiagram-v2
    [*] --> Idle
    Idle --> Running: start
    Running --> Idle: stop
    Running --> Error: fail
    Error --> [*]`,
    ),
  },
  {
    key: "er",
    labelEn: "ER diagram",
    labelJa: "ER 図",
    skeleton: fenced(
      `erDiagram
    USER ||--o{ ORDER : places
    ORDER ||--|{ LINE_ITEM : contains
    USER {
      string id PK
      string email
    }
    ORDER {
      string id PK
      datetime createdAt
    }`,
    ),
  },
  {
    key: "gantt",
    labelEn: "Gantt chart",
    labelJa: "ガントチャート",
    skeleton: fenced(
      `gantt
    title Project schedule
    dateFormat YYYY-MM-DD
    section Design
    Spec        :a1, 2026-05-01, 7d
    Mockups     :after a1, 5d
    section Build
    Backend     :2026-05-13, 10d
    Frontend    :2026-05-15, 12d`,
    ),
  },
  {
    key: "pie",
    labelEn: "Pie chart",
    labelJa: "円グラフ",
    skeleton: fenced(
      `pie title Revenue mix
    "Subscriptions" : 60
    "Add-ons" : 25
    "Services" : 15`,
    ),
  },
  {
    key: "mindmap",
    labelEn: "Mindmap",
    labelJa: "マインドマップ",
    skeleton: fenced(
      `mindmap
  root((Idea))
    Theme A
      Subtopic A1
      Subtopic A2
    Theme B
      Subtopic B1
    Theme C`,
    ),
  },
  {
    key: "journey",
    labelEn: "User journey",
    labelJa: "ユーザージャーニー",
    skeleton: fenced(
      `journey
    title User onboarding
    section Discover
      Visit landing: 5: User
      Read pricing: 4: User
    section Activate
      Sign up: 3: User
      First memo: 5: User`,
    ),
  },
  {
    key: "timeline",
    labelEn: "Timeline",
    labelJa: "タイムライン",
    skeleton: fenced(
      `timeline
    title Product roadmap
    2026 Q2 : Beta launch
            : Sign-up flow
    2026 Q3 : Cloud sync
            : Mobile app
    2026 Q4 : Team plan`,
    ),
  },
  {
    key: "gitgraph",
    labelEn: "Git graph",
    labelJa: "Git グラフ",
    skeleton: fenced(
      `gitGraph
    commit
    branch feature
    checkout feature
    commit
    commit
    checkout main
    merge feature`,
    ),
  },
  {
    key: "quadrant",
    labelEn: "Quadrant chart",
    labelJa: "象限チャート",
    skeleton: fenced(
      `quadrantChart
    title Reach vs Cost
    x-axis Low Reach --> High Reach
    y-axis Low Cost --> High Cost
    quadrant-1 Premium
    quadrant-2 Niche
    quadrant-3 Cut
    quadrant-4 Bargain
    A: [0.3, 0.6]
    B: [0.7, 0.4]`,
    ),
  },
  {
    key: "sankey",
    labelEn: "Sankey diagram",
    labelJa: "サンキー図",
    skeleton: fenced(
      `sankey-beta
    Revenue,Subscriptions,60
    Revenue,Add-ons,25
    Revenue,Services,15
    Subscriptions,Net,45
    Add-ons,Net,20`,
    ),
  },
  {
    key: "xychart",
    labelEn: "XY chart",
    labelJa: "XY チャート",
    skeleton: fenced(
      `xychart-beta
    title "Monthly active users"
    x-axis [Jan, Feb, Mar, Apr, May, Jun]
    y-axis "MAU" 0 --> 5000
    bar [800, 1200, 2100, 2800, 3600, 4500]
    line [800, 1200, 2100, 2800, 3600, 4500]`,
    ),
  },
  {
    key: "block",
    labelEn: "Block diagram",
    labelJa: "ブロック図",
    skeleton: fenced(
      `block-beta
    columns 3
    a["Frontend"]:1
    b["API"]:1
    c["Database"]:1
    a --> b
    b --> c`,
    ),
  },
  {
    key: "requirement",
    labelEn: "Requirement diagram",
    labelJa: "要件図",
    skeleton: fenced(
      `requirementDiagram
    requirement test_req {
      id: 1
      text: the system shall sync memos
      risk: medium
      verifymethod: test
    }
    element memo_app {
      type: feature
    }
    memo_app - satisfies -> test_req`,
    ),
  },
  {
    key: "c4-context",
    labelEn: "C4 context diagram",
    labelJa: "C4 コンテキスト図",
    skeleton: fenced(
      `C4Context
    title System Context for Colason
    Person(user, "User", "Writes memos")
    System(colason, "Colason", "Markdown memo app")
    System_Ext(firestore, "Firestore", "Cloud storage")
    Rel(user, colason, "Uses")
    Rel(colason, firestore, "Syncs memos")`,
    ),
  },
]
