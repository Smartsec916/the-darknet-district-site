# Public handles

One public handle per account, shared by the website and every game (VOID//RUNNER, Blackout Protocol).

- **Source of truth:** the Firestore registry that already existed (`bp_handles/{lowercased handle}` -> `bp_profiles/{sha256(uid)}`),
  written only by `claim_public_handle()` in `blackout_api.py` inside a transaction. The document id is the lowercased handle,
  so uniqueness is atomic and case-insensitive. The Firebase UID stays the account identifier; a handle is never a key.
- **API:** `GET /api/identity/me`, `GET /api/identity/handles/<h>/available`, `POST /api/identity/handle {handle}`
  (`identity_api.py`). The account always comes from the verified ID token. Only the handle is ever returned.
- **Rules:** 3-20 letters, numbers, underscores. Reserved/impersonation names (admin, system, moderator, iris, owner, ...) are refused
  after folding look-alikes (`1ris`, `Ir1s`, `a_d_m_i_n`, `iris_official`). Handles chosen before the stricter list are kept.
  One change per 30 days.
- **Display:** the Firebase display name is never shown (for Google accounts it is the real name). The homepage button, account
  menu, Account Settings, VOID//RUNNER account page and menu, and the Blackout page use the registry handle.
- **Iris:** untouched. Owner recognition, memory keys and `IRIS_ADMIN_UIDS` do not involve handles.
- **Deploy:** no migration and no new rules. Needs `DISTRICT_HANDLES_ENABLED=true` (or either game's accounts flag) on the Python
  Render service, which is already the case when game accounts are on.
