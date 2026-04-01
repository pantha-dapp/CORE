# Pantha

**Learn anything. Your way.**

Pantha is an AI-native learning platform where learners describe what they want to study, answer a few clarifying questions, and receive a structured course from beginner to advanced. Along the way they earn non-transferable experience points, compete for social streaks with friends, chat with end-to-end encryption, buy perks with a tradable token, and—on chain—can anchor verifiable course-completion credentials.

---

## What the project does

Many platforms offer fixed curricula or generic “AI courses.” Pantha focuses on **personalization**: the model infers your goal, resolves uncertainty with follow-up questions, and either matches you to an existing course in the vector index or **generates a new course** with a full chapter outline. Each chapter is turned into interactive pages (**quizzes, true/false, matching, fill-in-the-blanks, image-based tasks, teach-and-explain content**, and more). Your answers are scored, explanations can be generated for the last attempt, and progress advances through the course.

A **social layer** sits on top: follow others, become **friends** when mutual follows exist, see profiles and enrollments (with privacy controls), and maintain **personal learning streaks** and **friend streaks** that depend on both people being active on the same calendar day. Real-time updates (new DMs, streak milestones) reach the client over **Server-Sent Events**.

The economy separates **reputation** from **money**: **$PXP** is soulbound points minted when you learn; **$PANTHA** is an ERC-20 with **permit** support used for purchases and for **reward distribution** to learners proportional to their PXP-weighted share—similar in spirit to **MasterChef-style** staking rewards, but with **XP as the weight** instead of staked LP tokens.

---

## Features

### Courses & AI

- **Guided intake**: category, free-text intent, and iterative **clarification questions** with a configurable budget so the course matches skill and interests.
- **Semantic match or create**: embeddings and a **vector database** find similar existing courses; otherwise the system **authors a new course skeleton** (title, description, topics, ordered chapters).
- **Rich chapters**: async generation of chapter pages; **AI-generated illustrations** where appropriate; correct answers are not leaked to the client.
- **Adaptive feedback**: optional **LLM explanations** after answers, tuned for a mobile-friendly learning flow.
- **Progress**: enrollment, chapter ordering, and completion/revision tracked so first-time completion can mint more XP than practice runs.

### XP (Pantha XP — $PXP)

- **Non-transferable** ERC-20: minted through the orchestrator, **transfers and approvals disabled** so XP stays tied to the wallet that earned it.
- **Earned by learning** (e.g. completing or revising chapters); amounts scale with **how well you did** on scored activities.
- **Transparent reasons** on-chain (short-coded “reason” plus a resource id tied to the chapter), so indexing and analytics can attribute mints.

### Token rewards ($PANTHA)

- **Tradable** token with **EIP-2612 permit** for gas-conscious checkouts in the shop.
- **Reward vault logic**: the protocol tracks **total XP** and each user’s **XP balance** as shares. When the platform (or treasury workflow) **deposits** PANTHA into the distributor, everyone’s share of the next chunk of rewards is proportional to their **XP relative to the network**—the same mathematical idea as **MasterChef `accRewardPerShare`**, applied here to **minted XP** instead of farm deposits. Users can **claim** accrued rewards; **minting new XP** also updates their bookkeeping so rewards stay fair.

### Shop

- **In-game purchases** priced in **$PANTHA**: e.g. **Streak Freeze** (shield a missed day conceptually; policy prevents abuse like duplicate unconsumed purchases where enforced).
- **Gas-light UX**: purchases use **permit** so users sign once instead of separate `approve` transactions when supported.
- **Revenue routing**: payments go to the **treasury** contract; the product can fund weekly or event-driven **reward rounds** from that flow.
- _Roadmap-friendly:_ an **XP multiplier** or similar boost fits the same shop + `bytes8` item id pattern as streak freeze.

### Streaks

- **Personal streak**: extends when you’re active on consecutive **local days** (respecting your **timezone**); multiple activities the same day do not inflate the count; missing a day resets the pattern.
- **Friend streak**: only grows when **both** friends record activity on the **same day**; one-sided activity pauses the mutual streak until both show up again.

### Encryption & chat

- **Wallet-derived keys** and **ECDH** to agree on shared secrets; **symmetric encryption** for message bodies.
- **On-chain key directory**: users can register **salt + public key** material via a **signed EIP-712** message so others can encrypt for them without a centralized key server.
- **Direct messages** stored as **ciphertext**; recipients decrypt client-side. **Message policy** per user: who can DM (**anyone**, **friends only**, or **no one**).
- **Live notifications** when a new DM arrives.

### Social

- **Follow / unfollow**, **followers**, **following**, and **mutual friends**.
- **User search**, **profiles** (name, username, visibility), and gated views for **private** profiles.
- **Feed & leaderboard (product vision)** — The app includes **Social** experiences such as a community feed and friends leaderboard in the UI; full backend feed posts and a dedicated ranked leaderboard API are still evolving—**XP totals and on-chain pending rewards** already give a fairness signal for “who earned most” style competition.

### Certificates (verifiable credentials)

- **Certification authority** on chain commits a **Merkle root** of a learner’s **action chain** (hashed log of learning actions), enforces **one-time use** of each root, and authorizes minting of **ERC-721 certificates** with metadata URIs.
- This gives a path to **tamper-evident, verifiable completion** without exposing the entire private learning trail on chain—only the committed root and the NFT proof.

### Auth & developer ergonomics

- **Sign-In with Ethereum**-style flow: nonce challenge, signed message, **JWT** session for the API.
- **Test faucet** for **$PANTHA** (cooldown-gated) so demos and hackathon judges can try purchases and flows without mainnet funds.
- **Background jobs** for long AI or content-prep steps, with **job status** polling for a responsive UX.

---

## Tech stack & tools

**Application**

- **Bun** as the JavaScript runtime for the API and tests
- **Hono** HTTP framework, **Zod** validation
- **React 19**, **Vite**, **Tailwind CSS**
- **TanStack Router / Query** (and related client data patterns in the web app)
- **Privy** authentication SDK and **wagmi** / **viem** for wallets

**Data & infrastructure**

- **SQLite** with **Drizzle ORM** for relational app state
- **Redis** for caching, sessions, job state, and real-time **event streams** behind SSE
- **Qdrant** vector database for **course similarity** and retrieval
- **S3-compatible object storage** and **Synapse / Filecoin**-oriented SDK usage for durable media where configured

**AI**

- **TanStack AI** with pluggable LLM and embedding providers (OpenAI-compatible and others as configured)
- Embeddings for course matching; LLM tasks for clarification, course authoring, page content, and explanations
- **Sharp** (and related tooling in the workspace) for image processing where needed

**Blockchain**

- **Solidity** smart contracts (**Hardhat 3**, **OpenZeppelin** contracts)
- **viem** for reads, writes, and typed ABIs
- Target chain: **Flow EVM** testnet configuration in the deployed setup
- Contracts include: **orchestrator** (XP mint + reward math), **$PXP**, **$PANTHA** (permit), **shop**, **treasury**, **key store**, **certification authority**, **ERC-721 certificates**

**Quality**

- **Biome** for formatting and lint in the workspace
- **Bun test** integration tests covering auth, courses, XP minting, streaks, social graph, encrypted chat, shop, and faucet flows

---

## Who it’s for

Pantha suits **text-first** subjects—history, sciences, art history, blockchain, languages—where reading, recall, and reasoning matter more than physical demonstration. It pairs that with **crypto-native identity** (wallet login), **fair rewards** tied to learning effort, and **privacy-aware social** features.

---


