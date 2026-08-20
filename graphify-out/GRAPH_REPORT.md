# Graph Report - .  (2026-08-20)

## Corpus Check
- 117 files · ~1,134,134 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 704 nodes · 1199 edges · 84 communities (36 shown, 48 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 9 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Backend Evaluation & Indexing Engine
- Linter & Code Formatting Toolchain
- UI Component Primitives
- UI Component Primitives
- UI Component Primitives
- Linter & Code Formatting Toolchain
- UI Component Primitives
- UI Component Primitives
- UI Component Primitives
- SSR Error Capture & Server Gateway
- UI Component Primitives
- Module: components.json
- Backend Proxy & RAG Integration Layer
- Supabase Cloud Sync & Chat Input
- UI Component Primitives
- Module: menubar.tsx
- AskConsole & Routing Controller
- Module: form.tsx
- Module: carousel.tsx
- Module: lucide-react
- Module: ChatMessage.tsx
- UI Component Primitives
- UI Component Primitives
- UI Component Primitives
- Module: table.tsx
- Module: breadcrumb.tsx
- Module: drawer.tsx
- Module: navigation-menu.tsx
- UI Component Primitives
- Module: toggle.tsx
- Module: sonner.tsx
- Module: class-variance-authority
- Module: clsx
- Module: cmdk
- Module: date-fns
- Module: embla-carousel-react
- Module: @hookform/resolvers
- Module: input-otp
- UI Component Primitives
- UI Component Primitives
- UI Component Primitives
- Module: @radix-ui/react-collapsible
- Module: @radix-ui/react-context-menu
- UI Component Primitives
- Module: @radix-ui/react-dropdown-menu
- UI Component Primitives
- Module: @radix-ui/react-label
- Module: @radix-ui/react-menubar
- Module: @radix-ui/react-navigation-menu
- UI Component Primitives
- Module: @radix-ui/react-radio-group
- Module: @radix-ui/react-scroll-area
- Module: @radix-ui/react-select
- Module: @radix-ui/react-separator
- Module: @radix-ui/react-slider
- Module: @radix-ui/react-switch
- Module: @radix-ui/react-tabs
- Module: @radix-ui/react-toggle
- Module: @radix-ui/react-toggle-group
- UI Component Primitives
- Module: react
- Module: react-day-picker
- Module: react-dom
- Module: react-resizable-panels
- Module: recharts
- Module: sonner
- Supabase Cloud Sync & Chat Input
- Module: tailwind-merge
- Module: tailwindcss
- Module: @tailwindcss/vite
- Module: @tanstack/react-query
- AskConsole & Routing Controller
- Module: @tanstack/react-start
- AskConsole & Routing Controller
- Module: tw-animate-css
- Module: vaul
- Module: vite-tsconfig-paths
- Module: zod

## God Nodes (most connected - your core abstractions)
1. `cn()` - 246 edges
2. `compilerOptions` - 22 edges
3. `ask_endpoint()` - 15 edges
4. `generate_grounded_answer()` - 9 edges
5. `buttonVariants` - 9 edges
6. `build_index()` - 8 edges
7. `ChatIndexPage()` - 8 edges
8. `scripts` - 7 edges
9. `get_vectorstore()` - 7 edges
10. `load_and_chunk()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `ResultHeader()` --calls--> `cn()`  [EXTRACTED]
  src/components/grounded/AskConsole.tsx → src/lib/utils.ts
- `BoundaryState()` --calls--> `cn()`  [EXTRACTED]
  src/components/grounded/AskConsole.tsx → src/lib/utils.ts
- `AssistantBubble()` --calls--> `cn()`  [EXTRACTED]
  src/components/grounded/ChatMessage.tsx → src/lib/utils.ts
- `StatusTag()` --calls--> `cn()`  [EXTRACTED]
  src/components/grounded/ChatMessage.tsx → src/lib/utils.ts
- `RefusalDetail()` --calls--> `cn()`  [EXTRACTED]
  src/components/grounded/ChatMessage.tsx → src/lib/utils.ts

## Import Cycles
- None detected.

## Communities (84 total, 48 thin omitted)

### Community 0 - "Backend Evaluation & Indexing Engine"
Cohesion: 0.07
Nodes (45): _get_field(), Day 4 Internal Evaluation Suite. Measures: 1. Retrieval Precision@K 2. Citation…, run_evaluation(), build_index(), _get_embeddings(), get_vectorstore(), Embedding + Chroma vectorstore build/load. Persists to disk so the API doesn't…, Build or load the persisted Chroma index. (+37 more)

### Community 1 - "Linter & Code Formatting Toolchain"
Cohesion: 0.04
Nodes (46): eslint, eslint-config-prettier, @eslint/js, eslint-plugin-prettier, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @lovable.dev/vite-tanstack-config (+38 more)

### Community 2 - "UI Component Primitives"
Cohesion: 0.08
Nodes (37): AccordionContent, AccordionItem, AccordionTrigger, Avatar, AvatarFallback, AvatarImage, ContextMenuCheckboxItem, ContextMenuContent (+29 more)

### Community 3 - "UI Component Primitives"
Cohesion: 0.07
Nodes (32): Input, Separator, Sidebar, SidebarContent, SidebarContext, SidebarContextProps, SidebarFooter, SidebarGroup (+24 more)

### Community 4 - "UI Component Primitives"
Cohesion: 0.08
Nodes (31): AskConsole(), useAskController(), DEMO_CASES, getRouter(), Route, DemoPage(), Route, ArchNode (+23 more)

### Community 5 - "Linter & Code Formatting Toolchain"
Cohesion: 0.06
Nodes (31): DOM, DOM.Iterable, ES2022, eslint.config.js, src/**/*.ts, src/**/*.tsx, vite/client, vite.config.ts (+23 more)

### Community 6 - "UI Component Primitives"
Cohesion: 0.08
Nodes (15): Checkbox, HoverCardContent, InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot, PopoverContent, Progress (+7 more)

### Community 7 - "UI Component Primitives"
Cohesion: 0.12
Nodes (21): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle (+13 more)

### Community 8 - "UI Component Primitives"
Cohesion: 0.15
Nodes (17): BoundaryState(), ResultHeader(), ClaimCard(), colorFor(), ConfidenceBadge(), toneFor(), EvidencePanel(), ask (+9 more)

### Community 9 - "SSR Error Capture & Server Gateway"
Cohesion: 0.16
Nodes (13): consumeLastCapturedError(), describeError(), describeStatus(), originalConsoleError, safeStringify(), renderErrorPage(), fetch(), getServerEntry() (+5 more)

### Community 10 - "UI Component Primitives"
Cohesion: 0.16
Nodes (9): ChatSidebar(), ChatSidebarProps, ConvoGroup(), GroundedLogo(), ModeBadge(), ThemeToggle(), API_BASE_URL, Conversation (+1 more)

### Community 11 - "Module: components.json"
Cohesion: 0.11
Nodes (18): aliases, components, hooks, lib, ui, utils, iconLibrary, registries (+10 more)

### Community 12 - "Backend Proxy & RAG Integration Layer"
Cohesion: 0.16
Nodes (18): API_BASE, callBackendApi(), Chunk, classifyRisk(), CORPUS, DOSAGE_PATTERNS, EMERGENCY_PATTERNS, firstSentence() (+10 more)

### Community 13 - "Supabase Cloud Sync & Chat Input"
Cohesion: 0.23
Nodes (15): ChatInput(), ChatInputProps, ChatMessage, deleteCloudConversation(), fetchCloudConversations(), isSupabaseConfigured, supabase, syncConversationToCloud() (+7 more)

### Community 14 - "UI Component Primitives"
Cohesion: 0.12
Nodes (14): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut() (+6 more)

### Community 15 - "Module: menubar.tsx"
Cohesion: 0.12
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 16 - "AskConsole & Routing Controller"
Cohesion: 0.19
Nodes (14): build_context(), format_citation(), generate_grounded_answer(), _mark_provider_failed(), _parse_llm_json(), _provider_is_healthy(), Grounded generation module. Enforces strict 7-rule grounding prompt, JSON…, Parse JSON from LLM response with resilient repair and field extraction. (+6 more)

### Community 17 - "Module: form.tsx"
Cohesion: 0.19
Nodes (12): FormControl, FormDescription, FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue, FormLabel (+4 more)

### Community 18 - "Module: carousel.tsx"
Cohesion: 0.19
Nodes (13): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+5 more)

### Community 19 - "Module: lucide-react"
Cohesion: 0.15
Nodes (13): lucide-react, dependencies, lucide-react, @radix-ui/react-aspect-ratio, @radix-ui/react-checkbox, @radix-ui/react-progress, @radix-ui/react-slot, react-hook-form (+5 more)

### Community 20 - "Module: ChatMessage.tsx"
Cohesion: 0.18
Nodes (8): AssistantBubble(), ChatMessage(), RefusalDetail(), StatusTag(), STAGE_ICONS, STAGE_SHORT, STAGES, StageTracker()

### Community 21 - "UI Component Primitives"
Cohesion: 0.25
Nodes (9): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartTooltipContent, getPayloadConfigFromPayload(), THEMES (+1 more)

### Community 22 - "UI Component Primitives"
Cohesion: 0.25
Nodes (7): Alert, AlertDescription, AlertTitle, alertVariants, Badge(), BadgeProps, badgeVariants

### Community 23 - "UI Component Primitives"
Cohesion: 0.25
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 24 - "Module: table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 25 - "Module: breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 26 - "Module: drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 27 - "Module: navigation-menu.tsx"
Cohesion: 0.29
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 28 - "UI Component Primitives"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 29 - "Module: toggle.tsx"
Cohesion: 0.43
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

## Knowledge Gaps
- **180 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `css` (+175 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **48 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `UI Component Primitives` to `UI Component Primitives`, `UI Component Primitives`, `UI Component Primitives`, `UI Component Primitives`, `UI Component Primitives`, `UI Component Primitives`, `Supabase Cloud Sync & Chat Input`, `UI Component Primitives`, `Module: menubar.tsx`, `Module: form.tsx`, `Module: carousel.tsx`, `Module: ChatMessage.tsx`, `UI Component Primitives`, `UI Component Primitives`, `UI Component Primitives`, `Module: table.tsx`, `Module: breadcrumb.tsx`, `Module: drawer.tsx`, `Module: navigation-menu.tsx`, `UI Component Primitives`, `Module: toggle.tsx`?**
  _High betweenness centrality (0.277) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Module: lucide-react` to `Linter & Code Formatting Toolchain`, `Module: class-variance-authority`, `Module: clsx`, `Module: cmdk`, `Module: date-fns`, `Module: embla-carousel-react`, `Module: @hookform/resolvers`, `Module: input-otp`, `UI Component Primitives`, `UI Component Primitives`, `UI Component Primitives`, `Module: @radix-ui/react-collapsible`, `Module: @radix-ui/react-context-menu`, `UI Component Primitives`, `Module: @radix-ui/react-dropdown-menu`, `UI Component Primitives`, `Module: @radix-ui/react-label`, `Module: @radix-ui/react-menubar`, `Module: @radix-ui/react-navigation-menu`, `UI Component Primitives`, `Module: @radix-ui/react-radio-group`, `Module: @radix-ui/react-scroll-area`, `Module: @radix-ui/react-select`, `Module: @radix-ui/react-separator`, `Module: @radix-ui/react-slider`, `Module: @radix-ui/react-switch`, `Module: @radix-ui/react-tabs`, `Module: @radix-ui/react-toggle`, `Module: @radix-ui/react-toggle-group`, `UI Component Primitives`, `Module: react`, `Module: react-day-picker`, `Module: react-dom`, `Module: react-resizable-panels`, `Module: recharts`, `Module: sonner`, `Supabase Cloud Sync & Chat Input`, `Module: tailwind-merge`, `Module: tailwindcss`, `Module: @tailwindcss/vite`, `Module: @tanstack/react-query`, `AskConsole & Routing Controller`, `Module: @tanstack/react-start`, `AskConsole & Routing Controller`, `Module: tw-animate-css`, `Module: vaul`, `Module: vite-tsconfig-paths`, `Module: zod`?**
  _High betweenness centrality (0.043) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _180 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Backend Evaluation & Indexing Engine` be split into smaller, more focused modules?**
  _Cohesion score 0.06778476589797344 - nodes in this community are weakly interconnected._
- **Should `Linter & Code Formatting Toolchain` be split into smaller, more focused modules?**
  _Cohesion score 0.0425531914893617 - nodes in this community are weakly interconnected._
- **Should `UI Component Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.08350951374207188 - nodes in this community are weakly interconnected._
- **Should `UI Component Primitives` be split into smaller, more focused modules?**
  _Cohesion score 0.06827880512091039 - nodes in this community are weakly interconnected._