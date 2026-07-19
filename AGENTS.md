# VIP repository guidance

- Preserve the Phase 1 focus on the pilot question “What happens financially if I work this shift?”
- Never commit a real person's name, employer, rota, calendar link, email content or financial profile. Use fictional fixtures only.
- Treat `src/domain` as the source of truth for calculations. UI components must not contain pay logic.
- Every new calculation rule needs a human-readable assumption and an exact expected-value test.
- Use `Europe/London` for local shift boundaries. Never parse UK shifts using the host timezone.
- Label estimates as estimates; do not present unverified tax or childcare outputs as guarantees.
- Run `npm run check` before proposing a merge.
- Keep the app mobile-first and usable without an account.
