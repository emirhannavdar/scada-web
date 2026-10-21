<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Site content (products, plans, solutions, contact) lives in src/content/site.ts as the single source; pages read from it so facts stay consistent.
- Animations use `motion` (motion/react) and must respect prefers-reduced-motion.

- V57 CMS: src/content/site.ts contains code defaults. Live edits are in server-side data/cms.sqlite; never replace runtime data in a source update. Regenerate server/catalog.json with npm run build after changing defaults. Never package .env, database files, backups or uploaded private/runtime data.
