const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || "playwright");
(async () => {
  const options = { headless: true };
  if (process.env.BROWSER_EXECUTABLE) {
    options.executablePath = process.env.BROWSER_EXECUTABLE;
    options.args = ["--disable-dev-shm-usage", "--disable-gpu"];
  }
  const browser = await chromium.launch(options);
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1050 },
  });
  context.setDefaultTimeout(15000);
  const page = await context.newPage();
  const errors = [],
    failures = [],
    checks = [];
  page.on("pageerror", (e) => errors.push(e.message));
  let track = false;
  page.on("console", (m) => {
    if (track && m.type() === "error") errors.push(m.text());
  });
  page.on("response", (r) => {
    if (track && r.url().includes("/api/") && r.status() >= 400)
      failures.push(`${r.status()} ${r.url()}`);
  });
  const base = process.env.BROWSER_BASE_URL || "http://127.0.0.1:5000";
  const patientName = "UI Verification " + Date.now();
  const shots = path.resolve("docs/screenshots");
  fs.mkdirSync(shots, { recursive: true });
  async function settle() {
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(200);
  }
  async function route(url, title) {
    await page.goto(base + url);
    await page.getByRole("heading", { name: title, exact: true }).waitFor();
    await settle();
    assert.equal(await page.getByRole("alert").count(), 0, `Error in ${url}`);
    checks.push(url);
    console.log("Verified view", url);
  }
  async function shot(name) {
    await page.screenshot({
      path: path.join(shots, name + ".png"),
      fullPage: true,
    });
  }
  try {
    await page.goto(base + "/login");
    await page.getByLabel("Email address").fill("admin@AegisED.demo");
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in to workspace" }).click();
    await page.getByRole("heading", { name: "Department overview" }).waitFor();
    await settle();
    track = true;
    checks.push("login");
    await shot("dashboard-desktop");
    await route("/patients", "Patients");
    await page
      .getByRole("button", { name: "Add patient", exact: true })
      .click();
    await page.getByLabel("Name", { exact: true }).fill(patientName);
    await page.getByLabel("Age", { exact: true }).fill("35");
    await page.getByRole("button", { name: "Save record" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page
      .getByRole("textbox", { name: /Search patients/i })
      .fill(patientName);
    await page.getByRole("link", { name: patientName, exact: true }).waitFor();
    await page.getByRole("link", { name: patientName, exact: true }).click();
    await page
      .getByRole("heading", { name: patientName, exact: true })
      .waitFor();
    checks.push("patient registration/search/details");
    await route("/emergency", "Emergency operations");
    await page.getByRole("button", { name: "New case", exact: true }).click();
    await page
      .getByRole("textbox", { name: /Find registered patient/i })
      .fill(patientName);
    await settle();
    const selector = page.getByLabel("Patient", { exact: true });
    await selector.selectOption({
      label: patientName + " · 35 years",
    });
    await page
      .getByLabel("Reported symptoms")
      .fill("Synthetic browser workflow verification");
    await page.getByLabel("Human-assigned priority").selectOption("Critical");
    await page
      .getByRole("button", { name: "Create case", exact: true })
      .click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await page
      .getByRole("textbox", { name: /Search cases or patients/i })
      .fill(patientName);
    await settle();
    let card = page.locator(".case-card").filter({ hasText: patientName });
    await card
      .getByRole("button", { name: "Assign doctor", exact: true })
      .click();
    await page
      .getByLabel("Available doctor")
      .locator("option")
      .nth(1)
      .waitFor({ state: "attached" });
    let option = await page
      .getByLabel("Available doctor")
      .locator("option")
      .nth(1)
      .getAttribute("value");
    await page.getByLabel("Available doctor").selectOption(option);
    await page.getByRole("button", { name: "Confirm assignment" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await card.getByRole("button", { name: "Assign bed", exact: true }).click();
    await page
      .getByLabel("Available bed")
      .locator("option")
      .nth(1)
      .waitFor({ state: "attached" });
    option = await page
      .getByLabel("Available bed")
      .locator("option")
      .nth(1)
      .getAttribute("value");
    await page.getByLabel("Available bed").selectOption(option);
    await page.getByRole("button", { name: "Confirm assignment" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    for (const label of [
      "Start treatment",
      "Complete treatment",
      "Discharge patient",
    ]) {
      await card.getByRole("button", { name: label, exact: true }).click();
      await page.getByRole("button", { name: "Confirm action" }).click();
      await page.getByRole("dialog").waitFor({ state: "hidden" });
    }
    await page.getByLabel("Case status").selectOption("Discharged");
    await page
      .locator(".case-card")
      .filter({ hasText: patientName })
      .getByText("Discharged", { exact: true })
      .waitFor();
    checks.push("complete emergency workflow");
    await route("/emergency", "Emergency operations");
    await shot("emergency-desktop");
    await route("/doctors", "Doctors");
    await route("/beds", "Beds & capacity");
    await route("/analytics", "Department analytics");
    await shot("analytics-desktop");
    await route("/decision-support", "AI decision support");
    const select = page.getByLabel("Emergency case", { exact: true });
    const caseOption = await select
      .locator("option")
      .nth(1)
      .getAttribute("value");
    await select.selectOption(caseOption);
    for (const [label, value] of [
      ["Heart rate · bpm", "110"],
      ["Systolic blood pressure · mmHg", "105"],
      ["Respiratory rate · breaths/min", "24"],
      ["Temperature · °C", "37.5"],
      ["Oxygen saturation · %", "94"],
    ])
      await page.getByLabel(label, { exact: true }).fill(value);
    await page.getByRole("button", { name: "Generate estimate" }).click();
    await page.getByRole("heading", { name: "Input sensitivity" }).waitFor();
    await page.getByRole("button", { name: "Override priority" }).click();
    await page.getByLabel("Reviewed priority").selectOption("Stable");
    await page
      .getByLabel("Override reason")
      .fill("Synthetic UI verification of human review");
    await page.getByRole("button", { name: "Record review" }).click();
    await page.getByRole("dialog").waitFor({ state: "hidden" });
    await settle();
    await shot("decision-support-desktop");
    checks.push("ML prediction and human override");
    await route("/knowledge", "Knowledge assistant");
    await page
      .getByRole("button", { name: "How do I assign a bed to a case?" })
      .click();
    await page.getByRole("heading", { name: "Retrieved answer" }).waitFor();
    await page.getByText("Source excerpts", { exact: true }).waitFor();
    await shot("knowledge-desktop");
    checks.push("retrieval and citations");
    await route("/audit", "Audit trail");
    await route("/settings", "Settings");
    for (const size of [
      { width: 768, height: 1024 },
      { width: 390, height: 844 },
    ]) {
      await page.setViewportSize(size);
      for (const [url, title] of [
        ["/dashboard", "Department overview"],
        ["/emergency", "Emergency operations"],
        ["/patients", "Patients"],
        ["/beds", "Beds & capacity"],
        ["/analytics", "Department analytics"],
        ["/decision-support", "AI decision support"],
        ["/knowledge", "Knowledge assistant"],
        ["/settings", "Settings"],
      ]) {
        await route(url, title);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > window.innerWidth + 1,
        );
        assert.equal(
          overflow,
          false,
          `Horizontal overflow ${url} ${size.width}`,
        );
        if (url === "/dashboard") await shot(`dashboard-${size.width}`);
      }
    }
    await page.getByRole("button", { name: "Open navigation" }).click();
    await page
      .locator(".sidebar")
      .getByRole("link", { name: "Emergency operations", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Emergency operations", exact: true })
      .waitFor();
    checks.push("mobile navigation");
    await page.getByRole("button", { name: "Sign out" }).click();
    await page.getByRole("heading", { name: "Welcome back." }).waitFor();
    track = false;
    await page.getByLabel("Email address").fill("reception@AegisED.demo");
    await page
      .getByLabel("Password", { exact: true })
      .fill(process.env.DEMO_PASSWORD);
    await page.getByRole("button", { name: "Sign in to workspace" }).click();
    await page.getByRole("heading", { name: "Department overview" }).waitFor();
    track = true;
    await page.goto(base + "/audit");
    await page.getByRole("heading", { name: "Access restricted" }).waitFor();
    checks.push("role-protected UI");
    assert.deepEqual(errors, []);
    assert.deepEqual(failures, []);
    fs.writeFileSync(
      "docs/browser-results.json",
      JSON.stringify(
        {
          status: "passed",
          completedAt: new Date().toISOString(),
          browser: { name: "chromium", version: browser.version() },
          databaseEngine: process.env.TEST_PGLITE_PATH
            ? "PGlite (serialized test adapter)"
            : "native PostgreSQL",
          checks,
          viewports: [1440, 768, 390],
          consoleErrors: errors,
          failedApiRequests: failures,
        },
        null,
        2,
      ),
    );
    console.log(
      JSON.stringify({
        status: "passed",
        checks: checks.length,
        viewports: [1440, 768, 390],
        consoleErrors: errors,
        failedApiRequests: failures,
      }),
    );
  } catch (e) {
    await shot("test-failure");
    console.error(
      "Form diagnostics:",
      await page.locator("select").evaluateAll((elements) =>
        elements.map((el) => ({
          id: el.id,
          name: el.name,
          labels: [...el.labels].map((label) => label.textContent),
          options: [...el.options].map((option) => option.textContent),
        })),
      ),
    );
    console.error("Browser errors:", errors, "API failures:", failures);
    throw e;
  } finally {
    await browser.close();
  }
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});

