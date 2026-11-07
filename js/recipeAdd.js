console.log("レシピ追加画面");

/**
 * 選択した画面を縮小・圧縮してBase64に変換する
 */
function compressImage(
    file,
    maxSize = 1200,
    quantity = 0.75
) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject(new Error("画像ファイルではありません"));
            return;
        }

        const render = new FileReader();

        render.onload = () => {
            const image = new Image();

            image.onload = () => {
                let width = image.naturalWidth;
                let height = image.naturalHeight;

                if (width > height && width > maxSize) {
                    height = Math.round(
                        height * (maxSize / width)
                    );
                    width = maxSize;
                } else if (
                    height >= width &&
                    height > maxSize
                ) {
                    width = Math.round(
                        width * (maxSize / height)
                    );
                    height = maxSize;
                }

                const canvas =
                    document.createElement("canvas");

                canvas.width = width;
                canvas.height = height;

                const context =
                    canvas.getContext("2d");

                if (!context) {
                    reject(
                        new Error(
                            "画像を処理できませんでした"
                        )
                    );
                    return;
                }
                /**
                 * JPEGの透明部分が黒くならないよう、
                 * 背景を白くしてから画像を描く
                 */
                context.fillStyle = "#ffffff";
                context.fillRect(
                    0,
                    0,
                    width,
                    height
                );

                context.drawImage(
                    image,
                    0,
                    0,
                    width,
                    height
                );
                const compressedDaraUrl =
                    canvas.toDataURL(
                        "image/jpeg",
                        quantity
                    );
                resolve(compressedDaraUrl);
            };
            image.onerror = () => {
                reject(
                    new Error(
                        "画像を読み込めませんでした"
                    )
                );
            };
            image.src = render.result;
        };
        render.onerror = () => {
            reject(
                new Error(
                    "ファイルを読み込めませんでした"
                )
            );
        };
        render.readAsDataURL(file);
    });
}

//写真プレビュー 最大３枚
const recipeImage = document.getElementById("recipeImage");
const imagePreviewArea = document.getElementById("imagePreviewArea");

let recipeImages = [];
let currentImageIndex = 0;

// 写真を選択したとき
recipeImage.addEventListener("change", async () => {
    const files = Array.from(recipeImage.files);

    const remainingCount =
        3 - recipeImages.length;

    if (remainingCount <= 0) {
        alert("写真は最大3枚までです");
        recipeImage.value = "";
        return;
    }

    const filesToAdd =
        files.slice(0, remainingCount);

    if (files.length > remainingCount) {
        alert(
            `追加できる写真はあと${remainingCount}枚です`
        );
    }

    try {
        for (const file of filesToAdd) {
            const compressedImage =
                await compressImage(
                    file,
                    1200,
                    0.75
                );

            recipeImages.push(compressedImage);
            currentImageIndex =
                recipeImages.length - 1;
        }

        showImagePreview();
    } catch (error) {
        console.error(
            "画像の圧縮に失敗しました。",
            error
        );

        alert(
            "画像を読み込めませんでした。別の画像を試してください。"
        );
    } finally {
        recipeImage.value = "";
    }
});

// 写真を画面に表示する
function showImagePreview() {
    imagePreviewArea.innerHTML = "";

    if (recipeImages.length === 0) {
        currentImageIndex = 0;
        return;
    }

    if (currentImageIndex < 0) {
        currentImageIndex = recipeImages.length - 1;
    }

    if (currentImageIndex >= recipeImages.length) {
        currentImageIndex = 0;
    }

    const carousel = document.createElement("div");
    carousel.className = "imageCarousel";

    const showNavigation = recipeImages.length >= 2;

    carousel.innerHTML = `
        <img
            src="${recipeImages[currentImageIndex]}"
            alt="料理写真"
        >

        ${showNavigation
            ? `
                    <button
                        type="button"
                        class="imageNavButton imagePrevButton"
                        aria-label="前の写真"
                    >
                        ‹
                    </button>

                    <button
                        type="button"
                        class="imageNavButton imageNextButton"
                        aria-label="次の写真"
                    >
                        ›
                    </button>
                `
            : ""
        }

        <button
            type="button"
            class="imageDeleteButton"
            aria-label="写真を削除"
        >
            ×
        </button>

        <div class="imageCount">
            ${currentImageIndex + 1} / ${recipeImages.length}
        </div>
    `;

    imagePreviewArea.appendChild(carousel);
}

// 写真部分のボタン操作
imagePreviewArea.addEventListener("click", (event) => {
    const prevButton = event.target.closest(".imagePrevButton");
    const nextButton = event.target.closest(".imageNextButton");
    const deleteButton = event.target.closest(".imageDeleteButton");

    if (prevButton) {
        currentImageIndex -= 1;
        showImagePreview();
        return;
    }

    if (nextButton) {
        currentImageIndex += 1;
        showImagePreview();
        return;
    }

    if (deleteButton) {
        recipeImages.splice(currentImageIndex, 1);

        if (currentImageIndex >= recipeImages.length) {
            currentImageIndex = recipeImages.length - 1;
        }

        showImagePreview();
    }
});


//材料エリア
const ingredientsArea = document.getElementById("ingredientsArea");
const addIngredientButton = document.getElementById("addIngredientButton");

//作り方エリア
const stepsArea = document.getElementById("stepsArea");
const addStepButton = document.getElementById("addStepButton");

//材料を追加
addIngredientButton.addEventListener("click", () => {
    const ingredientRow = document.createElement("div");
    ingredientRow.className = "ingredientRow"

    ingredientRow.innerHTML = `
  <div class="voiceInputRow">
    <input type="text" class="ingredientName" placeholder="材料名">
    <button type="button" class="voiceInputButton"
      onclick="startVoiceInput(this.previousElementSibling)"
      aria-label="材料名を音声入力">
      🎤
    </button>
  </div>

    <div class="voiceInputRow">
  <input type="text" class="ingredientAmount" placeholder="分量">
  <button
    type="button"
    class="voiceInputButton"
    onclick="startVoiceInput(this.previousElementSibling)"
    aria-label="分量を音声入力">
    🎤
  </button>
</div>

<button type="button" class="deleteButton">×</button>
`;

    ingredientsArea.appendChild(ingredientRow);
});

//手順を追加
addStepButton.addEventListener("click", () => {
    const stepRow = document.createElement("div");
    stepRow.className = "stepRow";

    stepRow.innerHTML = `
    <div class="voiceInputRow">
  <textarea class="stepInput" placeholder="手順を入力"></textarea>
  <button
    type="button"
    class="voiceInputButton"
    onclick="startVoiceInput(this.previousElementSibling)"
    aria-label="作り方を音声入力">
    🎤
  </button>
</div>

<button type="button" class="deleteButton">×</button>
    `;

    stepsArea.appendChild(stepRow);
});

document.addEventListener("click", (event) => {
    if (event.target.classList.contains("deleteButton")) {
        event.target.parentElement.remove();
    }
});

// =========================
// レシピ保存
// =========================

const saveRecipeButton = document.getElementById("saveRecipeButton");
const recipeTitleInput = document.getElementById("recipeTitle");
const recipeTitleKanaInput = document.getElementById("recipeTitleKana");

saveRecipeButton.addEventListener("click", () => {
    //料理名
    const title = recipeTitleInput.value.trim();
    const titleKana = recipeTitleKanaInput.value.trim();

    if (title === "") {
        alert("料理名を入力してください")
        recipeTitleInput.focus();
        return;
    }

    //材料
    const ingredientRows = document.querySelectorAll(".ingredientRow");
    const ingredients = [];

    ingredientRows.forEach((row) => {
        const nameInput =
            row.querySelector(".ingredientName");

        const amountInput =
            row.querySelector(".ingredientAmount");

        //必要な入力欄が見つからない行は飛ばす
        if (!nameInput || !amountInput) {
            console.warn("材料蘭が見つかりませんでした", row);
            return;
        }

        const name = nameInput ? nameInput.value.trim() : "";

        const amount = amountInput ? amountInput.value.trim() : "";

        //材料名か分量のどちらかが入力されていれば保存
        if (name !== "" || amount !== "") {
            ingredients.push({
                name: name,
                amount: amount
            });
        }
    });

    //作り方
    const stepInputs = document.querySelectorAll(".stepInput");
    const steps = [];

    stepInputs.forEach((input) => {
        const step = input.value.trim();

        if (step != "") {
            steps.push(step);
        }
    });

    //選択されているタグ
    const selectedTag = document.querySelector(
        'input[name="tag"]:checked'
    );

    const tag = selectedTag ? selectedTag.value : "なし";

    //レシピ1件分のデータ
    const newRecipe = {
        id: Date.now(),
        title: title,
        titleKana: titleKana,
        images: recipeImages,
        ingredients: ingredients,
        steps: steps,
        tag: tag,
        createdAt: new Date().toISOString()
    };

    console.log("保存直前の写真配列", recipeImages);
    console.log("保存するレシピ", newRecipe);
    console.log("保存する写真枚数", newRecipe.images.length);

    //すでに保存されているレシピを取得
    const saveRecipes =
        JSON.parse(localStorage.getItem("recipes")) || [];

    //新しいレシピを追加
    saveRecipes.push(newRecipe);

    //localStorageに保存
    try {
        localStorage.setItem(
            "recipes",
            JSON.stringify(saveRecipes)
        );

        console.log(
            "保存後のrecipes",
            JSON.parse(localStorage.getItem("recipes"))
        );

        alert("レシピを保存しました");

        //保存後にホームへ戻る
        location.href = "index.html";

    } catch (error) {
        console.error(error);

        alert(
            "保存容量を超えた可能性があります。写真を減らすか、小さい画像を使ってください。"
        );

    }
});

// =========================
// AI画像読み取り
// =========================

const recipeImportImage =
    document.getElementById("recipeImportImage");

const imageImportStatus =
    document.getElementById("imageImportStatus");

recipeImportImage.addEventListener("change", async () => {

    const file = recipeImportImage.files[0];

    if (!file) {
        return;
    }

    console.log("AI読み取り用画像:", file);

    imageImportStatus.textContent =
        `選択した画像：${file.name}`;

    try {

        imageImportStatus.textContent =
            "画像を読み込んでいます...";

        const compressedImage =
            await compressImage(file, 1200, 0.75);

        console.log(
            "AI読み取り用Base64:",
            compressedImage
        );

        imageImportStatus.textContent =
            `画像の準備完了：${file.name}`;

        const base64Data = compressedImage.split(",")[1];

        imageImportStatus.textContent =
            "AIがレシピを読み取っています...";

        const response = await fetch(
            "https://recipe-gemini-api.zuotengyahai177.workers.dev/",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    mode: "image",
                    imageBase64: base64Data,
                    mimeType: "image/jpeg"
                })
            }
        );

        // Geminiからの返事を確認
        if (!response.ok) {
            const errorData = await response.text();
            throw new Error(errorData);
        }

        // 返ってきたJSONを取得
        const recipeData = await response.json();

        console.log("Geminiの読み取り結果:", recipeData);

        // AIが読み取った料理名を入力欄に反映
        recipeTitleInput.value = recipeData.title || "";

        // AIが読み取ったよみがなを入力欄に反映
        const recipeYomiganaInput = document.getElementById("recipeTitleKana");

        if (recipeYomiganaInput) {
            recipeYomiganaInput.value = recipeData.yomigana || "";
            console.log("よみがな自動入力確認:", recipeData.yomigana);

        }

        // AIが読み取った材料を入力欄に反映
        if (Array.isArray(recipeData.ingredients)) {

            // 既存の材料入力欄をクリア
            ingredientsArea.innerHTML = "";

            recipeData.ingredients.forEach((ingredient) => {

                const ingredientRow = document.createElement("div");
                ingredientRow.className = "ingredientRow";

                const nameInput = document.createElement("input");
                nameInput.type = "text";
                nameInput.className = "ingredientName";
                nameInput.placeholder = "材料名";

                const amountInput = document.createElement("input");
                amountInput.type = "text";
                amountInput.className = "ingredientAmount";
                amountInput.placeholder = "分量";

                if (typeof ingredient === "string") {
                    nameInput.value = ingredient;
                } else {
                    nameInput.value = ingredient.name || "";
                    amountInput.value = ingredient.amount || "";
                }

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "deleteButton";
                deleteButton.textContent = "×";

                const voiceRow = document.createElement("div");
                voiceRow.className = "voiceInputRow";

                const voiceButton = document.createElement("button");
                voiceButton.type = "button";
                voiceButton.className = "voiceInputButton";
                voiceButton.textContent = "🎤";
                voiceButton.setAttribute("aria-label", "材料名を音声入力");

                voiceButton.addEventListener("click", () => {
                    startVoiceInput(nameInput);
                });

                voiceRow.append(nameInput, voiceButton);

                ingredientRow.append(voiceRow, amountInput, deleteButton);
                ingredientsArea.appendChild(ingredientRow);
            });
        }

        // AIが読み取った作り方を入力欄に反映
        if (Array.isArray(recipeData.steps)) {

            // 既存の手順欄をクリア
            stepsArea.innerHTML = "";

            recipeData.steps.forEach((step) => {

                const stepRow = document.createElement("div");
                stepRow.className = "stepRow";

                const stepInput = document.createElement("textarea");
                stepInput.className = "stepInput";
                stepInput.placeholder = "手順を入力";
                stepInput.value = typeof step === "string"
                    ? step
                    : (step.text || step.description || "");

                const deleteButton = document.createElement("button");
                deleteButton.type = "button";
                deleteButton.className = "deleteButton";
                deleteButton.textContent = "×";

                stepRow.append(stepInput, deleteButton);
                stepsArea.appendChild(stepRow);
            });
        }

        imageImportStatus.textContent =
            "AIによる画像の読み取りが完了しました！";

    } catch (error) {

        console.error(
            "AI読み取り用画像の処理に失敗しました",
            error
        );

        imageImportStatus.textContent =
            "画像を読み込めませんでした。";
    }

});