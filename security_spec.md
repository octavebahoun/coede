# Security Specification for CodeArena (Firestore Security Rules)

## 1. Data Invariants
- **Identity Integrity**: A user can only write or read their own private profile inside `/users/{userId}`. They are locked out of modifying fields that are owned by other players.
- **Role & Preference Verification**: Users can only modify certain allowed fields like `username`, `preferences`, and `proPassUnlocked`.
- **Challenge History Immutability**: A challenge evaluation history record under `/challenges/{challengeId}` is immutable once created. Regular users can create/read their records but cannot edit or delete existing submissions.
- **Duel Room Transitions**: Active duel lobbies under `/duels/{duelId}` can only evolve through strict validated states (`waiting` -> `ready` -> `coding` -> `finished`). Once in terminal `finished` status, no fields can be updated except by an administrator.
- **Timestamp Accuracy**: Immutability of server creation timestamps is strictly enforced across all collections.

---

## 2. The "Dirty Dozen" Threat Payloads (Targeting Firestore Constraints)

### Users Collection Threats

#### Payload 1: The Identity Spoof (Attacker attempts to hijack another player's profile path)
- **Path**: `users/victim@codearena.com`
- **Method**: `set`
- **Payload**:
  ```json
  {
    "id": "user-victim",
    "username": "VictimHacked",
    "email": "victim@codearena.com",
    "level": 99,
    "totalScore": 99999
  }
  ```
- **Constraint to enforce**: Denied because the authenticated user email does not match `victim@codearena.com`.

#### Payload 2: Ghost Field Injection (Attempting to inject unlisted values into high-privileged user fields)
- **Path**: `users/attacker@codearena.com`
- **Method**: `update`
- **Payload**:
  ```json
  {
    "adminEnabled": true,
    "ghostPrivileges": "superadmin"
  }
  ```
- **Constraint to enforce**: Denied because `adminEnabled` and `ghostPrivileges` are not in the permitted list of affectedKeys.

#### Payload 3: Value Poisoning (Injecting huge inputs to cause denial of wallet)
- **Path**: `users/attacker@codearena.com`
- **Method**: `set`
- **Payload**:
  ```json
  {
    "id": "user-attacker",
    "username": "A".repeat(10000),
    "email": "attacker@codearena.com",
    "level": 1,
    "totalScore": 0
  }
  ```
- **Constraint to enforce**: Denied because string size controls restrict `username` to <= 128 characters.

---

### Challenges History Threats

#### Payload 4: Arbitrary Grade Overwriting (User attempts to cheat by directly updating their score in Firestore)
- **Path**: `challenges/sub-124b`
- **Method**: `update`
- **Payload**:
  ```json
  {
    "score": 100
  }
  ```
- **Constraint to enforce**: Denied because the `/challenges` collection is immutable (`update` and `delete` are forbidden for regular users).

#### Payload 5: Spoofed Author Submission (Submitting an evaluation record under another user's email)
- **Path**: `challenges/sub-abc`
- **Method**: `create`
- **Payload**:
  ```json
  {
    "id": "sub-abc",
    "userEmail": "victim@codearena.com",
    "challengeId": "react-hooks",
    "score": 95,
    "submittedAt": "2026-06-01T12:00:00Z"
  }
  ```
- **Constraint to enforce**: Denied because the `userEmail` must be equivalent to the verified email of the authenticated requester.

#### Payload 6: Shadow Property Validation Bypass
- **Path**: `challenges/sub-def`
- **Method**: `create`
- **Payload**:
  ```json
  {
    "id": "sub-def",
    "userEmail": "attacker@codearena.com",
    "challengeId": "react-hooks",
    "score": 95,
    "submittedAt": "2026-06-01T12:00:00Z",
    "corruptSecretField": "maliciousCode"
  }
  ```
- **Constraint to enforce**: Denied via schema size validation checking for strict property keys.

---

### Duels Collection Threats

#### Payload 7: Self-Assigned Winner Status (Instantly declaring oneself the winner of a lobby)
- **Path**: `duels/duel-room12`
- **Method**: `update`
- **Payload**:
  ```json
  {
    "winnerEmail": "attacker@codearena.com",
    "status": "finished"
  }
  ```
- **Constraint to enforce**: Denied because setting `winnerEmail` is a terminal state transition restricted to strict rules or administrative helpers.

#### Payload 8: Duplicate Duel Lobby Creation with Invalid IDs
- **Path**: `duels/duel_room_with_vulnerabilities_#_junk_character`
- **Method**: `create`
- **Payload**:
  ```json
  {
    "id": "duel_room_with_vulnerabilities_#_junk_character",
    "roomId": "ROOM-JUNK",
    "status": "waiting",
    "startedAt": "2026-06-01T12:00:00Z"
  }
  ```
- **Constraint to enforce**: Denied because the ID size and character validation `isValidId()` blocks arbitrary or hazardous characters like `#`.

#### Payload 9: Bypass Matchmaker Ready Status
- **Path**: `duels/duel-123`
- **Method**: `update`
- **Payload**:
  ```json
  {
    "status": "coding"
  }
  ```
- **Constraint to enforce**: Changing state to `coding` directly requires the transition parameters to be validated against active matchmaking constraints.

---

### Global Safety / Structural Threats

#### Payload 10: Anonymous Writing Block
- **Path**: `users/anon-user`
- **Method**: `set`
- **Payload**:
  ```json
  {
    "id": "anon-user",
    "username": "AnonymousHacker",
    "email": "anon@codearena.com"
  }
  ```
- **Constraint to enforce**: Denied because anonymous triggers or non-verified emails cannot configure user profiles.

#### Payload 11: Wildcard Database Scavenging (Attempting to fetch overall list elements without credentials)
- **Path**: `users`
- **Method**: `list`
- **Constraint to enforce**: Blanket reads are denied to protect PII.

#### Payload 12: Orphaned Submission (Registering a challenge submission for a non-existent player profile ID)
- **Path**: `challenges/sub-orphaned`
- **Method**: `create`
- **Payload**:
  ```json
  {
    "id": "sub-orphaned",
    "userEmail": "nonexistent@codearena.com",
    "challengeId": "react",
    "score": 90,
    "submittedAt": "2026-06-01T12:00:00Z"
  }
  ```
- **Constraint to enforce**: Denied if user profile record doesn't exist in BDD.

---

## 3. Test Runner Design Layout (`firestore.rules.test.ts`)

The rules are built with robust checks to pass all tests successfully.
Below is the spec runner mock definitions matching our security suites.

```typescript
// firestore.rules.test.ts (Draft representation for emulation validation)
import { assertFails, assertSucceeds, initializeTestEnvironment } from "@firebase/rules-unit-testing";

describe("CodeArena Security Rules", () => {
  let testEnv: any;

  before(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "northern-resource-pb34d",
      firestore: {
        rules: require("fs").readFileSync("firestore.rules", "utf8"),
      }
    });
  });

  after(async () => {
    await testEnv.cleanup();
  });

  it("should block Payload 1: The Identity Spoof", async () => {
    const attackerDb = testEnv.authenticatedContext("attacker", { email: "attacker@codearena.com" }).firestore();
    const victimRef = attackerDb.doc("users/victim@codearena.com");
    await assertFails(victimRef.set({ id: "user-victim", username: "Hijacker", email: "victim@codearena.com" }));
  });

  it("should fail validation on Payload 2: Ghost Field Injection", async () => {
    const attackerDb = testEnv.authenticatedContext("attacker", { email: "attacker@codearena.com" }).firestore();
    const myRef = attackerDb.doc("users/attacker@codearena.com");
    await assertFails(myRef.update({ adminEnabled: true }));
  });
});
```
