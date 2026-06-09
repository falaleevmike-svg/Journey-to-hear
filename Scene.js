/**
 * Scene - базовый класс игровой сцены
 * Все сцены наследуются от этого класса
 */

class Scene {
    constructor(game) {
        this.game = game;
        this.active = false;
    }

    /**
     * Вход в сцену
     */
    enter() {
        this.active = true;
    }

    /**
     * Выход из сцены
     */
    exit() {
        this.active = false;
    }

    /**
     * Обновление сцены
     * @param {number} deltaTime
     */
    update(deltaTime) {
        // Переопределяется в наследниках
    }

    /**
     * Отрисовка сцены
     * @param {Renderer} renderer
     * @param {number} deltaTime
     */
    draw(renderer, deltaTime) {
        // Переопределяется в наследниках
    }

    /**
     * Обработка ввода
     * @param {InputHandler} input
     */
    handleInput(input) {
        // Переопределяется в наследниках
    }
}
