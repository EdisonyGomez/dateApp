# Graph Report - dateApp  (2026-09-28)

## Corpus Check
- 182 files · ~89,002 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1130 nodes · 2191 edges · 121 communities (64 shown, 57 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 7 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `9ce7db3b`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- useAuth
- index.ts
- devDependencies
- index.ts
- useHandwriting.ts
- sidebar.tsx
- carousel.tsx
- ProfileExperience.tsx
- use-toast.ts
- SharedCalendar.tsx
- Header.tsx
- google.ts
- compilerOptions
- utils.ts
- cn
- DayEventsDialog.tsx
- compilerOptions
- RecurrenceField.tsx
- DiaryEntry.tsx
- components.json
- PlanForm.tsx
- useWeather.ts
- dependencies
- useSharedPlans.ts
- dialog.tsx
- holidays.ts
- menubar.tsx
- useGoogleCalendar.ts
- compilerOptions
- BookReaderModal.tsx
- TimeGridView.tsx
- useNotifications.ts
- command.tsx
- context-menu.tsx
- index.ts
- Web Push setup (Phase 2)
- 20260927_google_calendar_sync.sql
- Shadcn-UI Template Usage Instructions
- table.tsx
- database.sql
- HandwritingBookModal.tsx
- breadcrumb.tsx
- drawer.tsx
- navigation-menu.tsx
- toggle-group.tsx
- Scheduled reminders (Phase 3)
- index.ts
- AmbientHearts.tsx
- input-otp.tsx
- index.ts
- 20260822_reminders_system.sql
- 20260824_daily_surprise.sql
- 20260927_google_sync_engine.sql
- HandwritingPreview.tsx
- clsx
- date-fns
- embla-carousel-react
- framer-motion
- gsap
- @hookform/resolvers
- input-otp
- lucide-react
- motion
- next-themes
- perfect-freehand
- @radix-ui/react-accordion
- @radix-ui/react-alert-dialog
- @radix-ui/react-aspect-ratio
- @radix-ui/react-avatar
- @radix-ui/react-checkbox
- @radix-ui/react-collapsible
- @radix-ui/react-dialog
- @radix-ui/react-dropdown-menu
- @radix-ui/react-hover-card
- @radix-ui/react-label
- @radix-ui/react-menubar
- @radix-ui/react-navigation-menu
- @radix-ui/react-radio-group
- @radix-ui/react-select
- @radix-ui/react-separator
- @radix-ui/react-slider
- @radix-ui/react-slot
- @radix-ui/react-switch
- @radix-ui/react-tabs
- @radix-ui/react-toast
- @radix-ui/react-toggle
- @radix-ui/react-tooltip
- react-calendar
- react-day-picker
- react-dom
- react-hook-form
- react-resizable-panels
- react-router-dom
- @react-three/fiber
- recharts
- rrule
- sonner
- @supabase/supabase-js
- tailwind-merge
- tailwindcss-animate
- @tanstack/react-query
- three
- vaul
- zod
- 20260822_calendar_powers.sql
- 20260822_calendar_recurrence.sql
- 20260822_notifications.sql
- 20260824_profile_theme.sql
- 20260830_calendar_category.sql
- 20260927_google_oauth_states.sql

## God Nodes (most connected - your core abstractions)
1. `cn()` - 95 edges
2. `useAuth()` - 51 edges
3. `Button` - 27 edges
4. `GameService` - 23 edges
5. `SharedCalendar()` - 20 edges
6. `SupabaseService` - 19 edges
7. `compilerOptions` - 19 edges
8. `todayKey()` - 15 edges
9. `supabase` - 15 edges
10. `categoryOf()` - 14 edges

## Surprising Connections (you probably didn't know these)
- `useCarousel()` --references--> `react`  [EXTRACTED]
  src/components/ui/carousel.tsx → package.json
- `useChart()` --references--> `react`  [EXTRACTED]
  src/components/ui/chart.tsx → package.json
- `useFormField()` --references--> `react`  [EXTRACTED]
  src/components/ui/form.tsx → package.json
- `useSidebar()` --references--> `react`  [EXTRACTED]
  src/components/ui/sidebar.tsx → package.json
- `useIsMobile()` --references--> `react`  [EXTRACTED]
  src/hooks/use-mobile.tsx → package.json

## Import Cycles
- None detected.

## Communities (121 total, 57 thin omitted)

### Community 0 - "useAuth"
Cohesion: 0.05
Nodes (60): AuthForm(), AvatarUploader(), AvatarUploaderProps, DiaryEntry(), DiaryEntryProps, DiaryForm(), DiaryFormProps, getLocalDateISO() (+52 more)

### Community 1 - "index.ts"
Cohesion: 0.08
Nodes (37): CoupleGames(), DailyQuestionCard(), DailyQuestionCardProps, GameResponsesList(), GameResponsesListProps, GameStats(), GameStatsProps, QuestionFormModal() (+29 more)

### Community 2 - "devDependencies"
Cohesion: 0.04
Nodes (47): autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, lovable-tagger, devDependencies (+39 more)

### Community 3 - "index.ts"
Cohesion: 0.10
Nodes (34): COLORS, Confetti(), DailySurprise(), DailySurpriseModal(), DailySurpriseModalProps, RENDERERS, LanguageRenderer(), FactRenderer() (+26 more)

### Community 4 - "useHandwriting.ts"
Cohesion: 0.11
Nodes (34): HandwritingPad(), HandwritingPadProps, PopoverContent, Slider, emptyPage(), HistoryAction, historyReducer(), HistoryState (+26 more)

### Community 5 - "sidebar.tsx"
Cohesion: 0.05
Nodes (37): Separator, SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle (+29 more)

### Community 6 - "carousel.tsx"
Cohesion: 0.05
Nodes (33): react, react, Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem (+25 more)

### Community 7 - "ProfileExperience.tsx"
Cohesion: 0.07
Nodes (27): AmbientCanvas(), BLOBS, Reveal3D(), Reveal3DProps, ChipListEditor(), ChipListEditorProps, InlineText(), InlineTextarea() (+19 more)

### Community 8 - "use-toast.ts"
Cohesion: 0.12
Nodes (24): Toast, ToastAction, ToastActionElement, ToastClose, ToastDescription, ToastProps, ToastTitle, toastVariants (+16 more)

### Community 9 - "SharedCalendar.tsx"
Cohesion: 0.17
Nodes (23): AgendaView(), REMINDER_TEXT, DeleteMode, DeleteRecurringDialog(), GoogleIcon(), COUNTRY_NAME, groupUpcoming(), monthVariants (+15 more)

### Community 10 - "Header.tsx"
Cohesion: 0.11
Nodes (20): CalendarHeader(), CalendarHeaderProps, Header(), HeaderProps, generateHearts(), HeartParticles(), Avatar, AvatarFallback (+12 more)

### Community 11 - "google.ts"
Cohesion: 0.14
Nodes (22): cors, addOneDay(), buildDtstart(), CATEGORY_HEX, CATEGORY_TO_COLOR, categoryToColorId(), COLOR_TO_CATEGORY, colorIdToCategory() (+14 more)

### Community 12 - "compilerOptions"
Cohesion: 0.08
Nodes (24): DOM, DOM.Iterable, ES2020, src, compilerOptions, allowImportingTsExtensions, baseUrl, isolatedModules (+16 more)

### Community 13 - "utils.ts"
Cohesion: 0.09
Nodes (14): AccordionContent, AccordionItem, AccordionTrigger, Alert, AlertDescription, AlertTitle, alertVariants, Checkbox (+6 more)

### Community 14 - "cn"
Cohesion: 0.15
Nodes (17): ButtonProps, buttonVariants, Calendar(), CalendarProps, DialogFooter(), Pagination(), PaginationContent, PaginationEllipsis() (+9 more)

### Community 15 - "DayEventsDialog.tsx"
Cohesion: 0.21
Nodes (15): BadgeProps, CategoryBadge(), CategoryGlyph(), CategoryTag(), TagProps, DayEventsDialog(), QuickAdd(), QuickAddProps (+7 more)

### Community 16 - "compilerOptions"
Cohesion: 0.11
Nodes (17): ES2023, vite.config.ts, compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection (+9 more)

### Community 17 - "RecurrenceField.tsx"
Cohesion: 0.14
Nodes (16): PRESETS, RecurrenceField(), RecurrenceFieldProps, UNITS, WEEKDAYS, SelectContent, SelectItem, SelectLabel (+8 more)

### Community 18 - "DiaryEntry.tsx"
Cohesion: 0.17
Nodes (15): moodColors, moodEmojis, MoodKey, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter() (+7 more)

### Community 19 - "components.json"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 20 - "PlanForm.tsx"
Cohesion: 0.23
Nodes (13): PlanForm(), PlanFormProps, REMINDER_OPTIONS, Segmented(), Plan, baseRule(), configToRRule(), defaultRecurrence() (+5 more)

### Community 21 - "useWeather.ts"
Cohesion: 0.23
Nodes (13): rnd(), WeatherFX(), Cache, getPosition(), readCache(), useWeather(), Weather, writeCache() (+5 more)

### Community 22 - "dependencies"
Cohesion: 0.13
Nodes (15): class-variance-authority, cmdk, dependencies, class-variance-authority, cmdk, @radix-ui/react-context-menu, @radix-ui/react-popover, @radix-ui/react-progress (+7 more)

### Community 23 - "useSharedPlans.ts"
Cohesion: 0.21
Nodes (13): startDate(), useReminderScheduler(), normalize(), PlanRow, RFC-5545, useSharedPlans(), UseSharedPlansOptions, categoryFromColor() (+5 more)

### Community 24 - "dialog.tsx"
Cohesion: 0.30
Nodes (9): DeleteRecurringDialogProps, OPTIONS, PhotoCaptureProps, DialogContent, DialogDescription, DialogHeader(), DialogOverlay, DialogTitle (+1 more)

### Community 25 - "holidays.ts"
Cohesion: 0.33
Nodes (12): coHolidays(), Country, dowOf(), easterSunday(), emiliani(), holidaysByDateKey(), holidaysForYear(), keyOf() (+4 more)

### Community 26 - "menubar.tsx"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 27 - "useGoogleCalendar.ts"
Cohesion: 0.26
Nodes (10): GoogleStatus, Options, SyncCounts, SyncResult, total(), useGoogleCalendar(), buildConsentUrl(), GOOGLE_CLIENT_ID (+2 more)

### Community 28 - "compilerOptions"
Cohesion: 0.17
Nodes (11): compilerOptions, allowJs, baseUrl, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck (+3 more)

### Community 29 - "BookReaderModal.tsx"
Cohesion: 0.27
Nodes (10): bendAt(), BookReaderModal(), BookReaderModalProps, ease(), FlexibleSheet(), PageFace(), Palette, paperBackground() (+2 more)

### Community 30 - "TimeGridView.tsx"
Cohesion: 0.31
Nodes (10): AgendaViewProps, DayEventsDialogProps, layout(), minToTime(), parseMin(), Positioned, TimeGridView(), TimeGridViewProps (+2 more)

### Community 31 - "useNotifications.ts"
Cohesion: 0.40
Nodes (9): initialPermission(), NotifyOptions, Permission, useNotifications(), pushSupported(), registerServiceWorker(), subscribeToPush(), unsubscribeFromPush() (+1 more)

### Community 32 - "command.tsx"
Cohesion: 0.20
Nodes (8): Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator, CommandShortcut()

### Community 33 - "context-menu.tsx"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 34 - "index.ts"
Cohesion: 0.29
Nodes (8): addDays(), keyOf(), occurrencesFor(), pad(), Plan, supabase, toDateKey(), utcFromKey()

### Community 35 - "Web Push setup (Phase 2)"
Cohesion: 0.20
Nodes (9): 1. Generate VAPID keys (once), 2. Frontend env, 3. Function secrets, 4. Deploy the function, 5. How the function gets called, 6. Run the SQL migration, Notes, (Optional) Database Webhook instead of client invoke (+1 more)

### Community 36 - "20260927_google_calendar_sync.sql"
Cohesion: 0.33
Nodes (8): public.google_calendar_accounts, public.google_calendar_status, public.google_clear_refresh_token(), public.google_event_links, public.google_event_sync, public.google_get_refresh_token(), public.google_set_refresh_token(), public.shared_plans

### Community 37 - "Shadcn-UI Template Usage Instructions"
Cohesion: 0.22
Nodes (8): Commands, Components, Development, File Structure, Note, Shadcn-UI Template Usage Instructions, Styling, technology stack

### Community 38 - "table.tsx"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 39 - "database.sql"
Cohesion: 0.25
Nodes (7): public.daily_questions, public.diary_entries, public.game_reactions, public.game_responses, public.game_streaks, public.love_notes, public.profiles

### Community 40 - "HandwritingBookModal.tsx"
Cohesion: 0.36
Nodes (6): bendAt(), ease(), FlexibleImageSheet(), HandwritingBookModal(), HandwritingBookModalProps, useReducedMotion()

### Community 41 - "breadcrumb.tsx"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 42 - "drawer.tsx"
Cohesion: 0.25
Nodes (6): DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 43 - "navigation-menu.tsx"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 44 - "toggle-group.tsx"
Cohesion: 0.33
Nodes (5): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants

### Community 45 - "Scheduled reminders (Phase 3)"
Cohesion: 0.29
Nodes (6): 1. Run the SQL migration, 2. Deploy the function, 3. Schedule it every minute (pg_cron), How it works, Notes / limits, Scheduled reminders (Phase 3)

### Community 46 - "index.ts"
Cohesion: 0.33
Nodes (3): admin, ALLOWED_ORIGINS, redirectApp()

### Community 47 - "AmbientHearts.tsx"
Cohesion: 0.50
Nodes (3): Field(), makeSprite(), PALETTE

### Community 48 - "input-otp.tsx"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 49 - "index.ts"
Cohesion: 0.50
Nodes (3): PlanRecord, supabase, WebhookPayload

### Community 50 - "20260822_reminders_system.sql"
Cohesion: 0.50
Nodes (3): public.profiles, public.reminder_sent, public.task_completions

### Community 51 - "20260824_daily_surprise.sql"
Cohesion: 0.67
Nodes (3): public.daily_content, public.daily_surprise_state, public.profiles

### Community 52 - "20260927_google_sync_engine.sql"
Cohesion: 0.67
Nodes (3): public.google_capture_delete(), public.google_event_links, public.google_pending_deletions

## Knowledge Gaps
- **425 isolated node(s):** `$schema`, `style`, `rsc`, `tsx`, `config` (+420 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **57 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `dependencies` to `devDependencies`, `carousel.tsx`, `clsx`, `date-fns`, `embla-carousel-react`, `framer-motion`, `gsap`, `@hookform/resolvers`, `input-otp`, `lucide-react`, `motion`, `next-themes`, `perfect-freehand`, `@radix-ui/react-accordion`, `@radix-ui/react-alert-dialog`, `@radix-ui/react-aspect-ratio`, `@radix-ui/react-avatar`, `@radix-ui/react-checkbox`, `@radix-ui/react-collapsible`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`, `@radix-ui/react-hover-card`, `@radix-ui/react-label`, `@radix-ui/react-menubar`, `@radix-ui/react-navigation-menu`, `@radix-ui/react-radio-group`, `@radix-ui/react-select`, `@radix-ui/react-separator`, `@radix-ui/react-slider`, `@radix-ui/react-slot`, `@radix-ui/react-switch`, `@radix-ui/react-tabs`, `@radix-ui/react-toast`, `@radix-ui/react-toggle`, `@radix-ui/react-tooltip`, `react-calendar`, `react-day-picker`, `react-dom`, `react-hook-form`, `react-resizable-panels`, `react-router-dom`, `@react-three/fiber`, `recharts`, `rrule`, `sonner`, `@supabase/supabase-js`, `tailwind-merge`, `tailwindcss-animate`, `@tanstack/react-query`, `three`, `vaul`, `zod`?**
  _High betweenness centrality (0.240) - this node is a cross-community bridge._
- **Why does `react` connect `carousel.tsx` to `use-toast.ts`, `sidebar.tsx`, `dependencies`?**
  _High betweenness centrality (0.220) - this node is a cross-community bridge._
- **Why does `cn()` connect `cn` to `useAuth`, `index.ts`, `useHandwriting.ts`, `sidebar.tsx`, `carousel.tsx`, `ProfileExperience.tsx`, `use-toast.ts`, `Header.tsx`, `utils.ts`, `DayEventsDialog.tsx`, `RecurrenceField.tsx`, `DiaryEntry.tsx`, `PlanForm.tsx`, `dialog.tsx`, `menubar.tsx`, `BookReaderModal.tsx`, `command.tsx`, `context-menu.tsx`, `table.tsx`, `HandwritingBookModal.tsx`, `breadcrumb.tsx`, `drawer.tsx`, `navigation-menu.tsx`, `toggle-group.tsx`, `input-otp.tsx`?**
  _High betweenness centrality (0.214) - this node is a cross-community bridge._
- **What connects `$schema`, `style`, `rsc` to the rest of the system?**
  _425 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `useAuth` be split into smaller, more focused modules?**
  _Cohesion score 0.05078416728902166 - nodes in this community are weakly interconnected._
- **Should `index.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.07539682539682539 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.041666666666666664 - nodes in this community are weakly interconnected._