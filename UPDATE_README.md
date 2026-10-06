# Void Runner Tutorial, Menu, and Save Update

Prepared against `Smartsec916/the-darknet-district-site` main commit
`a47e0e95355fa6e1444a942ab7a809b49be08a66`.

This is an update-only package. Files retain their repository-relative paths.
It includes the edited game modules, backend validators, tests, and the audit.
It does not include the rest of the website or unchanged game assets.

Deploy the updated Python validators with the browser changes. Cloud saves now
contain the added tutorial flags and mission records. Both the service worker
and cache module carry build ID `2026-10-06-tutorial-save-1`.

Validation commands, from the repository root:

```sh
node --test tests/*.test.cjs
python -m unittest discover -s tests -p 'test_*.py'
node tests/serve-modern.cjs
node tests/tutorial-menu-save-browser.cjs
node tests/campaign-account-save-browser.cjs
```

Browser suites require Playwright and Microsoft Edge. The static test server
uses `http://127.0.0.1:5187/void-runner.html`; identity and account APIs are mocked
in the tests. Browser screenshots go under `work/`.

See `VOID_RUNNER_SAVE_SYSTEM_AUDIT.md` for save architecture, findings, changes,
test coverage, and remaining deployment verification.
