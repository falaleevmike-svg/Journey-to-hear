/**
 * Menu - главное меню и меню выбора уровней
 */

class Menu {
    constructor(container) {
        this.container = container || document.getElementById('ui-overlay');
        this.active = false;

        // Колбэки
        this.onStartGame = null;
        this.onSelectLevel = null;
        this.onShowAlbum = null;
        this.onShowSettings = null;
    }

    /**
     * Показ главного меню
     * @param {Object} progress - прогресс игры
     */
    showMainMenu(progress = {}) {
        this.active = true;
        this._clear();

        const menu = document.createElement('div');
        menu.className = 'menu-screen';
        menu.innerHTML = `
            <h1 class="menu-title">Путешествие к сердцу</h1>
            <p style="color: #ffb6c1; margin-bottom: 30px; font-size: 16px;">Романтический пиксельный платформер</p>
            <button class="menu-button" id="btn-start">Начать путешествие</button>
            <button class="menu-button" id="btn-levels">Выбрать уровень</button>
            <button class="menu-button" id="btn-album">Фотоальбом</button>
            <button class="menu-button" id="btn-settings">Настройки</button>
            <div style="margin-top: 40px; color: #888; font-size: 12px;">
                Прогресс: ${progress.completedLevels || 0}/${progress.totalLevels || 6} уровней
            </div>
        `;

        this.container.appendChild(menu);

        // Обработчики
        document.getElementById('btn-start').onclick = () => {
            if (this.onStartGame) this.onStartGame();
        };
        document.getElementById('btn-levels').onclick = () => this.showLevelSelect(progress);
        document.getElementById('btn-album').onclick = () => {
            if (this.onShowAlbum) this.onShowAlbum();
        };
        document.getElementById('btn-settings').onclick = () => this.showSettings();
    }

    /**
     * Показ меню выбора уровней
     * @param {Object} progress
     */
    showLevelSelect(progress = {}) {
        this._clear();

        const menu = document.createElement('div');
        menu.className = 'menu-screen';

        const levels = [
            { id: 1, name: 'ДВФУ', subtitle: 'Владивосток', locked: false },
            { id: 2, name: 'Москва', subtitle: 'Столица', locked: !progress.unlockedLevels?.includes(2) },
            { id: 3, name: 'Китай', subtitle: 'Чунцин · Чэнду · Чжанцзяцзе', locked: !progress.unlockedLevels?.includes(3) },
            { id: 4, name: 'Турция', subtitle: 'Стамбул · Олюдениз', locked: !progress.unlockedLevels?.includes(4) },
            { id: 5, name: 'Офис', subtitle: 'Рабочие будни', locked: !progress.unlockedLevels?.includes(5) },
            { id: 6, name: 'Побережье', subtitle: 'Финал', locked: !progress.unlockedLevels?.includes(6) }
        ];

        let html = '<h2 class="menu-title">Выбор уровня</h2><div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; max-width: 600px;">';

        for (const level of levels) {
            const completed = progress.completedLevels?.includes(level.id);
            const locked = level.locked;

            html += `
                <div class="level-card" data-id="${level.id}" style="
                    background: ${locked ? 'rgba(100,100,100,0.3)' : 'rgba(255,182,193,0.1)'};
                    border: 2px solid ${locked ? '#666' : completed ? '#FFD700' : '#ffb6c1'};
                    border-radius: 12px;
                    padding: 20px;
                    cursor: ${locked ? 'default' : 'pointer'};
                    transition: all 0.3s ease;
                    text-align: center;
                    opacity: ${locked ? 0.5 : 1};
                ">
                    <div style="font-size: 24px; margin-bottom: 8px;">${locked ? '🔒' : completed ? '⭐' : '📍'}</div>
                    <div style="color: ${locked ? '#888' : '#ffb6c1'}; font-weight: bold;">${level.name}</div>
                    <div style="color: #888; font-size: 12px; margin-top: 4px;">${level.subtitle}</div>
                </div>
            `;
        }

        html += '</div><button class="menu-button" id="btn-back" style="margin-top: 30px;">Назад</button>';
        menu.innerHTML = html;

        this.container.appendChild(menu);

        // Обработчики кликов по уровням
        document.querySelectorAll('.level-card').forEach(card => {
            card.onclick = () => {
                const id = parseInt(card.dataset.id);
                if (!levels.find(l => l.id === id).locked && this.onSelectLevel) {
                    this.onSelectLevel(id);
                }
            };
        });

        document.getElementById('btn-back').onclick = () => this.showMainMenu(progress);
    }

    /**
     * Показ настроек
     */
    showSettings() {
        this._clear();

        const menu = document.createElement('div');
        menu.className = 'menu-screen';
        menu.innerHTML = `
            <h2 class="menu-title">Настройки</h2>
            <div style="color: #fff; margin: 20px 0;">
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" id="setting-sound" checked> Звук
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" id="setting-music" checked> Музыка
                </label>
                <label style="display: block; margin: 10px 0;">
                    <input type="checkbox" id="setting-particles" checked> Частицы
                </label>
            </div>
            <button class="menu-button" id="btn-reset">Сбросить прогресс</button>
            <button class="menu-button" id="btn-back">Назад</button>
        `;

        this.container.appendChild(menu);

        document.getElementById('btn-reset').onclick = () => {
            if (confirm('Вы уверены? Весь прогресс будет удалён!')) {
                if (this.onResetProgress) this.onResetProgress();
            }
        };
        document.getElementById('btn-back').onclick = () => this.showMainMenu();
    }

    /**
     * Показ фотоальбома
     * @param {Array} collectedItems - собранные воспоминания
     */
    showAlbum(collectedItems = []) {
        this._clear();

        const menu = document.createElement('div');
        menu.className = 'album-screen';

        let html = '<h2 class="menu-title" style="margin-bottom: 20px;">Фотоальбом</h2>';
        html += '<div class="album-grid">';

        // Все возможные воспоминания (24 штуки)
        const allMemories = [
            { id: 'dvfu_1', title: 'Первый день', level: 1 },
            { id: 'dvfu_2', title: 'Шаттл', level: 1 },
            { id: 'dvfu_3', title: 'Вид на залив', level: 1 },
            { id: 'dvfu_4', title: 'Перед экзаменом', level: 1 },
            { id: 'dvfu_secret', title: 'Секретный вид', level: 1 },
            // ... остальные уровни
        ];

        const collectedIds = collectedItems.map(i => i.id);

        for (const memory of allMemories) {
            const collected = collectedIds.includes(memory.id);
            html += `
                <div class="album-item ${collected ? '' : 'locked'}" style="padding: 10px;">
                    <div style="font-size: 32px; margin-bottom: 8px;">${collected ? '📷' : '🔒'}</div>
                    <div style="color: ${collected ? '#fff' : '#888'}; font-size: 12px; text-align: center;">
                        ${collected ? memory.title : '???'}
                    </div>
                    <div style="color: #888; font-size: 10px; margin-top: 4px;">Уровень ${memory.level}</div>
                </div>
            `;
        }

        html += '</div>';
        html += '<button class="menu-button" id="btn-back" style="margin-top: 30px;">Назад</button>';
        menu.innerHTML = html;

        this.container.appendChild(menu);
        document.getElementById('btn-back').onclick = () => this.showMainMenu();
    }

    /**
     * Скрытие меню
     */
    hide() {
        this.active = false;
        this._clear();
    }

    /**
     * Очистка контейнера
     * @private
     */
    _clear() {
        this.container.innerHTML = '';
    }

    // Колбэки
    onResetProgress = null;
}
