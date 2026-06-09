/**
 * LoadingScene - сцена загрузки ресурсов
 */

class LoadingScene extends Scene {
    constructor(game) {
        super(game);
        this.progress = 0;
        this.loadingText = 'Загрузка...';
    }

    enter() {
        super.enter();
        this.progress = 0;

        // Создание загрузочного экрана
        const container = document.getElementById('ui-overlay');
        container.innerHTML = `
            <div class="loading-screen" id="loading-screen">
                <div class="loading-text" id="loading-text">Загрузка...</div>
                <div class="loading-bar">
                    <div class="loading-progress" id="loading-progress"></div>
                </div>
                <div style="color: #888; margin-top: 10px; font-size: 12px;" id="loading-detail">Инициализация...</div>
            </div>
        `;

        // Начало загрузки ассетов
        this._loadAssets();
    }

    /**
     * Загрузка ассетов
     * @private
     */
    async _loadAssets() {
        const loader = this.game.assetLoader;

        loader.onProgress = (progress, loaded, total) => {
            this.progress = progress;
            this._updateUI(progress, loaded, total);
        };

        loader.onComplete = () => {
            setTimeout(() => {
                this.game.switchScene('menu');
            }, 500);
        };

        // Создание заглушек для спрайтов
        loader.createPlaceholderAssets();

        // Имитация загрузки
        loader.total = 10;
        for (let i = 0; i < 10; i++) {
            await new Promise(r => setTimeout(r, 200));
            loader.loaded = i + 1;
            loader.onProgress(loader.loaded / loader.total, loader.loaded, loader.total);
        }

        // ВАЖНО: вызываем onComplete после завершения цикла
        if (loader.onComplete) {
            loader.onComplete();
        }
    }

    /**
     * Обновление UI загрузки
     * @private
     */
    _updateUI(progress, loaded, total) {
        const progressBar = document.getElementById('loading-progress');
        const detail = document.getElementById('loading-detail');

        if (progressBar) {
            progressBar.style.width = `${progress * 100}%`;
        }

        if (detail) {
            const texts = [
                'Загрузка спрайтов...',
                'Загрузка звуков...',
                'Загрузка музыки...',
                'Подготовка уровней...',
                'Инициализация физики...',
                'Почти готово...'
            ];
            const textIndex = Math.floor(progress * texts.length);
            detail.textContent = texts[Math.min(textIndex, texts.length - 1)];
        }
    }

    exit() {
        super.exit();
        const container = document.getElementById('ui-overlay');
        container.innerHTML = '';
    }

    update(deltaTime) {
        // Анимация загрузочного экрана
    }

    draw(renderer, deltaTime) {
        // Очистка canvas
        renderer.ctx.fillStyle = '#0f0f23';
        renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);
    }
}
