import { SampleSnippet } from "@/types";

export const SAMPLE_SNIPPETS: SampleSnippet[] = [
  {
    id: "python-palindrome",
    title: "Palindrome Checker (Python)",
    language: "python",
    description: "Clean function to check palindromes and clean whitespace",
    code: `def is_palindrome(s: str) -> bool:
    cleaned = "".join(c.lower() for c in s if c.isalnum())
    return cleaned == cleaned[::-1]

test_phrases = [
    "A man, a plan, a canal: Panama",
    "race a car",
    "Was it a car or a cat I saw?",
    "CodeLens is awesome"
]

for phrase in test_phrases:
    result = is_palindrome(phrase)
    status = "✅ Palindrome" if result else "❌ Not a palindrome"
    print(f"'{phrase}' -> {status}")
`,
    previewGradient: "from-blue-600 to-indigo-800",
  },
  {
    id: "cpp-vector-math",
    title: "Prime Sieve (C++)",
    language: "cpp",
    description: "Sieve of Eratosthenes algorithm in modern C++",
    code: `#include <iostream>
#include <vector>

void sieve(int n) {
    std::vector<bool> is_prime(n + 1, true);
    is_prime[0] = is_prime[1] = false;
    
    for (int p = 2; p * p <= n; p++) {
        if (is_prime[p]) {
            for (int i = p * p; i <= n; i += p)
                is_prime[i] = false;
        }
    }
    
    std::cout << "Primes up to " << n << ":\\n";
    for (int p = 2; p <= n; p++) {
        if (is_prime[p]) std::cout << p << " ";
    }
    std::cout << "\\n";
}

int main() {
    sieve(50);
    return 0;
}
`,
    previewGradient: "from-cyan-600 to-blue-900",
  },
  {
    id: "js-matrix-transform",
    title: "Array Statistics (JavaScript)",
    language: "javascript",
    description: "Functional array processing computing mean, median, mode",
    code: `const numbers = [42, 17, 88, 12, 99, 23, 56, 17, 42, 17];

const sum = numbers.reduce((a, b) => a + b, 0);
const mean = sum / numbers.length;

const sorted = [...numbers].sort((a, b) => a - b);
const mid = Math.floor(sorted.length / 2);
const median = sorted.length % 2 !== 0 
  ? sorted[mid] 
  : (sorted[mid - 1] + sorted[mid]) / 2;

console.log("Dataset:", numbers);
console.log("Count:", numbers.length);
console.log("Sum:", sum);
console.log("Mean:", mean.toFixed(2));
console.log("Median:", median);
`,
    previewGradient: "from-amber-600 to-yellow-800",
  },
];
