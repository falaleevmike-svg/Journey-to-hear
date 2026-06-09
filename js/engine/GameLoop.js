/**
 * GameLoop - главный игровой цикл
 * Управление обновлением, рендерингом, дельта-временем
 */

class GameLoop {
    constructor() {
        this.running = false;
        this.paused = false;
        this.lastTime = 0;
        this.deltaTime = 0;
        this.fixedDeltaTime = 1 / 60; // 60 FPS
        this.accumulator = 0;
        this.maxDeltaTime = 0.1; // Максимальное deltaTime (защита от лагов)

        this.updateCallback = null;
        this.renderCallback = null;

        this.fps = 0;
        this.fpsCounter = 0;
        this.fpsTimer = 0;

        this.animationFrameId = null;
    }

    /**
     * Запуск игрового цикла
     * @param {Function} update - функция обновления (deltaTime)
     * @param {Function} render - функция рендеринга (deltaTime)
     */
    start(update, render) {
        this.updateCallback = update;
        this.renderCallback = render;
        this.running = true;
        this.lastTime = performance.now();
        this._loop();
    }

    /**
     * Остановка игрового цикла
     */
    stop() {
        this.running = false;
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }
    }

    /**
     * Пауза/возобновление
     */
    togglePause() {
        this.paused = !this.paused;
        if (!this.paused) {
            this.lastTime = performance.now();
        }
    }

    /**
     * Главный цикл
     * @private
     */
    _loop() {
        if (!this.running) return;

        this.animationFrameId = requestAnimationFrame((time) => {
            this._loop();
            this._tick(time);
        });
    }

    /**
     * Обработка кадра
     * @private
     */
    _tick(time) {
        // Вычисление deltaTime
        this.deltaTime = (time - this.lastTime) / 1000;
        this.lastTime = time;

        // Защита от слишком большого deltaTime
        this.deltaTime = Math.min(this.deltaTime, this.maxDeltaTime);

        // Подсчёт FPS
        this.fpsCounter++;
        this.fpsTimer += this.deltaTime;
        if (this.fpsTimer >= 1.0) {
            this.fps = this.fpsCounter;
            this.fpsCounter = 0;
            this.fpsTimer = 0;
        }

        // Обновление и рендеринг
        if (!this.paused) {
            // Фиксированный шаг для физики (несколько итераций при низком FPS)
            this.accumulator += this.deltaTime;
            while (this.accumulator >= this.fixedDeltaTime) {
                if (this.updateCallback) {
                    this.updateCallback(this.fixedDeltaTime);
                }
                this.accumulator -= this.fixedDeltaTime;
            }

            // Рендеринг с интерполяцией
            if (this.renderCallback) {
                this.renderCallback(this.deltaTime);
            }
        }
    }

    /**
     * Получение текущего FPS
     * @returns {number}
     */
    getFPS() {
        return this.fps;
    }

    /**
     * Получение deltaTime
     * @returns {number}
     */
    getDeltaTime() {
        return this.deltaTime;
    }
}
