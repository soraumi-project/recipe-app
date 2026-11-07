/* アプリ共通の音声入力機能 */
(() => {
    const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;

    // 音声認識に対応していないブラウザでは無効化
    if (!SpeechRecognition) {
        console.warn("このブラウザは音声認識に対応していません。");
        return;
    }

    // 指定した入力欄に音声を入力する
    window.startVoiceInput = function (inputElement) {
        if (!inputElement) return;

        const recognition = new SpeechRecognition();

        recognition.lang = "ja-JP";
        recognition.continuous = false;
        recognition.interimResults = false;

        recognition.onresult = (event) => {
            let transcript = event.results[0][0].transcript;

            // よみがな欄だけカタカナをひらがなに変換
            if (inputElement.id === "recipeTitleKana") {
                transcript = transcript.replace(/[\u30A1-\u30F6]/g, (char) =>
                    String.fromCharCode(char.charCodeAt(0) - 0x60)
                );
            }

            const separator =
                inputElement.value.trim() ? " " : "";

            inputElement.value += separator + transcript;

            // 既存の入力イベントも発火させる
            inputElement.dispatchEvent(
                new Event("input", { bubbles: true })
            );
        };

        recognition.onerror = (event) => {
            console.error("音声認識エラー:", event.error);
        };

        recognition.start();
    };
})();