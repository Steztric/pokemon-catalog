# Pokemon Card Catalog

A cross-platform desktop application for cataloguing a personal Pokemon card collection. Physical cards are identified via webcam using a hybrid vision pipeline (local perceptual hash matching with an LLM fallback), and the resulting collection is browsable as a visual grid or list with filtering and sorting.

The same codebase targets both desktop (via Tauri 2) and browser (plain Vite build).

## Project documentation

| Document | Purpose |
|---|---|
| [docs/requirements.md](docs/requirements.md) | Product requirements and feature scope |
| [docs/architecture.md](docs/architecture.md) | Technology decisions, layered architecture, data model |
| [docs/implementation-plan.md](docs/implementation-plan.md) | Phased development plan (11 phases) |
| [agent-context/implementation-status.md](agent-context/implementation-status.md) | Current build status — which phases are complete |

---

## Platform requirements

### Operating system

| Target | Requirement |
|---|---|
| Desktop (Tauri) | Windows 10+, macOS 11+, or Ubuntu 22.04+ |
| Browser | Any modern browser (Chrome 90+, Firefox 90+, Safari 14+) |

> **Linux note:** Tauri 2 requires `libwebkit2gtk-4.1-dev`, which is only packaged for Ubuntu 22.04 (Jammy) and later. Ubuntu 20.04 is not supported without manual compilation.

### Runtime dependencies

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 20.19+ or 22.12+ | Frontend build (Vite 7 requirement) |
| npm | 10+ | Package management (bundled with Node) |
| Rust | stable (1.70+) | Tauri desktop backend |

### Linux system libraries (desktop only)

These packages are required to compile and run the Tauri desktop target on Linux:

```
libwebkit2gtk-4.1-dev
libgtk-3-dev
libayatana-appindicator3-dev
librsvg2-dev
libssl-dev
build-essential
patchelf
```

---

## Development environment setup

### 1. Install Node.js via nvm

[nvm](https://github.com/nvm-sh/nvm) (Node Version Manager) is the recommended way to install Node.js on macOS and Linux. It lets you install multiple versions side by side and switch between them per project.

**Install nvm:**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
```

Restart your terminal (or run `source ~/.bashrc`), then verify:

```bash
nvm --version
```

**Install and activate Node.js 22:**

```bash
nvm install 22
nvm use 22
node --version   # should print v22.x.x
npm --version
```

To make Node 22 the default for all new shells:

```bash
nvm alias default 22
```

### 2. Install Rust via rustup

[rustup](https://rustup.rs) is the official Rust installer and toolchain manager.

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```

Accept the defaults when prompted. After installation, load the Rust environment into the current shell:

```bash
source "$HOME/.cargo/env"
```

Verify:

```bash
rustc --version   # should print rustc 1.70.0 or later
cargo --version
```

Rust updates are managed with:

```bash
rustup update
```

### 3. Install Linux system libraries (Linux / WSL2 only)

On Ubuntu 22.04 or later:

```bash
sudo apt-get update
sudo apt-get install -y \
  libwebkit2gtk-4.1-dev \
  libgtk-3-dev \
  libayatana-appindicator3-dev \
  librsvg2-dev \
  libssl-dev \
  build-essential \
  patchelf
```

**WSL2 users:** Ensure you are running Ubuntu 22.04 or later. Check with `lsb_release -a`. If you are on 20.04, upgrade first:

```bash
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install ubuntu-wsl
sudo do-release-upgrade
```

### 4. Install project dependencies

Clone the repository (if you have not already), then install Node dependencies:

```bash
npm install
```

Rust dependencies are downloaded automatically the first time you run a Cargo command.

---

## Running the application

### Desktop (Tauri)

```bash
npm run tauri dev
```

This starts the Vite dev server and opens the Tauri desktop window. Hot-reload is active for frontend changes; Rust changes require a restart.

### Browser only

```bash
npm run dev
```

Opens a plain Vite dev server at `http://localhost:1420`. No Tauri or Rust required.

---

## Building for production

### Frontend bundle (browser)

```bash
npm run build
```

Output is written to `dist/`. The bundle can be served from any static file host.

### Desktop installer (Tauri)

```bash
npm run tauri build
```

Produces a platform-specific installer in `src-tauri/target/release/bundle/`.

---

## Development scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start Vite dev server (browser target) |
| `npm run tauri dev` | Start Tauri desktop app with hot reload |
| `npm run build` | Production Vite build |
| `npm run tauri build` | Production Tauri desktop build |
| `npm run typecheck` | TypeScript type check (`tsc --noEmit`) |
| `npm test` | Run unit tests with Vitest |
| `npm run test:watch` | Run tests in watch mode |

---

## Technology stack

| Concern | Technology |
|---|---|
| Desktop wrapper | Tauri 2 (Rust) |
| Frontend framework | React 19 + TypeScript |
| Build tool | Vite 7 |
| Styling | Tailwind CSS 3 |
| Async data / caching | TanStack Query 5 |
| UI state | Zustand 5 |
| Routing | React Router 7 |
| Unit testing | Vitest + React Testing Library |
| Local database (desktop) | SQLite via Tauri SQL plugin *(Phase 4)* |
| Local database (browser) | IndexedDB *(Phase 4)* |
| Card data and images | Pokemon TCG Developers API *(Phase 3)* |
| Card identification (primary) | Perceptual hash matching *(Phase 7)* |
| Card identification (fallback) | Claude Sonnet vision via Anthropic API *(Phase 8)* |
| Camera access | WebRTC `getUserMedia` |
