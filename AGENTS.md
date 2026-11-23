# SocietyCook — Ponytail Protocol (Lazy Senior Developer Mode) 🐴

> *"The best code is the code you never wrote."*

This repository adheres to the **Ponytail Engineering Standards** powered by the installed [Ponytail Extension (`an420kit.ponytail-ai`)](https://github.com/an420kit/ponytail) and the [Ponytail AI Philosophy](https://github.com/DietrichGebert/ponytail).

All developers and AI assistants working on SocietyCook must strictly adhere to the **4 Ponytail Rules**:

---

## 📜 The 4 Ponytail Rules

### 1. 🎯 Rule 1: YAGNI (You Ain't Gonna Need It)
- Build **only what is required** to solve the current problem or feature.
- Never add speculative configuration options, unused utility wrappers, or prematurely generalized architectures.
- Challenge scope creep before writing any code.

### 2. ⚡ Rule 2: Zero Dependencies & Native First
- Prioritize **native web platform features** (HTML5 `<dialog>`, `IntersectionObserver`, `fetch`, standard CSS Grid/Flexbox) and Node.js built-ins.
- Never install a new third-party dependency when a clean, native 5–10 line implementation will suffice.
- Check the codebase first: reuse existing helpers (`api.js`, `AuthContext.jsx`, Tailwind utility classes) before introducing new patterns.

### 3. ✂️ Rule 3: Delete Code & Prune Dead Weight
- The best code change is one that **deletes more code than it adds**.
- Continuously eliminate dead code, unused imports, redundant wrapper components, duplicate routes, and temporary scratch files.
- Keep the bundle and codebase lean, fast, and audit-friendly.

### 4. 🧘 Rule 4: Simplicity > Cleverness
- Write straightforward, readable code that any developer can understand in 5 seconds.
- Avoid hyper-abstract design patterns, complex metaprogramming, and fragile one-liners.
- Never compromise on core safety: enterprise security, transaction safety, CSRF/RBAC controls, and thorough automated test verification remain strictly required.
