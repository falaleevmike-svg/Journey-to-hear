/**
 * Dialog - простые диалоговые окна
 * Уведомления, подтверждения, ввод текста
 */

class Dialog {
    constructor(container) {
        this.container = container || document.getElementById('ui-overlay');
    }

    /**
     * Показ уведомления
     * @param {string} text
     * @param {number} duration
     */
    showNotification(text, duration = 2000) {
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(20, 20, 40, 0.95);
            border: 2px solid #ffb6c1;
            border-radius: 12px;
            padding: 20px 40px;
            color: #fff;
            font-size: 18px;
            z-index: 300;
            text-align: center;
        `;
        div.textContent = text;

        document.body.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, duration);
    }

    /**
     * Показ подтверждения
     * @param {string} text
     * @param {Function} onConfirm
     * @param {Function} onCancel
     */
    showConfirm(text, onConfirm, onCancel) {
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 300;
        `;

        div.innerHTML = `
            <div style="
                background: rgba(20, 20, 40, 0.95);
                border: 2px solid #ffb6c1;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                text-align: center;
            ">
                <p style="color: #fff; margin-bottom: 20px; font-size: 16px;">${text}</p>
                <button class="menu-button" id="btn-confirm-yes" style="margin: 5px;">Да</button>
                <button class="menu-button" id="btn-confirm-no" style="margin: 5px;">Нет</button>
            </div>
        `;

        document.body.appendChild(div);

        document.getElementById('btn-confirm-yes').onclick = () => {
            div.remove();
            if (onConfirm) onConfirm();
        };

        document.getElementById('btn-confirm-no').onclick = () => {
            div.remove();
            if (onCancel) onCancel();
        };
    }

    /**
     * Показ ввода текста
     * @param {string} prompt
     * @param {Function} onSubmit
     */
    showInput(prompt, onSubmit) {
        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 300;
        `;

        div.innerHTML = `
            <div style="
                background: rgba(20, 20, 40, 0.95);
                border: 2px solid #ffb6c1;
                border-radius: 12px;
                padding: 30px;
                max-width: 400px;
                text-align: center;
            ">
                <p style="color: #fff; margin-bottom: 20px; font-size: 16px;">${prompt}</p>
                <input type="text" id="dialog-input" style="
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid #ffb6c1;
                    color: #fff;
                    padding: 10px;
                    border-radius: 6px;
                    width: 100%;
                    margin-bottom: 20px;
                    font-size: 14px;
                ">
                <button class="menu-button" id="btn-input-submit">OK</button>
            </div>
        `;

        document.body.appendChild(div);

        const input = document.getElementById('dialog-input');
        input.focus();

        document.getElementById('btn-input-submit').onclick = () => {
            const value = input.value;
            div.remove();
            if (onSubmit) onSubmit(value);
        };

        input.onkeydown = (e) => {
            if (e.key === 'Enter') {
                document.getElementById('btn-input-submit').click();
            }
        };
    }
}
