/**
 * Journey to the Heart - Главный файл
 * Инициализация игры, управление сценами, игровой цикл
 */

class Game {
    constructor() {
        // Canvas
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');

        // Размеры экрана
        this.width = 800;
        this.height = 600;
        this._resize();

        // Системы
        this.assetLoader = new AssetLoader();
        this.input = new InputHandler();
        this.renderer = new Renderer(this.canvas);
        this.gameLoop = new GameLoop();
        this.levelManager = new LevelManager(this.assetLoader);

        // Сцены
        this.scenes = {};
        this.currentScene = null;

        // Инициализация
        this._initScenes();
        this._bindEvents();

        // Запуск
        this.switchScene('loading');
        this.gameLoop.start(
            (dt) => this._update(dt),
            (dt) => this._render(dt)
        );
    }

    /**
     * Инициализация сцен
     * @private
     */
    _initScenes() {
        this.scenes = {
            loading: new LoadingScene(this),
            menu: new MenuScene(this),
            game: new GameScene(this),
            cutscene: new Cutscene(this)
        };
    }

    /**
     * Привязка событий
     * @private
     */
    _bindEvents() {
        // Изменение размера окна
        window.addEventListener('resize', () => this._resize());

        // Предотвращение контекстного меню
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());
    }

    /**
     * Изменение размера canvas
     * @private
     */
    _resize() {
        const container = document.getElementById('game-container');
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        // Соотношение сторон 4:3
        const aspectRatio = 4 / 3;
        let newWidth = containerWidth;
        let newHeight = containerWidth / aspectRatio;

        if (newHeight > containerHeight) {
            newHeight = containerHeight;
            newWidth = containerHeight * aspectRatio;
        }

        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;

        if (this.renderer) {
            this.renderer.setSize(this.width, this.height);
        }
    }

    /**
     * Переключение сцены
     * @param {string} sceneName
     * @param {Object} data
     */
    switchScene(sceneName, data = {}) {
        // Выход из текущей сцены
        if (this.currentScene) {
            this.currentScene.exit();
        }

        // Вход в новую сцену
        const scene = this.scenes[sceneName];
        if (scene) {
            this.currentScene = scene;
            scene.enter(data);
        } else {
            console.error('Сцена не найдена:', sceneName);
        }
    }

    /**
     * Обновление игры
     * @private
     */
    _update(deltaTime) {
        if (this.currentScene) {
            this.currentScene.update(deltaTime);
            this.currentScene.handleInput(this.input);
        }
    }

    /**
     * Рендеринг игры
     * @private
     */
    _render(deltaTime) {
        if (this.currentScene) {
            this.currentScene.draw(this.renderer, deltaTime);
        }
    }
}

// Запуск игры при загрузке страницы
window.addEventListener('load', () => {
    window.game = new Game();
});
