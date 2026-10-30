const STORAGE_KEY = "kakeiboEntries";
const form = document.querySelector("#entry-form");
const tableBody = document.querySelector("tbody");
const totalAmount = document.querySelector("#total-amount");
const statusMessage = document.querySelector("#app-status");

let entries = [];
let storageReady = true;

function isEntry(value) {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof value.date === "string" &&
    typeof value.item === "string" &&
    (value.type === "expense" || value.type === "income") &&
    typeof value.amount === "number" &&
    Number.isSafeInteger(value.amount) &&
    value.amount >= 0
  );
}

function showStatus(message) {
  statusMessage.textContent = message;
}

function loadEntries() {
  try {
    const savedEntries = localStorage.getItem(STORAGE_KEY);
    if (savedEntries === null) {
      return [];
    }

    const parsedEntries = JSON.parse(savedEntries);
    if (!Array.isArray(parsedEntries) || !parsedEntries.every(isEntry)) {
      throw new Error("保存データの形式が正しくありません。");
    }

    return parsedEntries;
  } catch (error) {
    storageReady = false;
    showStatus(
      `保存データを読み込めませんでした。データを保護するため登録を停止しました。${error instanceof Error ? ` (${error.message})` : ""}`
    );
    return [];
  }
}

function renderEntries() {
  tableBody.replaceChildren();

  if (entries.length === 0) {
    const row = document.createElement("tr");
    const cell = document.createElement("td");
    cell.colSpan = 4;
    cell.textContent = "登録されたデータはありません。";
    row.append(cell);
    tableBody.append(row);
  } else {
    for (const entry of entries) {
      const row = document.createElement("tr");
      const values = [
        entry.date,
        entry.item,
        entry.type === "expense" ? "支出" : "収入",
        entry.amount.toLocaleString("ja-JP"),
      ];

      for (const value of values) {
        const cell = document.createElement("td");
        cell.textContent = value;
        row.append(cell);
      }

      tableBody.append(row);
    }
  }

  const balance = entries.reduce(
    (total, entry) =>
      total + (entry.type === "income" ? entry.amount : -entry.amount),
    0
  );
  totalAmount.textContent = balance.toLocaleString("ja-JP");
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  if (!storageReady) {
    return;
  }

  const formData = new FormData(form);
  const item = String(formData.get("item")).trim();
  const amount = Number(formData.get("amount"));
  const type = formData.get("type");

  if (item === "" || !Number.isSafeInteger(amount) || amount < 0) {
    showStatus("品目と0以上の整数の金額を入力してください。");
    return;
  }

  const newEntry = {
    date: String(formData.get("date")),
    item,
    type,
    amount,
  };
  const updatedEntries = [...entries, newEntry];

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedEntries));
  } catch (error) {
    showStatus(
      `データを保存できませんでした。入力内容は登録されていません。${error instanceof Error ? ` (${error.message})` : ""}`
    );
    return;
  }

  entries = updatedEntries;
  renderEntries();
  form.reset();
  showStatus("家計簿に登録しました。");
});

entries = loadEntries();
renderEntries();
