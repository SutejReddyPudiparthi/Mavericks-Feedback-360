import { test, expect } from "@playwright/test";

const logins = [
  {
    role: "Admin",
    email: "admin@maverick360.com",
    password: "Admin@123",
    expectedPath: "/admin",
    expectedHeading: "Admin Dashboard",
  },
  {
    role: "Supervisor",
    email: "supervisor@maverick360.com",
    password: "Supervisor@123",
    expectedPath: "/supervisor",
    expectedHeading: "Supervisor Dashboard",
  },
  {
    role: "Maverick",
    email: "maverick@maverick360.com",
    password: "Maverick@123",
    expectedPath: "/maverick",
    expectedHeading: "My Dashboard",
  },
];

for (const { role, email, password, expectedPath, expectedHeading } of logins) {
  test(`${role} can sign in and reach ${expectedPath}`, async ({ page }) => {
    await page.goto("/login");
    await page.fill('input[placeholder="you@company.com"]', email);
    await page.fill('input[type="password"]', password);
    await page.click('button[type="submit"]');
    const loginResponse = await page.waitForResponse(
      (response) =>
        response.url().endsWith("/api/auth/login") &&
        response.request().method() === "POST",
    );
    expect(loginResponse.status()).toBe(200);
    await page.waitForURL(`**${expectedPath}`);
    await expect(
      page.getByRole("heading", { name: expectedHeading }),
    ).toBeVisible({ timeout: 10000 });
  });
}

test("Admin can open analytics page and see data", async ({ page }) => {
  const admin = logins.find((item) => item.role === "Admin");
  await page.goto("/login");
  await page.fill('input[placeholder="you@company.com"]', admin.email);
  await page.fill('input[type="password"]', admin.password);
  await page.click('button[type="submit"]');
  await page.waitForURL("**/admin");
  await page.click('a:has-text("Analytics")');
  await page.waitForURL("**/admin/analytics");
  await expect(page.getByRole("heading", { name: "Analytics" })).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("button", { name: "Trainer" })).toBeVisible();
});
