# 📘 CodeLens — Explained in Very Simple English

Welcome to **CodeLens**! This guide is written in plain, friendly English with **no confusing technical jargon**, so you can easily understand what this website does, how it works, and what every single file in the project is responsible for.

---

## 🌟 1. What is CodeLens? (The Big Picture)

Imagine you are studying programming, and you see code on a:
* Textbook page or photo
* Presentation slide
* YouTube video or screenshot
* College professor's whiteboard

Normally, you have to sit down and **type all that code manually line by line**. If you make one small typo, a missing bracket, or wrong indentation, the code refuses to run!

### That's why CodeLens was created:
1. **Drop a Picture**: You take a screenshot or photo and drop it into CodeLens.
2. **Instant Code Extraction**: In 2 to 3 seconds, CodeLens reads the photo, removes all background noise (like window borders or screen glare), and puts clean, beautiful code into an in-browser code editor (just like VS Code).
3. **1-Click Run (ATC Sandbox)**: You click the green **"Run"** button, and CodeLens compiles and runs the code instantly across **13 programming languages** (Python, C++, Java, JavaScript, Rust, Go, etc.) and shows the output in a terminal.
4. **1-Click Language Interchange**: If you have code in Python, but your teacher asks for C++ or Java, you click **"⇄ Interchange"**, and AI converts the entire program into the other language while keeping the exact same logic.
5. **100% Free & No Setup**: Students don't need to create an account, log in, or paste any API keys. It works right out of the box like an online compiler (Programiz or OneCompiler).

---

## ⚙️ 2. How Does It Work Behind the Scenes?

### A. The Picture-to-Code Part (AI Vision)
* When you drop an image, the browser shrinks it slightly (to ~120KB) so it uploads in a split second.
* The image goes to our backend server, which talks to **Google Gemini AI**.
* Gemini analyzes the pixels, identifies the language (e.g., Python or C++), extracts the exact text, and sends it back to the editor.
* **Smart Memory (Caching)**: If 20 students in the same classroom upload the exact same homework screenshot, CodeLens recognizes the image's digital fingerprint and returns the code **instantly in 0 seconds** without using any AI quota!

### B. The Code Execution Part (ATC: Any Time Code)
* Running code online is often tricky because sandboxes break easily. We built **ATC (Any Time Code)** to make it work reliably like an ATM:
  * **Every Character Works**: Code is sent using raw byte encoding (Base64). That means emojis (🚀), math symbols ($\pi, \le, \ge, \ne$), and foreign languages (Hindi, Japanese, Greek) run without getting corrupted.
  * **Smart Stdin Shield**: If your code asks for input (like `name = input()`) and you forgot to type input before clicking Run, the website automatically feeds it safe sample values so your program **never crashes with EOFError**.
  * **Java Auto-Healing**: If you paste Java code named `public class Solution`, CodeLens automatically fixes it to `public class Main` so the Java compiler never complains.
  * **Modern C++20**: C++ runs with modern GCC 14 flags (`-std=c++20`), allowing modern syntax to work smoothly.

### C. The 1-Click Language Interchange Part
* Translating code isn't just about changing words; it's about keeping the math and loops identical.
* CodeLens enforces **strict loop scoping**: if a print statement was inside a loop in Python, it guarantees it stays inside the `{ ... }` brackets in C++, Java, or Rust so the output matches 100%.

### D. The Free Unlimited Access (Invisible Key Pool)
* Google grants 1,500 free requests per day for every free key.
* The server holds a pool of free keys and automatically rotates between them (`Student 1 -> Key 1`, `Student 2 -> Key 2`).
* This distributes traffic evenly so students never get blocked by rate limits.

---

## 📁 3. What Each File Does (Folder by Folder)

Here is a breakdown of every important file in this project and what it does in plain English:

```text
search-code/
├── src/
│   ├── app/                    <- The pages and backend API routes
│   │   ├── page.tsx            <- The main website page
│   │   ├── layout.tsx          <- The master HTML layout shell
│   │   ├── globals.css         <- Global dark theme styles and fonts
│   │   └── api/                <- The backend servers
│   │       ├── extract/route.ts<- Reads pictures and turns them into code
│   │       ├── execute/route.ts<- Runs the code in a sandbox (ATC engine)
│   │       └── assist/route.ts <- Language Interchange and AI Auto-Fix
│   ├── components/             <- The visual UI blocks you see on screen
│   │   ├── Header.tsx          <- The top navigation bar
│   │   ├── Dropzone.tsx        <- The drag-and-drop picture box
│   │   ├── CodeEditor.tsx      <- The code editor (Monaco / VS Code)
│   │   ├── Terminal.tsx        <- The output console and input box
│   │   ├── SettingsModal.tsx   <- The settings popup window
│   │   ├── AiActionModal.tsx   <- The AI code explanation popup
│   │   └── Toast.tsx           <- The floating notifications
│   ├── lib/                    <- Helper tools and core logic
│   │   ├── gemini.ts           <- Connects to Google Gemini AI
│   │   ├── languages.ts        <- Rules for all 13 programming languages
│   │   ├── ocr.ts              <- Offline backup scanner (Tesseract.js)
│   │   ├── storage.ts          <- Saves recent snippets in browser storage
│   │   └── samples.ts          <- Built-in sample code snippets
│   └── types/
│       └── index.ts            <- Data blueprints and shapes
├── package.json                <- List of libraries used by the app
└── next.config.ts              <- Next.js framework settings
```

---

### Detailed File Guide:

#### 🖥️ The Web Pages & Backend (`src/app/`)

* **[`src/app/page.tsx`](file:///Users/vishal102/Desktop/search-code/src/app/page.tsx)**:
  * **What it is**: The **Main Brain & Controller** of the website.
  * **What it does**: Connects the Header, Dropzone, Code Editor, and Terminal together. When you drop an image, click Run, or click Interchange, `page.tsx` receives the event, triggers the backend, updates the screen, and launches celebratory confetti when code succeeds!

* **[`src/app/layout.tsx`](file:///Users/vishal102/Desktop/search-code/src/app/layout.tsx)**:
  * **What it is**: The **Master HTML Shell**.
  * **What it does**: Sets up the web page title ("CodeLens - Pic to Runnable Code in Seconds"), loads the dark theme fonts, and wraps the whole app so it fills the browser screen.

* **[`src/app/globals.css`](file:///Users/vishal102/Desktop/search-code/src/app/globals.css)**:
  * **What it is**: The **Style Sheet**.
  * **What it does**: Defines dark-mode colors (deep navy, obsidian black, purple glows), scrollbars, and animations.

* **[`src/app/api/extract/route.ts`](file:///Users/vishal102/Desktop/search-code/src/app/api/extract/route.ts)**:
  * **What it is**: The **Vision Backend Server**.
  * **What it does**: Receives the image from your browser. It checks if this image was scanned before (instant cache). If not, it asks Gemini AI to extract the code and clean out line numbers, and sends back clean code and the detected language.

* **[`src/app/api/execute/route.ts`](file:///Users/vishal102/Desktop/search-code/src/app/api/execute/route.ts)**:
  * **What it is**: The **ATC Code Execution Sandbox**.
  * **What it does**: Compiles and runs code in the sandbox. It protects against missing inputs (Smart Stdin Shield), auto-heals Java class names (`Main`), turns on modern C++20 flags, and uses Base64 so special symbols ($\pi$, emojis, accents) never break.

* **[`src/app/api/assist/route.ts`](file:///Users/vishal102/Desktop/search-code/src/app/api/assist/route.ts)**:
  * **What it is**: The **AI Assistant & Translator**.
  * **What it does**: Handles 1-click **Language Interchange** (translating Python into C++, Rust, Java, etc.) and **ATC Auto-Heal** (diagnosing error messages and writing the fix).

---

#### 🎨 Visual UI Components (`src/components/`)

* **[`src/components/Header.tsx`](file:///Users/vishal102/Desktop/search-code/src/components/Header.tsx)**:
  * **What it does**: The top bar of the website. Houses the CodeLens logo, the **"100% Free"** badge, the language dropdown menu (13 languages), the **"⇄ Interchange"** button, the green **"Run"** button, and the Settings button.

* **[`src/components/Dropzone.tsx`](file:///Users/vishal102/Desktop/search-code/src/components/Dropzone.tsx)**:
  * **What it does**: The upload area where students drag & drop images or paste from clipboard (`Cmd+V` / `Ctrl+V`). It also contains preset buttons (like "Fibonacci", "Quicksort") so students can test the site without an image.

* **[`src/components/CodeEditor.tsx`](file:///Users/vishal102/Desktop/search-code/src/components/CodeEditor.tsx)**:
  * **What it does**: The code editor window. It uses **Monaco Editor** (the exact same engine that powers Microsoft VS Code), giving students syntax highlighting, line numbers, and auto-indentation. Also includes the "Convert to" quick dropdown.

* **[`src/components/Terminal.tsx`](file:///Users/vishal102/Desktop/search-code/src/components/Terminal.tsx)**:
  * **What it does**: The bottom/side console window. It shows the output of your code (`stdout`), compiler errors (`stderr`), the **"✨ ATC Auto-Heal"** button when code has a bug, the **"Interactive Input"** tab, and quick preset buttons (`10`, `Array`, `Text`).

* **[`src/components/SettingsModal.tsx`](file:///Users/vishal102/Desktop/search-code/src/components/SettingsModal.tsx)**:
  * **What it does**: The popup dialog for settings. Explains that CodeLens is completely free out of the box, and allows power users to optionally enter their own private Gemini key if they want personal quota.

* **[`src/components/AiActionModal.tsx`](file:///Users/vishal102/Desktop/search-code/src/components/AiActionModal.tsx)**:
  * **What it does**: A popup that shows AI explanations, step-by-step breakdown of how the code works, and time/space complexity ($O(N)$).

* **[`src/components/Toast.tsx`](file:///Users/vishal102/Desktop/search-code/src/components/Toast.tsx)**:
  * **What it does**: The small floating notifications in the bottom-right corner that say things like *"Code Extracted Successfully!"*, *"Converted to C++!"*, or *"Execution Complete"*.

---

#### 🛠️ Helper Libraries (`src/lib/` & `src/types/`)

* **[`src/lib/gemini.ts`](file:///Users/vishal102/Desktop/search-code/src/lib/gemini.ts)**:
  * **What it does**: The connector to Google's official Gemini AI library (`@google/genai`). Manages the round-robin key rotation, filters out broken preview models, and manages the in-memory cache so duplicate photos load in 0ms.

* **[`src/lib/languages.ts`](file:///Users/vishal102/Desktop/search-code/src/lib/languages.ts)**:
  * **What it does**: The dictionary containing all 13 supported languages (Python, JavaScript, TypeScript, C++, C, Java, Go, Rust, Ruby, PHP, Swift, Kotlin, Bash), their starter sample code, file extensions, and Judge0 IDs.

* **[`src/lib/ocr.ts`](file:///Users/vishal102/Desktop/search-code/src/lib/ocr.ts)**:
  * **What it does**: An offline, in-browser optical character recognition fallback using Tesseract.js in case a student has no internet connection or wants to scan without AI.

* **[`src/lib/storage.ts`](file:///Users/vishal102/Desktop/search-code/src/lib/storage.ts)**:
  * **What it does**: Handles reading and writing to the user's browser `localStorage` (so recent snippets stay saved even if the student refreshes the browser tab).

* **[`src/lib/samples.ts`](file:///Users/vishal102/Desktop/search-code/src/lib/samples.ts)**:
  * **What it does**: Stores default code examples (like Binary Search, Fibonacci, Bubble Sort) that students can click to test.

* **[`src/types/index.ts`](file:///Users/vishal102/Desktop/search-code/src/types/index.ts)**:
  * **What it does**: The data contract dictionary. Defines what an `ExecutionResult`, `LanguageConfig`, and `SampleSnippet` look like so TypeScript prevents bugs.

---

## 🎯 Summary

CodeLens combines **Computer Vision AI**, **13-Language Sandboxed Execution**, and **Compiler Auto-Healing** into a fast, beautiful, 100% free web app designed to help students learn and experiment with code with zero friction!
