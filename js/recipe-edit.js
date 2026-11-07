"use strict";

const STORAGE_KEY = "recipes";
const MAX_IMAGES = 3;

const updateButton =
    document.getElementById("update-button");

const editForm =
    document.getElementById("recipe-edit-form");

const notFoundMessage =
    document.getElementById("not-found-message");

const titleInput =
    document.getElementById("recipe-title");

const titleKanaInput =
    document.getElementById("recipe-title-kana");

const imageInput =
    document.getElementById("recipe-image-input");

const imagePreviewArea =
    document.getElementById("image-preview-area");

const imagePreview =
    document.getElementById("image-preview");

const imageEmptyMessage =
    document.getElementById("image-empty-message");

const imageCount =
    document.getElementById("image-count");

const previousImageButton =
    document.getElementById("previous-image-button");

const nextImageButton =
    document.getElementById("next-image-button");

const removeImageButton =
    document.getElementById("remove-image-button");

const ingredientContainer =
    document.getElementById("ingredient-container");

const addIngredientButton =
    document.getElementById("add-ingredient-button");

const stepContainer =
    document.getElementById("step-container");

const addStepButton =
    document.getElementById("add-step-button");

const tagContainer =
    document.getElementById("tag-container");

const backButton =
    document.getElementById("back-button");

const cancelButton =
    document.getElementById("cancel-button");

let recipes = [];
let selectedRecipe = null;
let selectedRecipeIndex = -1;

let recipeImages = [];
let currentImageIndex = 0;

/**
 * 保存済みレシピを読み込む
 */
function loadRecipes() {
    try {
        const savedRecipes =
            localStorage.getItem(STORAGE_KEY);

        if (!savedRecipes) {
            return [];
        }

        const parsedRecipes =
            JSON.parse(savedRecipes);

        return Array.isArray(parsedRecipes)
            ? parsedRecipes
            : [];
    } catch (error) {
        console.error(
            "レシピの読み込みに失敗しました。",
            error
        );

        return [];
    }
}

/**
 * URLからIDを取得する
 */
function getRecipeIdFromUrl() {
    const parameters =
        new URLSearchParams(window.location.search);

    return parameters.get("id");
}

/**
 * 編集対象のレシピを探す
 */
function findRecipe(recipeId) {
    if (recipeId === null) {
        return {
            recipe: null,
            index: -1
        };
    }

    const foundIndex =
        recipes.findIndex((recipe) => {
            if (
                recipe.id === undefined ||
                recipe.id === null
            ) {
                return false;
            }

            return (
                String(recipe.id) ===
                String(recipeId)
            );
        });

    if (foundIndex !== -1) {
        return {
            recipe: recipes[foundIndex],
            index: foundIndex
        };
    }

    const possibleIndex = Number(recipeId);

    if (
        Number.isInteger(possibleIndex) &&
        possibleIndex >= 0 &&
        possibleIndex < recipes.length
    ) {
        return {
            recipe: recipes[possibleIndex],
            index: possibleIndex
        };
    }

    return {
        recipe: null,
        index: -1
    };
}

/**
 * 値を安全な文字列にする
 */
function getText(value) {
    if (
        value === undefined ||
        value === null
    ) {
        return "";
    }

    return String(value);
}

/**
 * 画像配列を取得する
 */
function getRecipeImages(recipe) {
    if (Array.isArray(recipe.images)) {
        return [...recipe.images];
    }

    if (Array.isArray(recipe.recipeImages)) {
        return [...recipe.recipeImages];
    }

    return [];
}

/**
 * 画像を圧縮する
 */
function compressImage(
    file,
    maxSize = 1200,
    quality = 0.75
) {
    return new Promise((resolve, reject) => {
        if (!file.type.startsWith("image/")) {
            reject(
                new Error(
                    "画像ファイルではありません。"
                )
            );

            return;
        }

        const reader = new FileReader();

        reader.onload = () => {
            const image = new Image();

            image.onload = () => {
                let width = image.naturalWidth;
                let height = image.naturalHeight;

                if (
                    width > height &&
                    width > maxSize
                ) {
                    height = Math.round(
                        height *
                        (maxSize / width)
                    );

                    width = maxSize;
                } else if (
                    height >= width &&
                    height > maxSize
                ) {
                    width = Math.round(
                        width *
                        (maxSize / height)
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
                            "画像を処理できませんでした。"
                        )
                    );

                    return;
                }

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

                resolve(
                    canvas.toDataURL(
                        "image/jpeg",
                        quality
                    )
                );
            };

            image.onerror = () => {
                reject(
                    new Error(
                        "画像を読み込めませんでした。"
                    )
                );
            };

            image.src = reader.result;
        };

        reader.onerror = () => {
            reject(
                new Error(
                    "ファイルを読み込めませんでした。"
                )
            );
        };

        reader.readAsDataURL(file);
    });
}

/**
 * 写真プレビューを表示する
 */
function renderImagePreview() {
    if (recipeImages.length === 0) {
        imagePreviewArea.hidden = true;
        imageEmptyMessage.hidden = false;

        currentImageIndex = 0;
        return;
    }

    if (
        currentImageIndex >=
        recipeImages.length
    ) {
        currentImageIndex =
            recipeImages.length - 1;
    }

    if (currentImageIndex < 0) {
        currentImageIndex = 0;
    }

    imagePreviewArea.hidden = false;
    imageEmptyMessage.hidden = true;

    imagePreview.src =
        recipeImages[currentImageIndex];

    imageCount.textContent =
        `${currentImageIndex + 1} / ` +
        `${recipeImages.length}`;

    const hasMultipleImages =
        recipeImages.length > 1;

    previousImageButton.hidden =
        !hasMultipleImages;

    nextImageButton.hidden =
        !hasMultipleImages;
}

/**
 * 前の写真
 */
function showPreviousImage() {
    currentImageIndex--;

    if (currentImageIndex < 0) {
        currentImageIndex =
            recipeImages.length - 1;
    }

    renderImagePreview();
}

/**
 * 次の写真
 */
function showNextImage() {
    currentImageIndex++;

    if (
        currentImageIndex >=
        recipeImages.length
    ) {
        currentImageIndex = 0;
    }

    renderImagePreview();
}

/**
 * 現在表示中の写真を削除する
 */
function removeCurrentImage() {
    if (recipeImages.length === 0) {
        return;
    }

    recipeImages.splice(
        currentImageIndex,
        1
    );

    if (
        currentImageIndex >=
        recipeImages.length
    ) {
        currentImageIndex =
            recipeImages.length - 1;
    }

    renderImagePreview();
}

/**
 * 材料入力欄を作る
 */
function createIngredientRow(
    ingredientName = "",
    ingredientAmount = ""
) {
    const row =
        document.createElement("div");

    row.className = "ingredient-row";

    const nameInput =
        document.createElement("input");

    nameInput.type = "text";
    nameInput.className =
        "ingredient-name-input";
    nameInput.placeholder = "材料名";
    nameInput.value = ingredientName;

    const amountInput =
        document.createElement("input");

    amountInput.type = "text";
    amountInput.className =
        "ingredient-amount-input";
    amountInput.placeholder = "分量";
    amountInput.value = ingredientAmount;

    const removeButton =
        document.createElement("button");

    removeButton.type = "button";
    removeButton.className =
        "remove-row-button";
    removeButton.textContent = "×";
    removeButton.setAttribute(
        "aria-label",
        "材料を削除"
    );

    removeButton.addEventListener(
        "click",
        () => {
            row.remove();

            if (
                ingredientContainer
                    .querySelectorAll(
                        ".ingredient-row"
                    ).length === 0
            ) {
                ingredientContainer.appendChild(
                    createIngredientRow()
                );
            }
        }
    );

    // 材料名とマイクボタンをまとめる
    const nameRow = document.createElement("div");
    nameRow.className = "voiceInputRow";

    const voiceButton = document.createElement("button");
    voiceButton.type = "button";
    voiceButton.className = "voiceInputButton";
    voiceButton.textContent = "🎤";
    voiceButton.setAttribute("aria-label", "材料名を音声入力");

    voiceButton.addEventListener("click", () => {
        startVoiceInput(nameInput);
    });

    nameRow.append(nameInput, voiceButton);

    // 分量とマイクボタンをまとめる
    const amountRow = document.createElement("div");
    amountRow.className = "voiceInputRow";

    const amountVoiceButton = document.createElement("button");
    amountVoiceButton.type = "button";
    amountVoiceButton.className = "voiceInputButton";
    amountVoiceButton.textContent = "🎤";
    amountVoiceButton.setAttribute("aria-label", "分量を音声入力");

    amountVoiceButton.addEventListener("click", () => {
        startVoiceInput(amountInput);
    });

    amountRow.append(amountInput, amountVoiceButton);

    row.appendChild(nameRow);
    row.appendChild(amountRow);
    row.appendChild(removeButton);

    return row;
}

/**
 * 作り方入力欄を作る
 */
function createStepRow(stepText = "") {
    const row =
        document.createElement("div");

    row.className = "step-row";

    const textarea =
        document.createElement("textarea");

    textarea.className = "step-input";
    textarea.placeholder =
        "作り方を入力してください";
    textarea.value = stepText;

    const removeButton =
        document.createElement("button");

    removeButton.type = "button";
    removeButton.className =
        "remove-row-button";
    removeButton.textContent = "×";
    removeButton.setAttribute(
        "aria-label",
        "手順を削除"
    );

    removeButton.addEventListener(
        "click",
        () => {
            row.remove();

            if (
                stepContainer
                    .querySelectorAll(
                        ".step-row"
                    ).length === 0
            ) {
                stepContainer.appendChild(
                    createStepRow()
                );
            }
        }
    );

    // 作り方とマイクボタンをまとめる
    const stepVoiceRow = document.createElement("div");
    stepVoiceRow.className = "voiceInputRow";

    // マイクボタンを作成
    const stepVoiceButton = document.createElement("button");
    stepVoiceButton.type = "button";
    stepVoiceButton.className = "voiceInputButton";
    stepVoiceButton.textContent = "🎤";
    stepVoiceButton.setAttribute(
        "aria-label",
        "作り方を音声入力"
    );

    // マイクを押したときの処理
    stepVoiceButton.addEventListener("click", () => {
        startVoiceInput(textarea);
    });

    // 入力欄とマイクを横並びにする
    stepVoiceRow.append(textarea, stepVoiceButton);

    row.appendChild(stepVoiceRow);
    row.appendChild(removeButton);

    return row;
}

/**
 * 材料名を取得する
 */
function getIngredientName(ingredient) {
    if (typeof ingredient === "string") {
        return ingredient;
    }

    if (
        !ingredient ||
        typeof ingredient !== "object"
    ) {
        return "";
    }

    return getText(
        ingredient.name ??
        ingredient.ingredient ??
        ingredient.ingredientName ??
        ""
    );
}

/**
 * 材料の分量を取得する
 */
function getIngredientAmount(ingredient) {
    if (
        !ingredient ||
        typeof ingredient !== "object"
    ) {
        return "";
    }

    return getText(
        ingredient.amount ??
        ingredient.quantity ??
        ingredient.ingredientAmount ??
        ""
    );
}

/**
 * 手順の文章を取得する
 */
function getStepText(step) {
    if (typeof step === "string") {
        return step;
    }

    if (
        !step ||
        typeof step !== "object"
    ) {
        return "";
    }

    return getText(
        step.text ??
        step.description ??
        step.step ??
        step.content ??
        ""
    );
}

/**
 * 保存済みのタグを選択する
 */
function selectSavedTag(savedTag) {
    const tag =
        getText(savedTag).trim() ||
        "なし";

    let radio =
        tagContainer.querySelector(
            `input[name="recipe-tag"][value="${CSS.escape(tag)}"]`
        );

    /**
     * 保存済みタグが標準タグにない場合は
     * 編集画面に自動で追加する
     */
    if (!radio) {
        const label =
            document.createElement("label");

        label.classname = "tag-option";

        radio = document.createElement("input");
        radio.type = "radio";
        radio.name = "recipe-tag"
        radio.value = tag;

        const span =
            document.createElement("span");

        span.textContent = tag;

        label.appendChild(radio);
        label.appendChild(span);
        tagContainer.appendChild(label);
    }

    radio.checked = true;
}

/**
 * 保存済みデータを入力欄へ入れる
 */
function populateForm() {
    titleInput.value =
        getText(selectedRecipe.title);

    recipeImages =
        getRecipeImages(selectedRecipe);

    currentImageIndex = 0;
    renderImagePreview();

    ingredientContainer.innerHTML = "";

    const ingredients =
        Array.isArray(
            selectedRecipe.ingredients
        )
            ? selectedRecipe.ingredients
            : [];

    if (ingredients.length === 0) {
        ingredientContainer.appendChild(
            createIngredientRow()
        );
    } else {
        ingredients.forEach((ingredient) => {
            ingredientContainer.appendChild(
                createIngredientRow(
                    getIngredientName(ingredient),
                    getIngredientAmount(ingredient)
                )
            );
        });
    }

    stepContainer.innerHTML = "";

    const steps =
        Array.isArray(selectedRecipe.steps)
            ? selectedRecipe.steps
            : [];

    if (steps.length === 0) {
        stepContainer.appendChild(
            createStepRow()
        );
    } else {
        steps.forEach((step) => {
            stepContainer.appendChild(
                createStepRow(
                    getStepText(step)
                )
            );
        });
    }

    selectSavedTag(selectedRecipe.tag);

    const recipeId =
        selectedRecipe.id ??
        selectedRecipeIndex;

    const fromPage =
        getFromPage();

    const detailUrl =
        "recipe-detail.html?id=" +
        encodeURIComponent(recipeId) +
        "&from=" +
        encodeURIComponent(fromPage);

    backButton.href = detailUrl;
    cancelButton.href = detailUrl;
}

/**
 * 編集内容を更新保存する
 */
function updateRecipe(event) {
    event.preventDefault();
    console.log("更新処理が実行されました");

    const title =
        titleInput.value.trim();

    if (title === "") {
        alert("料理名を入力してください。");
        titleInput.focus();
        return;
    }

    const titleKana =
        titleKanaInput.value.trim();

    const ingredients = [];

    const ingredientRows =
        ingredientContainer.querySelectorAll(
            ".ingredient-row"
        );

    ingredientRows.forEach((row) => {
        const name =
            row.querySelector(
                ".ingredient-name-input"
            ).value.trim();

        const amount =
            row.querySelector(
                ".ingredient-amount-input"
            ).value.trim();

        if (
            name !== "" ||
            amount !== ""
        ) {
            ingredients.push({
                name,
                amount
            });
        }
    });

    const steps = [];

    const stepInputs =
        stepContainer.querySelectorAll(
            ".step-input"
        );

    stepInputs.forEach((input) => {
        const stepText =
            input.value.trim();

        if (stepText !== "") {
            steps.push(stepText);
        }
    });

    const selectedTag =
        document.querySelector(
            'input[name="recipe-tag"]:checked'
        );

    const tag =
        selectedTag
            ? selectedTag.value
            : "なし";

    const updatedRecipe = {
        ...selectedRecipe,

        id:
            selectedRecipe.id ??
            Date.now(),

        title,
        titleKana,

        images: [...recipeImages],

        ingredients,
        steps,
        tag,

        createdAt:
            selectedRecipe.createdAt ??
            new Date().toISOString(),

        updatedAt:
            new Date().toISOString()
    };

    recipes[selectedRecipeIndex] =
        updatedRecipe;

    try {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(recipes)
        );

        alert("レシピを更新しました");

        const fromPage =
            getFromPage();

        window.location.href =
            "recipe-detail.html?id=" +
            encodeURIComponent(updatedRecipe.id) +
            "&from=" +
            encodeURIComponent(fromPage);
    } catch (error) {
        console.error(
            "レシピの更新に失敗しました。",
            error
        );

        alert(
            "保存容量を超えた可能性があります。" +
            "写真を減らすか、小さい写真を使用してください。"
        );
    }
}

/**
 * URLからfromを取得する関数を追加
 */
function getFromPage() {
    const parameters =
        new URLSearchParams(window.location.search);

    return parameters.get("from") ?? "list";
}

/**
 * 編集画面を初期化する
 */
function initializeRecipeEdit() {
    recipes = loadRecipes();

    const recipeId =
        getRecipeIdFromUrl();

    const result =
        findRecipe(recipeId);

    selectedRecipe = result.recipe;
    selectedRecipeIndex = result.index;

    if (!selectedRecipe) {
        editForm.hidden = true;
        notFoundMessage.hidden = false;
        return;
    }

    notFoundMessage.hidden = true;
    editForm.hidden = false;

    populateForm();

    addIngredientButton.addEventListener(
        "click",
        () => {
            ingredientContainer.appendChild(
                createIngredientRow()
            );
        }
    );

    addStepButton.addEventListener(
        "click",
        () => {
            stepContainer.appendChild(
                createStepRow()
            );
        }
    );

    imageInput.addEventListener(
        "change",
        async () => {
            const files =
                Array.from(imageInput.files);

            if (files.length === 0) {
                return;
            }

            const remainingCount =
                MAX_IMAGES -
                recipeImages.length;

            if (remainingCount <= 0) {
                alert(
                    "写真は最大3枚まで登録できます。"
                );

                imageInput.value = "";
                return;
            }

            const filesToAdd =
                files.slice(
                    0,
                    remainingCount
                );

            if (
                files.length >
                remainingCount
            ) {
                alert(
                    `追加できる写真はあと` +
                    `${remainingCount}枚です。`
                );
            }

            try {
                for (
                    const file of filesToAdd
                ) {
                    const compressedImage =
                        await compressImage(
                            file,
                            1200,
                            0.75
                        );

                    recipeImages.push(
                        compressedImage
                    );

                    currentImageIndex =
                        recipeImages.length - 1;
                }

                renderImagePreview();
            } catch (error) {
                console.error(
                    "画像の追加に失敗しました。",
                    error
                );

                alert(
                    "画像を読み込めませんでした。"
                );
            } finally {
                imageInput.value = "";
            }
        }
    );

    previousImageButton.addEventListener(
        "click",
        showPreviousImage
    );

    nextImageButton.addEventListener(
        "click",
        showNextImage
    );

    removeImageButton.addEventListener(
        "click",
        removeCurrentImage
    );

    updateButton.addEventListener(
        "click",
        updateRecipe
    );
}

initializeRecipeEdit();