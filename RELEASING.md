# Releasing

This project follows Semantic Versioning and uses Git tags for public releases.

## Versioning Policy

While the project is still stabilizing, releases will stay in the `0.x.y` range.

- `PATCH` (`0.1.1`) for bug fixes, docs fixes, and small non-breaking improvements
- `MINOR` (`0.2.0`) for new features and meaningful improvements that remain backward compatible
- `MAJOR` (`1.0.0`) for intentionally breaking changes or the first stable public release

## Tag Format

Use annotated tags in this format:

```bash
v0.1.0
```

Examples:

- `v0.1.0`
- `v0.1.1`
- `v0.2.0`

## Release Checklist

1. Make sure `package.json` has the correct version.
2. Update `CHANGELOG.md`.
3. Run the project checks you want before release, at minimum:

```bash
npm run lint
```

4. Commit the release changes.
5. Create an annotated tag:

```bash
git tag -a v0.1.0 -m "v0.1.0"
```

6. Push the branch and tag:

```bash
git push origin main
git push origin v0.1.0
```

7. Create a GitHub Release for the same tag and summarize:
   - main additions
   - important fixes
   - setup notes or limitations

## First Public Release

The first public open-source release target is:

```bash
v0.1.0
```

## Changelog Workflow

- Add ongoing work under `Unreleased`
- Move those entries into a versioned section when cutting a release
- Keep release entries short and user-facing
