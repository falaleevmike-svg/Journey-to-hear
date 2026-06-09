/**
 * UIManager - управление игровым интерфейсом
 * Сердечки, счётчики, сообщения, меню паузы
 */

class UIManager {
    constructor(container) {
        this.container = container || document.getElementById('ui-overlay');
        this.elements = {};
        this.visible = true;

        this._initUI();
    }

    /**
     * Инициализация UI элементов
     * @private
     */
    _initUI() {
        // Очистка контейнера
        this.container.innerHTML = '';

        // Верхняя панель (сердечки и воспоминания)
        const topBar = document.createElement('div');
        topBar.style.cssText = `
            display: flex;
            justify-content: space-between;
            align-items: center;
            width: 100%;
            padding: 10px 20px;
        `;

        // Сердечки
        const heartsContainer = document.createElement('div');
        heartsContainer.className = 'ui-hearts';
        heartsContainer.id = 'ui-hearts';
        topBar.appendChild(heartsContainer);

        // Воспоминания
        const memoriesContainer = document.createElement('div');
        memoriesContainer.className = 'ui-memories';
        memoriesContainer.id = 'ui-memories';
        memoriesContainer.innerHTML = '<span class="memory-icon">📷</span> <span id="memory-count">0/4</span>';
        topBar.appendChild(memoriesContainer);

        this.container.appendChild(topBar);

        // Сохранение ссылок
        this.elements.hearts = heartsContainer;
        this.elements.memories = memoriesContainer;
        this.elements.memoryCount = document.getElementById('memory-count');
    }

    /**
     * Обновление сердечек
     * @param {number} current
     * @param {number} max
     */
    updateHearts(current, max) {
        const container = this.elements.hearts;
        container.innerHTML = '';

        for (let i = 0; i < max; i++) {
            const heart = document.createElement('div');
            heart.className = 'heart';
            if (i >= current) {
                heart.classList.add('lost');
            }
            container.appendChild(heart);
        }
    }

    /**
     * Обновление счётчика воспоминаний
     * @param {number} current
     * @param {number} total
     */
    updateMemories(current, total) {
        if (this.elements.memoryCount) {
            this.elements.memoryCount.textContent = `${current}/${total}`;
        }
    }

    /**
     * Показ сообщения о чекпоинте
     */
    showCheckpointMessage() {
        this._showFloatingText('💕 Чекпоинт сохранён!', 'checkpoint-flash');
    }

    /**
     * Показ сообщения о сборе предмета
     * @param {string} text
     */
    showCollectMessage(text) {
        this._showFloatingText(`📷 ${text}`, 'checkpoint-flash');
    }

    /**
     * Показ всплывающего текста
     * @private
     */
    _showFloatingText(text, className) {
        const div = document.createElement('div');
        div.className = className;
        div.textContent = text;
        this.container.appendChild(div);

        setTimeout(() => {
            div.remove();
        }, 2000);
    }

    /**
     * Показ меню паузы
     */
    showPauseMenu() {
        const menu = document.createElement('div');
        menu.className = 'menu-screen';
        menu.id = 'pause-menu';
        menu.innerHTML = `
            <h2 class="menu-title">Пауза</h2>
            <button class="menu-button" id="btn-resume">Продолжить</button>
            <button class="menu-button" id="btn-restart">Начать заново</button>
            <button class="menu-button" id="btn-menu">В главное меню</button>
        `;

        this.container.appendChild(menu);

        // Обработчики
        document.getElementById('btn-resume').onclick = () => this.hidePauseMenu();
        document.getElementById('btn-restart').onclick = () => {
            if (this.onRestart) this.onRestart();
        };
        document.getElementById('btn-menu').onclick = () => {
            if (this.onMainMenu) this.onMainMenu();
        };
    }

    /**
     * Скрытие меню паузы
     */
    hidePauseMenu() {
        const menu = document.getElementById('pause-menu');
        if (menu) menu.remove();
    }

    /**
     * Показ квеста
     * @param {Object} quest
     */
    showQuest(quest) {
        this._showFloatingText(`📜 ${quest.text}`, 'checkpoint-flash');
    }

    /**
     * Показ выполнения квеста
     * @param {Object} result
     */
    showQuestComplete(result) {
        this._showFloatingText(`✅ ${result.text}`, 'checkpoint-flash');
    }

    /**
     * Показ уровня
     */
    show() {
        this.container.style.display = 'flex';
        this.visible = true;
    }

    /**
     * Скрытие UI
     */
    hide() {
        this.container.style.display = 'none';
        this.visible = false;
    }

    /**
     * Очистка UI
     */
    clear() {
        this.container.innerHTML = '';
    }

    // Колбэки
    onRestart = null;
    onMainMenu = null;
}
