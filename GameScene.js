/**
 * GameScene - сцена игрового процесса
 */

class GameScene extends Scene {
    constructor(game) {
        super(game);
        this.level = null;
        this.ui = null;
        this.physics = null;
    }

    enter(data = {}) {
        super.enter();

        const levelId = data.levelId || 1;

        // Загрузка уровня
        this.level = this.game.levelManager.loadLevel(levelId);

        if (!this.level) {
            console.error('Не удалось загрузить уровень:', levelId);
            this.game.switchScene('menu');
            return;
        }

        // Инициализация систем
        this.physics = new Physics();
        this.ui = new UIManager();

        // Связь уровня с UI
        this.level.ui = this.ui;
        this.level.renderer = this.game.renderer;
        this.level.physics = this.physics;

        // Колбэки UI
        this.ui.onRestart = () => {
            this.game.switchScene('game', { levelId });
        };

        this.ui.onMainMenu = () => {
            this.game.switchScene('menu');
        };

        // Показ UI
        this.ui.show();
        this.ui.updateHearts(this.level.player.hearts, this.level.player.maxHearts);
        this.ui.updateMemories(0, this.level.collectibles.length);
    }

    exit() {
        super.exit();

        // Сохранение состояния
        if (this.level) {
            const state = this.level.saveState();
            Utils.saveToStorage(`level_${this.level.data.id}`, state);
        }

        // Скрытие UI
        if (this.ui) {
            this.ui.hide();
        }
    }

    update(deltaTime) {
        if (!this.level || !this.active) return;

        // Обработка паузы
        if (this.game.input.isJustPressed('pause')) {
            this.game.gameLoop.togglePause();

            if (this.game.gameLoop.paused) {
                this.ui.showPauseMenu();
            } else {
                this.ui.hidePauseMenu();
            }
        }

        // Обновление уровня (только если не на паузе)
        if (!this.game.gameLoop.paused) {
            this.level.update(this.game.input, this.physics, deltaTime);

            // Обновление UI
            this.ui.updateHearts(this.level.player.hearts, this.level.player.maxHearts);
            this.ui.updateMemories(
                this.level.collectedItems.length,
                this.level.collectibles.length
            );
        }

        // Проверка завершения уровня
        if (this.level.completed) {
            this._showLevelComplete();
        }
    }

    /**
     * Показ экрана завершения уровня
     * @private
     */
    _showLevelComplete() {
        const progress = this.level.getProgress();

        const div = document.createElement('div');
        div.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 35, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 200;
        `;

        div.innerHTML = `
            <h2 style="color: #FFD700; font-size: 36px; margin-bottom: 20px;">⭐ Уровень пройден! ⭐</h2>
            <p style="color: #fff; font-size: 18px; margin-bottom: 10px;">${this.level.data.name}</p>
            <p style="color: #ffb6c1; margin-bottom: 30px;">Собрано воспоминаний: ${progress.collected}/${progress.totalCollectibles}</p>
            <button class="menu-button" id="btn-next-level">Следующий уровень</button>
            <button class="menu-button" id="btn-menu-complete">В меню</button>
        `;

        document.body.appendChild(div);

        document.getElementById('btn-next-level').onclick = () => {
            div.remove();
            const nextId = this.level.data.id + 1;
            if (nextId <= 6) {
                this.game.switchScene('game', { levelId: nextId });
            } else {
                this.game.switchScene('menu');
            }
        };

        document.getElementById('btn-menu-complete').onclick = () => {
            div.remove();
            this.game.switchScene('menu');
        };
    }

    draw(renderer, deltaTime) {
        if (!this.level) return;

        // Начало кадра
        renderer.beginFrame();

        // Отрисовка уровня
        this.level.draw(renderer, deltaTime);

        // Конец кадра
        renderer.endFrame();
    }

    handleInput(input) {
        // Дополнительная обработка ввода
    }
}
