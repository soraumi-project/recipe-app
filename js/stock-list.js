const backButton = document.getElementById("backButton");

if (backButton) {
    backButton.addEventListener("click", () => {
        window.location.href = "index.html";
    });
}

const STOCK_STORAGE_KEY = "stockList";

let stockList =
    JSON.parse(localStorage.getItem(STOCK_STORAGE_KEY)) || [];

const stockNameInput =
    document.getElementById("stockNameInput");

const stockQuantityInput =
    document.getElementById("stockQuantityInput");

const stockUnitInput =
    document.getElementById("stockUnitInput");

const stockAlertInput =
    document.getElementById("stockAlertInput")

const addStockButton =
    document.getElementById("addStockButton")

const stockListElement =
    document.getElementById("stockList");

const emptyMessage =
    document.getElementById("emptyMessage");

let editingIndex = null;

/**
 * 保存用関数
 */
function saveStockList() {
    localStorage.setItem(
        STOCK_STORAGE_KEY,
        JSON.stringify(stockList)
    );
}

/**
 * 表示用関数
 */
function renderStockList() {
    stockListElement.innerHTML = "";

    if (stockList.length === 0) {
        emptyMessage.style.display = "block";
        return;
    }

    emptyMessage.style.display = "none";

    stockList.forEach((item, index) => {
        const li = document.createElement("li");

        const itemInfo = document.createElement("div");
        itemInfo.classList.add("stockItemInfo");

        const name = document.createElement("span");
        name.classList.add("stockName");
        name.textContent = item.name;

        const amount = document.createElement("span");
        amount.classList.add("stockAmount");
        amount.textContent = `${item.quantity}${item.unit}`;

        itemInfo.appendChild(name);
        itemInfo.appendChild(amount);

        const isLowStock =
            item.quantity <= item.alertQuantity;

        if (isLowStock) {

            const warning = document.createElement("span");

            warning.classList.add("stockWarning");

            warning.textContent =
                "⚠ 在庫が少なくなっています";

            itemInfo.appendChild(warning);
        }

        const deleteButton = document.createElement("button");

        deleteButton.type = "button";
        deleteButton.classList.add("deleteStockButton");
        deleteButton.textContent = "削除"

        deleteButton.addEventListener("click", () => {
            const shouldDelete =
                window.confirm(
                    `${item.name}を在庫から削除しますか？`
                );

            if (!shouldDelete) {
                return;
            }

            stockList.splice(index, 1);

            saveStockList();
            renderStockList();
        });

        const editButton = document.createElement("button");

        editButton.type = "button";
        editButton.classList.add("editStockButton");
        editButton.textContent = "編集"

        editButton.addEventListener("click", () => {
            stockNameInput.value = item.name;
            stockQuantityInput.value = item.quantity;
            stockUnitInput.value = item.unit;
            stockAlertInput.value = item.alertQuantity;

            editingIndex = index;

            addStockButton.textContent = "更新"
        });

        const shoppingButton = document.createElement("button");

        shoppingButton.type = "button";
        shoppingButton.classList.add("shoppingStockButton");
        shoppingButton.textContent = "買い物リストへ";

        shoppingButton.addEventListener("click", () => {
            let shoppingList =
                JSON.parse(localStorage.getItem("shoppingList")) || [];

            const alreadyExists = shoppingList.some((shoppingItem) => {
                return shoppingItem.name === item.name;
            });

            if (alreadyExists) {
                alert(`${item.name}はすでに買い物リストに入っています`);
                return;
            }

            shoppingList.push({
                name: item.name,
                checked: false,
                sourceRecipe: "在庫管理"
            });

            localStorage.setItem(
                "shoppingList",
                JSON.stringify(shoppingList)
            );
            alert(`${item.name}を買い物リストに追加しました`);

            if (isLowStock) {
                shoppingButton.classList.add("lowStockShoppingButton");
            }
        });

        const buttonArea = document.createElement("div");
        buttonArea.classList.add("stockButtonArea");

        buttonArea.appendChild(shoppingButton);
        buttonArea.appendChild(editButton);
        buttonArea.appendChild(deleteButton);

        li.appendChild(itemInfo);
        li.appendChild(buttonArea);

        stockListElement.appendChild(li);
    });
}

/**
 * 追加ボタン
 */
addStockButton.addEventListener("click", () => {
    const name = stockNameInput.value.trim();
    const quantity = Number(stockQuantityInput.value);
    const unit = stockUnitInput.value.trim();
    const alertQuantity = Number(stockAlertInput.value);


    // 警告する数量を先にチェック
    if (
        stockAlertInput.value === "" ||
        !Number.isInteger(alertQuantity) ||
        alertQuantity < 0
    ) {
        alert("警告する数量を正しく入力してください。");
        return;
    }
    if (name === "") {
        alert("材料名を入力してください");
        return;
    }

    if (
        stockQuantityInput.value === "" ||
        quantity < 0
    ) {
        alert("数量を正しく入力してください");
        return;
    }

    if (unit === "") {
        alert("単位を入力してください");
        return;
    }


    if (editingIndex !== null) {
        stockList[editingIndex] = {
            name: name,
            quantity: quantity,
            unit: unit,
            alertQuantity: alertQuantity
        };

        editingIndex = null;
        addStockButton.textContent = "在庫に追加";
    } else {
        stockList.push({
            name: name,
            quantity: quantity,
            unit: unit,
            alertQuantity: alertQuantity
        });
    }



    saveStockList();
    renderStockList();

    stockNameInput.value = "";
    stockQuantityInput.value = "";
    stockUnitInput.value = "";
    stockAlertInput.value = "";
});

renderStockList();