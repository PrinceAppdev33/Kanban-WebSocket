import { test, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API_URL = "http://localhost:5001";

test.beforeEach(async ({ request }) => {
  await request.post(`${API_URL}/test/reset`);
});

async function waitForBoard(page) {
  await expect(page.getByText("Real-time Kanban Board")).toBeVisible();
  await expect(page.getByTestId("loading-indicator")).toBeHidden({ timeout: 15000 });
  await expect(page.getByTestId("completion-percentage")).toContainText("0 of 0 tasks done");
}

async function createTask(page, title, description = "") {
  await page.getByTestId("task-title-input").fill(title);
  if (description) {
    await page.getByTestId("task-description-input").fill(description);
  }
  await page.getByTestId("add-task-btn").click();
  await expect(page.getByText(title)).toBeVisible();
}

async function dragTaskToColumn(page, taskTitle, columnId) {
  const taskCard = page.locator(".task-card").filter({ hasText: taskTitle });
  const targetColumn = page.getByTestId(`column-content-${columnId}`);
  await taskCard.dragTo(targetColumn);
}

test.describe("Kanban Board", () => {
  test("User can add a task and see it on the board", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "E2E Test Task", "A test description");
    await expect(page.getByTestId("column-todo")).toContainText("E2E Test Task");
  });

  test("User can drag and drop a task between columns", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "Drag Task");

    await dragTaskToColumn(page, "Drag Task", "in-progress");

    await expect(page.getByTestId("column-content-in-progress")).toContainText("Drag Task", { timeout: 5000 });
  });

  test("UI updates in real-time when another user modifies tasks", async ({ browser }) => {
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    await page1.goto("/");
    await page2.goto("/");
    await waitForBoard(page1);
    await waitForBoard(page2);

    await createTask(page1, "Realtime Task");

    await expect(page2.getByText("Realtime Task")).toBeVisible({ timeout: 10000 });

    await context1.close();
    await context2.close();
  });

  test("User can delete a task and see it removed", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "Task To Delete");

    const taskCard = page.locator(".task-card").filter({ hasText: "Task To Delete" });
    await taskCard.getByTestId("delete-task-btn").click();

    await expect(page.getByText("Task To Delete")).toBeHidden({ timeout: 5000 });
  });
});

test.describe("Dropdown Select Testing", () => {
  test("User can select a priority level", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "Priority Task");

    await page.getByTestId("priority-select").first().selectOption("High");

    await expect(page.getByTestId("priority-badge").first()).toHaveText("High");
  });

  test("User can change the task category and verify the update", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "Category Task");

    await page.getByTestId("category-select").first().selectOption("Bug");

    await expect(page.getByTestId("category-badge").first()).toHaveText("Bug");
  });
});

test.describe("File Upload Testing", () => {
  test("User can upload a file and see preview", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "Upload Task");

    const fileInput = page.getByTestId("file-upload-input").first();
    const imagePath = path.join(__dirname, "../../../public/vite.svg");
    await fileInput.setInputFiles(imagePath);

    await expect(page.getByTestId("attachment-preview").first()).toBeVisible({ timeout: 5000 });
  });

  test("Invalid files show an error message", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "Invalid Upload Task");

    const fileInput = page.getByTestId("file-upload-input").first();
    await fileInput.setInputFiles({
      name: "test.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("invalid content"),
    });

    await expect(page.getByTestId("file-error").first()).toBeVisible();
    await expect(page.getByTestId("file-error").first()).toContainText("Invalid file type");
  });
});

test.describe("Graph Testing", () => {
  test("Task counts update correctly in the graph as tasks move", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);
    await createTask(page, "Graph Task 1");
    await createTask(page, "Graph Task 2");

    await expect(page.getByTestId("progress-chart")).toBeVisible();
    await expect(page.getByTestId("completion-percentage")).toContainText("0%");

    await dragTaskToColumn(page, "Graph Task 1", "done");

    await expect(page.getByTestId("completion-percentage")).toContainText("50%", { timeout: 5000 });
  });

  test("Graph re-renders dynamically when new tasks are added", async ({ page }) => {
    await page.goto("/");
    await waitForBoard(page);

    await expect(page.getByTestId("completion-percentage")).toContainText("0% Complete (0 of 0 tasks done)");

    await createTask(page, "New Graph Task");

    await expect(page.getByTestId("completion-percentage")).toContainText("0% Complete (0 of 1 tasks done)");
    await expect(page.getByTestId("progress-chart")).toBeVisible();
  });
});
