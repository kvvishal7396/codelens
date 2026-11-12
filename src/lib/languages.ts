import { LanguageConfig } from "@/types";

export const SUPPORTED_LANGUAGES: LanguageConfig[] = [
  {
    id: "python",
    name: "Python 3",
    monacoLang: "python",
    judge0Id: 100, // Python (3.12.5)
    extension: "py",
    sampleCode: `# Welcome to CodeLens!
# Paste an image (Cmd+V / Ctrl+V) or click Run to test.

def fibonacci(n: int) -> list[int]:
    seq = [0, 1]
    for _ in range(2, n):
        seq.append(seq[-1] + seq[-2])
    return seq[:n]

print("🚀 Running Python 3 in CodeLens!")
fibs = fibonacci(10)
print(f"First 10 Fibonacci numbers: {fibs}")
`,
  },
  {
    id: "javascript",
    name: "JavaScript",
    monacoLang: "javascript",
    judge0Id: 97, // Node.js (20.17.0)
    extension: "js",
    sampleCode: `// Welcome to CodeLens!
// Fast Node.js runtime execution

function greet(name) {
  const time = new Date().toLocaleTimeString();
  return \`Hello \${name}! Generated at \${time}\`;
}

console.log("⚡ Executing JavaScript...");
console.log(greet("CodeLens Developer"));

const numbers = [1, 2, 3, 4, 5];
const squared = numbers.map(x => x * x);
console.log("Squared numbers:", squared);
`,
  },
  {
    id: "typescript",
    name: "TypeScript",
    monacoLang: "typescript",
    judge0Id: 101, // TypeScript (5.6.2)
    extension: "ts",
    sampleCode: `// TypeScript execution with full type safety
interface User {
  id: number;
  name: string;
  role: "admin" | "developer";
}

const user: User = {
  id: 101,
  name: "Alex",
  role: "developer"
};

console.log("🔷 TypeScript running successfully!");
console.log(\`User: \${user.name} (Role: \${user.role})\`);
`,
  },
  {
    id: "cpp",
    name: "C++ (GCC 14)",
    monacoLang: "cpp",
    judge0Id: 105, // C++ (GCC 14.1.0)
    extension: "cpp",
    sampleCode: `#include <iostream>
#include <vector>
#include <numeric>

int main() {
    std::cout << "🔥 C++ 14.1 executing in CodeLens!\\n";
    std::vector<int> nums = {10, 20, 30, 40, 50};
    
    int sum = std::accumulate(nums.begin(), nums.end(), 0);
    std::cout << "Sum of elements = " << sum << "\\n";
    
    return 0;
}
`,
  },
  {
    id: "c",
    name: "C (GCC 14)",
    monacoLang: "c",
    judge0Id: 103, // C (GCC 14.1.0)
    extension: "c",
    sampleCode: `#include <stdio.h>

int main() {
    printf("⚡ Running C in CodeLens!\\n");
    for (int i = 1; i <= 5; i++) {
        printf("Iteration %d\\n", i);
    }
    return 0;
}
`,
  },
  {
    id: "java",
    name: "Java (JDK 17)",
    monacoLang: "java",
    judge0Id: 91, // Java (JDK 17.0.6)
    extension: "java",
    sampleCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("☕ Java running in CodeLens!");
        int a = 25;
        int b = 17;
        System.out.println("Result: " + (a * b));
    }
}
`,
  },
  {
    id: "go",
    name: "Go (Golang)",
    monacoLang: "go",
    judge0Id: 107, // Go (1.23.5)
    extension: "go",
    sampleCode: `package main

import (
	"fmt"
	"time"
)

func main() {
	fmt.Println("🐹 Gopher running in CodeLens!")
	fmt.Printf("Current UTC time: %s\\n", time.Now().UTC().Format(time.RFC1123))
}
`,
  },
  {
    id: "rust",
    name: "Rust (1.85)",
    monacoLang: "rust",
    judge0Id: 108, // Rust (1.85.0)
    extension: "rs",
    sampleCode: `fn main() {
    println!("🦀 Rust code compiling and executing!");
    let v: Vec<i32> = (1..=5).map(|x| x * 2).collect();
    println!("Vector doubled: {:?}", v);
}
`,
  },
  {
    id: "ruby",
    name: "Ruby",
    monacoLang: "ruby",
    judge0Id: 72, // Ruby (2.7.0)
    extension: "rb",
    sampleCode: `puts "💎 Ruby in CodeLens!"
words = ["snap", "extract", "compile", "run"]
puts "Reversed: " + words.map(&:reverse).join(", ")
`,
  },
  {
    id: "php",
    name: "PHP",
    monacoLang: "php",
    judge0Id: 98, // PHP (8.3.11)
    extension: "php",
    sampleCode: `<?php
echo "🐘 PHP 8.3 running!\\n";
$items = ["Code", "Lens", "Online", "Compiler"];
echo implode(" -> ", $items) . "\\n";
`,
  },
  {
    id: "swift",
    name: "Swift",
    monacoLang: "swift",
    judge0Id: 83, // Swift (5.2.3)
    extension: "swift",
    sampleCode: `print("🦅 Swift running in CodeLens!")
let numbers = [5, 2, 8, 1, 9]
print("Sorted numbers: \\(numbers.sorted())")
`,
  },
  {
    id: "kotlin",
    name: "Kotlin",
    monacoLang: "kotlin",
    judge0Id: 111, // Kotlin (2.1.10)
    extension: "kt",
    sampleCode: `fun main() {
    println("🎯 Kotlin running in CodeLens!")
    val list = listOf("Android", "Web", "Backend")
    list.forEach { println("Target: $it") }
}
`,
  },
  {
    id: "bash",
    name: "Bash (Shell)",
    monacoLang: "shell",
    judge0Id: 46, // Bash (5.0.0)
    extension: "sh",
    sampleCode: `echo "🐚 Bash executing in CodeLens!"
mkdir -p workspace
echo "Clean copy" > workspace/final_draft.txt
cat workspace/final_draft.txt
ls -la workspace
`,
  },
];

export const DEFAULT_LANGUAGE = SUPPORTED_LANGUAGES[0]; // Python

export function findLanguageById(id: string): LanguageConfig {
  const normalized = id.toLowerCase().trim();
  const match = SUPPORTED_LANGUAGES.find(
    (l) =>
      l.id === normalized ||
      l.monacoLang === normalized ||
      l.name.toLowerCase().includes(normalized)
  );
  return match || DEFAULT_LANGUAGE;
}
