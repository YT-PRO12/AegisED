# Publish the first v1.0.0 release

The review prepared source changes and these notes; it did not push a commit, create a tag, publish a release or redeploy production. GitHub returned no releases and no `v1.0.0` tag at the inspected baseline. The package contains `CareFlow-v1.0.0.patch` beside the `CareFlow-AI` folder. The patch is based on commit `ea3eae30b3a6e5cb0480cef559c6396ddbf022a9` and preserves application/runtime configuration.

## Apply the reviewed changes in Windows PowerShell

Run from your existing Git clone with a clean working tree. Keep local environment files and your database intact. The commands create a review branch; they do not replace production credentials.

```powershell
git status --short
git fetch origin
git switch -c release/careflow-v1.0.0 origin/main
# Use the real path where you extracted the supplied patch:
$patchPath = Read-Host "Full path to CareFlow-v1.0.0.patch"
git apply --check $patchPath
if ($LASTEXITCODE -ne 0) { throw "Patch does not match this checkout. Stop and review the differences." }
git apply $patchPath
python scripts/verify_package.py --source-only
if ($LASTEXITCODE -ne 0) { throw "Source package verification failed" }
python scripts/check_repository.py
if ($LASTEXITCODE -ne 0) { throw "Repository verification failed" }
git diff --stat
git diff --check
git status --short
```

If upstream has changed, a patch conflict is a reason to inspect the affected files, not to force the patch or reset the working tree. Do not replace your current project by deleting its folder. The archive's generated artifacts can be reused locally; they are intentionally ignored by Git.

## Review, commit and run CI

```powershell
git add -- .
python scripts/check_repository.py
if ($LASTEXITCODE -ne 0) { throw "Staged repository verification failed" }
git diff --cached --name-only
git diff --cached --check
git commit -m "chore: prepare CareFlow AI v1.0.0 release"
git push -u origin release/careflow-v1.0.0
```

Review the staged list before committing: it must contain no `.env` or `.demo-credentials` files. Open a pull request to `main`, let the updated CI pass, and review/merge it using your normal workflow. Render may deploy merged source according to your existing integration settings; those settings were not changed here.

## Production smoke check

Using an authorized synthetic account, verify login/logout, dashboard, direct-route refresh, role restrictions, analytics, Python service health, a model request with review, and a cited knowledge answer. Check the Secure/HttpOnly/SameSite session cookie and the intended production origin. Exercise mutations only with agreed disposable records or in staging. Confirm the main and ML services use the intended release commit/configuration. Do not publish credentials in release notes or screenshots.

The earlier `production` GitHub deployment record pointed to a prior source SHA while the latest CI covered `ea3eae30`. A deployment record is not proof of the running process's revision. Use Render's actual deployed-commit display when identifying the release build.

## Create the tag and release only after checks pass

These commands require your authenticated GitHub CLI. Run them after the reviewed changes are merged and the production smoke check is complete. Do not reuse an existing tag.

```powershell
git switch main
git pull --ff-only
$releaseCommit = git rev-parse HEAD
$runId = gh run list --workflow ci.yml --commit $releaseCommit --limit 1 --json databaseId --jq '.[0].databaseId'
if (-not $runId -or $runId -eq "null") { throw "No CI run found for the release commit" }
gh run watch $runId --exit-status
if ($LASTEXITCODE -ne 0) { throw "CI did not pass; do not publish" }
$conclusion = gh api "repos/YT-PRO12/CareFlow-AI/actions/runs/$runId" --jq '.conclusion'
if ($conclusion -ne "success") { throw "The release commit is not verified" }
git tag -a v1.0.0 $releaseCommit -m "CareFlow AI v1.0.0"
if ($LASTEXITCODE -ne 0) { throw "Tag creation failed; do not overwrite an existing tag" }
git push origin v1.0.0
if ($LASTEXITCODE -ne 0) { throw "Tag push failed" }
gh release create v1.0.0 --verify-tag --title "CareFlow AI v1.0.0" --notes-file docs/RELEASE_NOTES_v1.0.0.md
```

**Recommended commit message:** `chore: prepare CareFlow AI v1.0.0 release`.

No secret rotation is required by a finding from this review: no real secret match was identified in the inspected source/history. This does not establish the status of any credentials shared outside Git. The inactive historical provider deployment can remain as history; confirm the obsolete integration is disconnected if it still creates new records.
