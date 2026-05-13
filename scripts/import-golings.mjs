#!/usr/bin/env node
/// Convert the Golings curriculum (https://github.com/mauricioabreu/golings)
/// into a Libre course.
///
/// Golings has the same Rustlings-style broken-program-to-fix
/// pedagogy but doesn't ship canonical solution files — the
/// upstream repo expects users to fix the exercises locally and
/// keeps no reference answers. We embed hand-crafted solutions +
/// KATA_TEST-style test harnesses inline below so the course
/// installs with everything Libre needs to surface a structured
/// pass result through the in-app Go runtime
/// (src/runtimes/go.ts).
///
/// What it does:
///   1. Reads `info.toml` from the cloned source dir to pick up
///      per-exercise hints + the chapter/path layout (the
///      authoritative order, since the repo isn't numerically
///      prefixed).
///   2. Pairs each entry with the inline `LESSONS` table below
///      (id → {solution, tests, body}). Skips with a warning if
///      a lesson hasn't been authored yet — re-runs are
///      idempotent.
///   3. Reads each exercise's starter from the source dir; the
///      starter is what the learner edits in-app.
///   4. Emits `<courses_dir>/golings/course.json`.
///
/// Source clone:
///   git clone --depth=1 https://github.com/mauricioabreu/golings.git /tmp/golings

import { readFileSync, existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";

const args = process.argv.slice(2);
const argFlag = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const SOURCE = argFlag("source", "/tmp/golings");
const OUT_DIR = argFlag(
  "out",
  join(
    homedir(),
    "Library/Application Support/com.mattssoftware.libre/courses/golings",
  ),
);

if (!existsSync(SOURCE)) {
  console.error(`Golings source not found at ${SOURCE}.`);
  console.error(
    "Clone with: git clone --depth=1 https://github.com/mauricioabreu/golings.git " +
      SOURCE,
  );
  process.exit(2);
}

/// Light TOML parser for the Golings info.toml shape. The schema is
/// `[[exercises]] name + path + mode + hint` with hint as a
/// triple-quoted string. Same shape as the Rustlings parser but
/// the field set is smaller.
function parseInfoToml(text) {
  const lines = text.split("\n");
  const exercises = [];
  let current = null;
  let inMultiline = null;
  for (const raw of lines) {
    const line = raw.replace(/\r$/, "");
    if (inMultiline) {
      const endIdx = line.indexOf('"""');
      if (endIdx >= 0) {
        const tail = line.slice(0, endIdx);
        if (tail.length > 0) inMultiline.lines.push(tail);
        current[inMultiline.key] = inMultiline.lines.join("\n").trim();
        inMultiline = null;
      } else {
        inMultiline.lines.push(line);
      }
      continue;
    }
    const trimmed = line.trim();
    if (trimmed === "" || trimmed.startsWith("#")) continue;
    if (trimmed === "[[exercises]]") {
      if (current) exercises.push(current);
      current = {};
      continue;
    }
    if (!current) continue;
    const kv = trimmed.match(/^(\w+)\s*=\s*(.*)$/);
    if (!kv) continue;
    const key = kv[1];
    const value = kv[2];
    if (value.startsWith('"""')) {
      const rest = value.slice(3);
      const endIdx = rest.indexOf('"""');
      if (endIdx >= 0) {
        current[key] = rest.slice(0, endIdx);
      } else {
        inMultiline = { key, lines: rest ? [rest] : [] };
      }
      continue;
    }
    if (value.startsWith('"') && value.endsWith('"')) {
      current[key] = value.slice(1, -1);
      continue;
    }
    current[key] = value;
  }
  if (current) exercises.push(current);
  return exercises;
}

function slug(s) {
  return s
    .toLowerCase()
    .replace(/_/g, "-")
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function chapterTitle(rawChapter) {
  // `anonymous_functions` → `Anonymous Functions`
  return rawChapter
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

function inferDifficulty(rawChapter) {
  // First five chapters in upstream's curriculum are intro
  // material; bumping concurrency + generics to hard since both
  // hide subtler runtime/type details than the surface-level
  // syntax exercises.
  if (
    [
      "variables",
      "functions",
      "if",
      "switch",
      "primitive_types",
    ].includes(rawChapter)
  )
    return "easy";
  if (["concurrent", "generics"].includes(rawChapter)) return "hard";
  return "medium";
}

/// Per-lesson solution + tests. Solutions intentionally include
/// `func main()` (joinCodeAndTests strips it before merging) so
/// the lesson code is self-contained and would compile on its own
/// if pasted into a fresh Go file. Tests follow the canonical
/// Go runtime contract from src/runtimes/go.ts:
///   - `func main()` enumerates kataTest_* functions
///   - each prints `KATA_TEST::<slug>::PASS` or
///     `KATA_TEST::<slug>::FAIL::<reason>`
/// For pure compile-mode exercises a single `kataTest_compiles`
/// is enough — the very act of compiling is the assertion.
const LESSONS = {
  // ── variables ───────────────────────────────────────────────
  variables1: {
    solution: `package main

import "fmt"

func main() {
\tvar x = 5
\tfmt.Printf("x has the value %d", x)
}
`,
    tests: compileTest("variables1"),
  },
  variables2: {
    solution: `package main

import "fmt"

func main() {
\tx := 5
\tfmt.Printf("x has the value %d", x)
}
`,
    tests: compileTest("variables2"),
  },
  variables3: {
    solution: `package main

import "fmt"

func main() {
\tvar x int = 5
\tfmt.Printf("x has the value %d", x)
}
`,
    tests: compileTest("variables3"),
  },
  variables4: {
    solution: `package main

import "fmt"

func main() {
\tx := 5
\tfmt.Printf("x has the value %d\\n", x)

\t{
\t\tx := 10
\t\tfmt.Printf("x has the value %d\\n", x)
\t}
}
`,
    tests: compileTest("variables4"),
  },
  variables5: {
    solution: `package main

import "fmt"

func main() {
\tconst x = 5
\tfmt.Printf("x has the value %d", x)
}
`,
    tests: compileTest("variables5"),
  },
  variables6: {
    solution: `package main

import "fmt"

func main() {
\tconst x = 5
\tfmt.Printf("x has the value %d", x)
}
`,
    tests: compileTest("variables6"),
  },

  // ── functions ───────────────────────────────────────────────
  functions1: {
    solution: `package main

func main() {
\tcall_me()
}

func call_me() {}
`,
    tests: compileTest("functions1"),
  },
  functions2: {
    solution: `package main

import "fmt"

func main() {
\tcallMe(10)
}

func callMe(num int) {
\tfor n := 0; n <= num; n++ {
\t\tfmt.Printf("Num is %d\\n", n)
\t}
}
`,
    tests: compileTest("functions2"),
  },
  functions3: {
    solution: `package main

import "fmt"

func main() {
\tcall_me(10)
}

func call_me(num int) {
\tfor n := 0; n <= num; n++ {
\t\tfmt.Printf("Num is %d\\n", n)
\t}
}
`,
    tests: compileTest("functions3"),
  },
  functions4: {
    solution: `package main

import "fmt"

func main() {
\tfmt.Println("1 + 2 is: ", addNumbers(1, 2))
}

func addNumbers(a int, b int) int {
\treturn a + b
}
`,
    tests: compileTest("functions4"),
  },

  // ── if ──────────────────────────────────────────────────────
  if1: {
    solution: `package main

func bigger(a int, b int) int {
\tif a > b {
\t\treturn a
\t}
\treturn b
}

func main() {}
`,
    tests: `package main

import "fmt"

func kataTest_two_is_bigger_than_one() error {
\tif got := bigger(2, 1); got != 2 {
\t\treturn fmt.Errorf("bigger(2, 1) = %d; want 2", got)
\t}
\treturn nil
}

func kataTest_ten_is_bigger_than_five() error {
\tif got := bigger(5, 10); got != 10 {
\t\treturn fmt.Errorf("bigger(5, 10) = %d; want 10", got)
\t}
\treturn nil
}

func main() {
\ttests := []struct {
\t\tname string
\t\tfn   func() error
\t}{
\t\t{"two_is_bigger_than_one", kataTest_two_is_bigger_than_one},
\t\t{"ten_is_bigger_than_five", kataTest_ten_is_bigger_than_five},
\t}
\tfor _, t := range tests {
\t\tif err := t.fn(); err != nil {
\t\t\tfmt.Printf("KATA_TEST::%s::FAIL::%s\\n", t.name, err.Error())
\t\t} else {
\t\t\tfmt.Printf("KATA_TEST::%s::PASS\\n", t.name)
\t\t}
\t}
}
`,
  },
  if2: {
    solution: `package main

func fooIfFizz(fizzish string) string {
\tif fizzish == "fizz" {
\t\treturn "foo"
\t} else if fizzish == "fuzz" {
\t\treturn "bar"
\t} else {
\t\treturn "baz"
\t}
}

func main() {}
`,
    tests: makeTableTests("if2", [
      [`fooIfFizz("fizz")`, `"foo"`, "foo_for_fizz"],
      [`fooIfFizz("fuzz")`, `"bar"`, "bar_for_fuzz"],
      [`fooIfFizz("random stuff")`, `"baz"`, "default_for_bazz"],
    ]),
  },

  // ── switch ──────────────────────────────────────────────────
  switch1: {
    solution: `package main

import "fmt"

func main() {
\tstatus := "open"
\tswitch status {
\tcase "open":
\t\tfmt.Println("status is open")
\tcase "closed":
\t\tfmt.Println("status is closed")
\t}
}
`,
    tests: compileTest("switch1"),
  },
  switch2: {
    solution: `package main

import "fmt"

func main() {
\tswitch {
\tcase 0 > 1:
\t\tfmt.Println("zero is greater than one")
\tdefault:
\t\tfmt.Println("one is greater than zero")
\t}
}
`,
    tests: compileTest("switch2"),
  },
  switch3: {
    solution: `package main

func weekDay(day int) string {
\tswitch day {
\tcase 0:
\t\treturn "Sunday"
\tcase 1:
\t\treturn "Monday"
\tcase 2:
\t\treturn "Tuesday"
\tcase 3:
\t\treturn "Wednesday"
\tcase 4:
\t\treturn "Thursday"
\tcase 5:
\t\treturn "Friday"
\tcase 6:
\t\treturn "Saturday"
\tdefault:
\t\treturn ""
\t}
}

func main() {}
`,
    tests: makeTableTests("switch3", [
      [`weekDay(0)`, `"Sunday"`, "sunday"],
      [`weekDay(1)`, `"Monday"`, "monday"],
      [`weekDay(2)`, `"Tuesday"`, "tuesday"],
      [`weekDay(3)`, `"Wednesday"`, "wednesday"],
      [`weekDay(4)`, `"Thursday"`, "thursday"],
      [`weekDay(5)`, `"Friday"`, "friday"],
      [`weekDay(6)`, `"Saturday"`, "saturday"],
    ]),
  },

  // ── primitive_types ─────────────────────────────────────────
  primitive_types1: {
    solution: `package main

import "fmt"

func main() {
\tstoreIsOpen := true
\tif storeIsOpen {
\t\tfmt.Println("The store is open, let's buy some clothes!")
\t}

\tstoreIsOpen = false
\tif !storeIsOpen {
\t\tfmt.Println("Oh no, let's buy some clothes online!")
\t}
}
`,
    tests: compileTest("primitive_types1"),
  },
  primitive_types2: {
    solution: `package main

import "fmt"

func main() {
\twho := "world"
\tfmt.Printf("Hello, %s\\n", who)
}
`,
    tests: compileTest("primitive_types2"),
  },
  primitive_types3: {
    solution: `package main

import "fmt"

func main() {
\twho := "Maurício"
\tcountry := "Brazil"
\tfmt.Printf("Hello, I am %s and live in %s\\n", who, country)
}
`,
    tests: compileTest("primitive_types3"),
  },
  primitive_types4: {
    solution: `package main

import "fmt"

func main() {
\tvar b1 byte = 110
\tfmt.Println("byte value for b1:", b1)

\tvar b2 byte = 'A'
\tfmt.Println("representation for b2:", b2)
}
`,
    tests: compileTest("primitive_types4"),
  },
  primitive_types5: {
    solution: `package main

import "fmt"

func main() {
\tvar n1 int = 101
\tif n1 > 100 {
\t\tfmt.Println("It is a big number")
\t} else {
\t\tfmt.Println("Not a big number at all")
\t}

\tvar n2 float64 = 0.99
\tfmt.Println(n2)
}
`,
    tests: compileTest("primitive_types5"),
  },

  // ── arrays ──────────────────────────────────────────────────
  arrays1: {
    solution: `package main

import "fmt"

func main() {
\tvar colors [3]string

\tcolors[0] = "red"
\tcolors[1] = "green"
\tcolors[2] = "blue"

\tfmt.Printf("First color is %s\\n", colors[0])
\tfmt.Printf("Last color is %s\\n", colors[2])
}
`,
    tests: compileTest("arrays1"),
  },
  arrays2: {
    solution: `package main

import "fmt"

func main() {
\tnames := [4]string{"John", "Maria", "Carl", "Anna"}
\tfmt.Println(names)
}
`,
    tests: compileTest("arrays2"),
  },

  // ── slices ──────────────────────────────────────────────────
  slices1: {
    solution: `package main

import "fmt"

func main() {
\ta := make([]int, 3, 10)
\tfmt.Println("length of 'a':", len(a))
\tfmt.Println("capacity of 'a':", cap(a))
}
`,
    tests: compileTest("slices1"),
  },
  slices2: {
    solution: `package main

import "fmt"

func main() {
\tnames := [4]string{"John", "Maria", "Carl", "Peter"}
\tlastTwoNames := names[2:4]
\tfmt.Println(lastTwoNames)
}
`,
    tests: compileTest("slices2"),
  },
  slices3: {
    solution: `package main

import "fmt"

func main() {
\tnames := []string{"John", "Maria", "Carl", "Peter"}
\tnames = append(names, "Anna")
\tfmt.Println(names)
}
`,
    tests: compileTest("slices3"),
  },
  slices4: {
    // The starter (which the learner can't change) constructs the
    // slice locally inside each test, so the solution is a no-op
    // helper. The TESTS we generate cover the same expectations the
    // original `_test.go` file held — slice indexing + half-open
    // bounds.
    solution: `package main

func firstName(names []string) string {
\tif len(names) == 0 {
\t\treturn ""
\t}
\treturn names[0]
}

func firstTwoNames(names []string) []string {
\tif len(names) < 2 {
\t\treturn names
\t}
\treturn names[0:2]
}

func lastTwoNames(names []string) []string {
\tif len(names) < 2 {
\t\treturn names
\t}
\treturn names[len(names)-2:]
}

func main() {}
`,
    tests: `package main

import (
\t"fmt"
\t"reflect"
)

var sample = []string{"John", "Maria", "Carl", "Peter"}

func kataTest_get_only_first_name() error {
\tgot := firstName(sample)
\tif got != "John" {
\t\treturn fmt.Errorf("firstName(sample) = %q; want %q", got, "John")
\t}
\treturn nil
}

func kataTest_get_first_two_names() error {
\twant := []string{"John", "Maria"}
\tgot := firstTwoNames(sample)
\tif !reflect.DeepEqual(got, want) {
\t\treturn fmt.Errorf("firstTwoNames(sample) = %v; want %v", got, want)
\t}
\treturn nil
}

func kataTest_get_last_two_names() error {
\twant := []string{"Carl", "Peter"}
\tgot := lastTwoNames(sample)
\tif !reflect.DeepEqual(got, want) {
\t\treturn fmt.Errorf("lastTwoNames(sample) = %v; want %v", got, want)
\t}
\treturn nil
}

func main() {
\ttests := []struct {
\t\tname string
\t\tfn   func() error
\t}{
\t\t{"get_only_first_name", kataTest_get_only_first_name},
\t\t{"get_first_two_names", kataTest_get_first_two_names},
\t\t{"get_last_two_names", kataTest_get_last_two_names},
\t}
\tfor _, t := range tests {
\t\tif err := t.fn(); err != nil {
\t\t\tfmt.Printf("KATA_TEST::%s::FAIL::%s\\n", t.name, err.Error())
\t\t} else {
\t\t\tfmt.Printf("KATA_TEST::%s::PASS\\n", t.name)
\t\t}
\t}
}
`,
  },

  // ── maps ────────────────────────────────────────────────────
  maps1: {
    solution: `package main

import "fmt"

func main() {
\tm := make(map[string]int)

\tm["John"] = 30
\tm["Ana"] = 21

\tfmt.Printf("John is %d and Ana is %d", m["John"], m["Ana"])
}
`,
    tests: compileTest("maps1"),
  },
  maps2: {
    solution: `package main

import "fmt"

func main() {
\tm := map[string]int{"John": 30, "Ana": 21}
\tfmt.Printf("John is %d and Ana is %d", m["John"], m["Ana"])
}
`,
    tests: compileTest("maps2"),
  },
  maps3: {
    solution: `package main

func makePhoneBook() map[string]string {
\treturn map[string]string{
\t\t"Ana":  "+01 101 102",
\t\t"John": "+01 333 666",
\t}
}

func insertPhone(book map[string]string, name, number string) {
\tbook[name] = number
}

func deletePhone(book map[string]string, name string) {
\tdelete(book, name)
}

func main() {}
`,
    tests: `package main

import "fmt"

func kataTest_get_phone() error {
\tbook := makePhoneBook()
\tphone := book["Ana"]
\tif phone != "+01 101 102" {
\t\treturn fmt.Errorf("Ana phone = %q; want %q", phone, "+01 101 102")
\t}
\treturn nil
}

func kataTest_insert_phone() error {
\tbook := makePhoneBook()
\tinsertPhone(book, "Laura", "+11 99 98 97")
\tphone := book["Laura"]
\tif phone != "+11 99 98 97" {
\t\treturn fmt.Errorf("Laura phone after insert = %q; want %q", phone, "+11 99 98 97")
\t}
\treturn nil
}

func kataTest_delete_phone() error {
\tbook := makePhoneBook()
\tdeletePhone(book, "John")
\tif len(book) != 1 {
\t\treturn fmt.Errorf("book size after delete = %d; want 1", len(book))
\t}
\treturn nil
}

func main() {
\ttests := []struct {
\t\tname string
\t\tfn   func() error
\t}{
\t\t{"get_phone", kataTest_get_phone},
\t\t{"insert_phone", kataTest_insert_phone},
\t\t{"delete_phone", kataTest_delete_phone},
\t}
\tfor _, t := range tests {
\t\tif err := t.fn(); err != nil {
\t\t\tfmt.Printf("KATA_TEST::%s::FAIL::%s\\n", t.name, err.Error())
\t\t} else {
\t\t\tfmt.Printf("KATA_TEST::%s::PASS\\n", t.name)
\t\t}
\t}
}
`,
  },

  // ── range ───────────────────────────────────────────────────
  range1: {
    solution: `package main

import "fmt"

func main() {
\tevenNumbers := []int{2, 4, 6, 8, 10}

\tfor _, v := range evenNumbers {
\t\tfmt.Printf("%d is even\\n", v)
\t}
}
`,
    tests: compileTest("range1"),
  },
  range2: {
    solution: `package main

import "fmt"

func main() {
\tphoneBook := map[string]string{
\t\t"Ana":  "+01 101 102",
\t\t"John": "+01 333 666",
\t}

\tfor name, phone := range phoneBook {
\t\tfmt.Printf("%s has the %s phone\\n", name, phone)
\t}
}
`,
    tests: compileTest("range2"),
  },
  range3: {
    solution: `package main

func filterEven(in []int) []int {
\tout := []int{}
\tfor _, n := range in {
\t\tif n%2 == 0 {
\t\t\tout = append(out, n)
\t\t}
\t}
\treturn out
}

func main() {}
`,
    tests: `package main

import (
\t"fmt"
\t"reflect"
)

func kataTest_filter_even_numbers() error {
\tin := []int{1, 2, 3, 4, 5, 6, 7, 8, 9, 10}
\twant := []int{2, 4, 6, 8, 10}
\tgot := filterEven(in)
\tif !reflect.DeepEqual(got, want) {
\t\treturn fmt.Errorf("filterEven(1..10) = %v; want %v", got, want)
\t}
\treturn nil
}

func main() {
\tif err := kataTest_filter_even_numbers(); err != nil {
\t\tfmt.Printf("KATA_TEST::filter_even_numbers::FAIL::%s\\n", err.Error())
\t} else {
\t\tfmt.Println("KATA_TEST::filter_even_numbers::PASS")
\t}
}
`,
  },

  // ── structs ─────────────────────────────────────────────────
  structs1: {
    solution: `package main

import "fmt"

type Person struct {
\tname string
\tage  int
}

func main() {
\tperson := Person{name: "John", age: 32}
\tfmt.Printf("Person %s and age %d", person.name, person.age)
}
`,
    tests: compileTest("structs1"),
  },
  structs2: {
    solution: `package main

import "fmt"

type ContactDetails struct {
\tphone string
}

type Person struct {
\tname string
\tage  int
\tContactDetails
}

func main() {
\tperson := Person{name: "John", age: 32, ContactDetails: ContactDetails{phone: "+01 111 222"}}
\tfmt.Printf("%s is %d years old and his phone is %s\\n", person.name, person.age, person.phone)
}
`,
    tests: compileTest("structs2"),
  },
  structs3: {
    solution: `package main

import "fmt"

type Person struct {
\tfirstName string
\tlastName  string
}

func (p Person) FullName() string {
\treturn p.firstName + " " + p.lastName
}

func main() {
\tperson := Person{firstName: "Maurício", lastName: "Antunes"}
\tfmt.Printf("Person full name is: %s\\n", person.FullName())
}
`,
    tests: compileTest("structs3"),
  },

  // ── anonymous_functions ─────────────────────────────────────
  anonymous_functions1: {
    solution: `package main

import "fmt"

func main() {
\tfunc(name string) {
\t\tfmt.Printf("Hello %s", name)
\t}("World")
}
`,
    tests: compileTest("anonymous_functions1"),
  },
  anonymous_functions2: {
    solution: `package main

import "fmt"

func main() {
\tvar sayBye func(name string)

\tsayBye = func(name string) {
\t\tfmt.Printf("Bye %s", name)
\t}

\tsayBye("World")
}
`,
    tests: compileTest("anonymous_functions2"),
  },
  anonymous_functions3: {
    solution: `package main

import "fmt"

func updateStatus() func() string {
\tvar index int
\torderStatus := map[int]string{
\t\t1: "TO DO",
\t\t2: "DOING",
\t\t3: "DONE",
\t}

\treturn func() string {
\t\tindex++
\t\treturn orderStatus[index]
\t}
}

func main() {
\tanonymous_func := updateStatus()
\tvar status string

\tstatus = anonymous_func()
\tstatus = anonymous_func()
\tstatus = anonymous_func()

\tif status == "DONE" {
\t\tfmt.Println("Good Job!")
\t} else {
\t\tpanic("To complete the challenge the status must be DONE")
\t}
}
`,
    tests: compileTest("anonymous_functions3"),
  },

  // ── generics ────────────────────────────────────────────────
  generics1: {
    solution: `package main

import "fmt"

func main() {
\tprint("Hello, World!")
\tprint(42)
}

func print[T any](value T) {
\tfmt.Println(value)
}
`,
    tests: compileTest("generics1"),
  },
  generics2: {
    solution: `package main

import "fmt"

type Number interface {
\tint | float64
}

func main() {
\tfmt.Println(addNumbers(1, 2))
\tfmt.Println(addNumbers(1.0, 2.3))
}

func addNumbers[T Number](n1, n2 T) T {
\treturn n1 + n2
}
`,
    tests: compileTest("generics2"),
  },

  // ── concurrent ──────────────────────────────────────────────
  concurrent1: {
    solution: `package main

import (
\t"bytes"
\t"fmt"
\t"sync"
)

func printConcurrent(buf *bytes.Buffer) {
\tvar wg sync.WaitGroup
\tvar mu sync.Mutex

\tgoroutines := 3

\tfor i := 0; i < goroutines; i++ {
\t\twg.Add(1)
\t\tgo func(i int) {
\t\t\tdefer wg.Done()
\t\t\tmu.Lock()
\t\t\tfmt.Fprintf(buf, "Hello from goroutine %d!\\n", i)
\t\t\tmu.Unlock()
\t\t}(i)
\t}

\twg.Wait()
}

func main() {}
`,
    tests: `package main

import (
\t"bytes"
\t"fmt"
)

func kataTest_printer_contains_each_message() error {
\tvar buf bytes.Buffer
\tprintConcurrent(&buf)
\tout := buf.String()
\tfor i := 0; i < 3; i++ {
\t\twant := fmt.Sprintf("Hello from goroutine %d!", i)
\t\tif !bytes.Contains([]byte(out), []byte(want)) {
\t\t\treturn fmt.Errorf("output missing %q (got: %q)", want, out)
\t\t}
\t}
\treturn nil
}

func main() {
\tif err := kataTest_printer_contains_each_message(); err != nil {
\t\tfmt.Printf("KATA_TEST::printer_contains_each_message::FAIL::%s\\n", err.Error())
\t} else {
\t\tfmt.Println("KATA_TEST::printer_contains_each_message::PASS")
\t}
}
`,
  },
  concurrent2: {
    solution: `package main

import "sync"

func updateCounter() int {
\tvar counter int
\tvar mu sync.Mutex
\tvar wg sync.WaitGroup

\tfor i := 0; i < 100; i++ {
\t\twg.Add(1)
\t\tgo func() {
\t\t\tdefer wg.Done()
\t\t\tmu.Lock()
\t\t\tcounter++
\t\t\tmu.Unlock()
\t\t}()
\t}
\twg.Wait()
\treturn counter
}

func main() {}
`,
    tests: `package main

import "fmt"

func kataTest_counter_reaches_100() error {
\tgot := updateCounter()
\tif got != 100 {
\t\treturn fmt.Errorf("updateCounter() = %d; want 100", got)
\t}
\treturn nil
}

func main() {
\tif err := kataTest_counter_reaches_100(); err != nil {
\t\tfmt.Printf("KATA_TEST::counter_reaches_100::FAIL::%s\\n", err.Error())
\t} else {
\t\tfmt.Println("KATA_TEST::counter_reaches_100::PASS")
\t}
}
`,
  },
  concurrent3: {
    solution: `package main

import (
\t"bytes"
\t"fmt"
)

func sendAndReceive(buf *bytes.Buffer, messages chan string) {
\tgo func() {
\t\tmessages <- "Hello"
\t\tmessages <- " World"
\t\tclose(messages)
\t}()

\tfor msg := range messages {
\t\tfmt.Fprint(buf, msg)
\t}
}

func main() {}
`,
    tests: `package main

import (
\t"bytes"
\t"fmt"
)

func kataTest_send_and_receive_all_messages() error {
\tvar buf bytes.Buffer
\tmessages := make(chan string)
\tsendAndReceive(&buf, messages)
\tgot := buf.String()
\twant := "Hello World"
\tif got != want {
\t\treturn fmt.Errorf("buf = %q; want %q", got, want)
\t}
\treturn nil
}

func main() {
\tif err := kataTest_send_and_receive_all_messages(); err != nil {
\t\tfmt.Printf("KATA_TEST::send_and_receive_all_messages::FAIL::%s\\n", err.Error())
\t} else {
\t\tfmt.Println("KATA_TEST::send_and_receive_all_messages::PASS")
\t}
}
`,
  },
};

/// Synthesise the minimal test harness for a compile-only
/// exercise: one no-op `kataTest_compiles` + a `main` that prints
/// the PASS marker. Compilation is the assertion; the marker
/// gives Libre's Go runner a structured test result to surface in
/// the pass-pill column.
function compileTest(name) {
  void name; // parameter kept for future per-lesson customisation
  return `package main

import "fmt"

func kataTest_compiles() error {
\treturn nil
}

func main() {
\tif err := kataTest_compiles(); err != nil {
\t\tfmt.Printf("KATA_TEST::compiles::FAIL::%s\\n", err.Error())
\t} else {
\t\tfmt.Println("KATA_TEST::compiles::PASS")
\t}
}
`;
}

/// Build a string-comparison KATA_TEST harness for table-driven
/// lessons. `rows` is `[expression, expected, slug]`.
function makeTableTests(lessonName, rows) {
  void lessonName;
  const fnDecls = rows
    .map(([expr, want, slug]) => {
      // The expr is inlined into a Go string literal inside the
      // fmt.Errorf format string, so any `"` inside it (e.g.
      // `fooIfFizz("fizz")`) needs to be backslash-escaped or the
      // Go compiler will see a stray identifier. Escaping `\` first
      // avoids accidentally double-escaping later.
      const escapedExpr = expr.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
      return `func kataTest_${slug}() error {
\tgot := ${expr}
\twant := ${want}
\tif got != want {
\t\treturn fmt.Errorf("${escapedExpr} = %q; want %q", got, want)
\t}
\treturn nil
}
`;
    })
    .join("\n");
  const dispatch = rows
    .map(([, , slug]) => `\t\t{"${slug}", kataTest_${slug}},`)
    .join("\n");
  return `package main

import "fmt"

${fnDecls}

func main() {
\ttests := []struct {
\t\tname string
\t\tfn   func() error
\t}{
${dispatch}
\t}
\tfor _, t := range tests {
\t\tif err := t.fn(); err != nil {
\t\t\tfmt.Printf("KATA_TEST::%s::FAIL::%s\\n", t.name, err.Error())
\t\t} else {
\t\t\tfmt.Printf("KATA_TEST::%s::PASS\\n", t.name)
\t\t}
\t}
}
`;
}

/// Build the lesson body. Mirrors the Rustlings / Ziglings
/// importers — the chapter title is implicit (taken from the
/// course tree), so the body opens with the exercise name and
/// embeds the starter so the learner can see the task before
/// flipping to the editor.
function buildBody(exerciseName, starter, mode) {
  const lines = [];
  lines.push(`### ${exerciseName}`);
  lines.push("");
  if (mode === "test") {
    lines.push(
      "The starter below has a test-shaped body — implement the helper function(s) so every assertion passes.",
    );
  } else {
    lines.push(
      "The starter below has compile errors or TODOs. Fix the code so it compiles and the tests pass.",
    );
  }
  lines.push("");
  lines.push("```go");
  lines.push(starter.trim());
  lines.push("```");
  return lines.join("\n");
}

// ─── main ────────────────────────────────────────────────────

const infoToml = readFileSync(join(SOURCE, "info.toml"), "utf8");
const entries = parseInfoToml(infoToml);
console.log(`Parsed ${entries.length} entries from info.toml`);

const byChapter = new Map();
for (const ex of entries) {
  if (!ex.name || !ex.path) continue;
  const chapterRaw = ex.path.split("/")[1]; // exercises/<chapter>/<name>/main…
  if (!byChapter.has(chapterRaw)) byChapter.set(chapterRaw, []);
  byChapter.get(chapterRaw).push(ex);
}

const chapters = [];
let totalLessons = 0;
let missingLessons = [];
for (const [chapterRaw, exs] of byChapter) {
  const chapterId = slug(chapterRaw);
  const lessons = [];
  for (const ex of exs) {
    const starterPath = join(SOURCE, ex.path);
    if (!existsSync(starterPath)) {
      console.warn(`  skip ${ex.name}: no starter at ${ex.path}`);
      continue;
    }
    const starter = readFileSync(starterPath, "utf8");
    const data = LESSONS[ex.name];
    if (!data) {
      missingLessons.push(ex.name);
      continue;
    }
    const hint = (ex.hint ?? "").trim();
    const hints = hint
      ? hint.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)
      : [];
    lessons.push({
      id: slug(ex.name),
      title:
        ex.name.charAt(0).toUpperCase() +
        ex.name.slice(1).replace(/_/g, " ").replace(/(\d+)$/, " $1"),
      kind: "exercise",
      language: "go",
      difficulty: inferDifficulty(chapterRaw),
      topic: chapterId,
      body: buildBody(ex.name, starter, ex.mode ?? "compile"),
      starter,
      solution: data.solution,
      tests: data.tests,
      hints,
    });
    totalLessons++;
  }
  if (lessons.length === 0) continue;
  chapters.push({
    id: chapterId,
    title: chapterTitle(chapterRaw),
    lessons,
  });
}

if (missingLessons.length > 0) {
  console.warn(
    `Missing inline data for ${missingLessons.length} lessons: ${missingLessons.join(", ")}`,
  );
}

const course = {
  id: "golings",
  title: "Golings",
  language: "go",
  description:
    "The Golings curriculum (https://github.com/mauricioabreu/golings) — small interactive exercises that walk through Go's syntax, control flow, primitive types, slices, maps, structs, generics, and concurrency. Mirrored into Libre with hand-crafted reference solutions and KATA_TEST harnesses so each exercise reports a structured pass result.",
  attribution: {
    upstream: "https://github.com/mauricioabreu/golings",
    license: "MIT",
  },
  chapters,
};

mkdirSync(OUT_DIR, { recursive: true });
const outPath = join(OUT_DIR, "course.json");
writeFileSync(outPath, JSON.stringify(course, null, 2) + "\n");
console.log(
  `Wrote ${chapters.length} chapters × ${totalLessons} lessons to ${outPath}`,
);
