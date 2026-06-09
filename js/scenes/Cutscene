/**
 * Cutscene - сцена катсцены
 * Показ диалогов, анимаций, переходов между уровнями
 */

class Cutscene extends Scene {
    constructor(game) {
        super(game);
        this.steps = [];
        this.currentStep = 0;
        this.timer = 0;
        this.active = false;
    }

    /**
     * Запуск катсцены
     * @param {Array} steps - шаги катсцены
     */
    play(steps) {
        this.steps = steps;
        this.currentStep = 0;
        this.timer = 0;
        this.active = true;
    }

    enter(data = {}) {
        super.enter();

        if (data.cutscene) {
            this.play(data.cutscene);
        }
    }

    update(deltaTime) {
        if (!this.active || this.currentStep >= this.steps.length) return;

        const step = this.steps[this.currentStep];
        this.timer += deltaTime;

        switch (step.type) {
            case 'wait':
                if (this.timer >= step.duration) {
                    this.currentStep++;
                    this.timer = 0;
                }
                break;

            case 'dialog':
                // Ожидание нажатия клавиши (обрабатывается в handleInput)
                break;

            case 'fade':
                if (this.timer >= step.duration) {
                    this.currentStep++;
                    this.timer = 0;
                }
                break;

            case 'move':
                // Движение объекта
                if (this.timer >= step.duration) {
                    this.currentStep++;
                    this.timer = 0;
                }
                break;

            case 'scene':
                // Переход к сцене
                if (step.scene) {
                    this.game.switchScene(step.scene, step.data);
                }
                break;
        }
    }

    draw(renderer, deltaTime) {
        if (!this.active || this.currentStep >= this.steps.length) return;

        const step = this.steps[this.currentStep];
        const ctx = renderer.ctx;

        switch (step.type) {
            case 'fade':
                const alpha = step.fadeIn 
                    ? this.timer / step.duration 
                    : 1 - (this.timer / step.duration);
                ctx.fillStyle = `rgba(0, 0, 0, ${alpha})`;
                ctx.fillRect(0, 0, renderer.width, renderer.height);
                break;

            case 'text':
                // Отрисовка текста на экране
                ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
                ctx.fillRect(0, 0, renderer.width, renderer.height);

                ctx.fillStyle = '#fff';
                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText(step.text, renderer.width / 2, renderer.height / 2);
                break;

            case 'image':
                // Отрисовка изображения
                if (step.image) {
                    ctx.drawImage(step.image, 0, 0, renderer.width, renderer.height);
                }
                break;
        }
    }

    handleInput(input) {
        if (!this.active) return;

        const step = this.steps[this.currentStep];

        if (step.type === 'dialog' || step.type === 'text') {
            if (input.isJustPressed('interact') || input.isJustPressed('jump')) {
                this.currentStep++;
                this.timer = 0;
            }
        }
    }

    /**
     * Создание катсцены начала игры
     * @static
     */
    static createIntroCutscene() {
        return [
            { type: 'fade', duration: 2, fadeIn: true },
            { type: 'text', text: 'ДВФУ, Владивосток...', duration: 3 },
            { type: 'wait', duration: 1 },
            { type: 'text', text: 'Здесь начинается наша история.', duration: 3 },
            { type: 'fade', duration: 2, fadeIn: false },
            { type: 'scene', scene: 'game', data: { levelId: 1 } }
        ];
    }

    /**
     * Создание финальной катсцены
     * @static
     */
    static createEndingCutscene() {
        return [
            { type: 'fade', duration: 3, fadeIn: true },
            { type: 'text', text: 'И вот мы здесь...', duration: 3 },
            { type: 'wait', duration: 1 },
            { type: 'text', text: 'После всех приключений,', duration: 2 },
            { type: 'text', text: 'после всех испытаний...', duration: 2 },
            { type: 'wait', duration: 1 },
            { type: 'text', text: 'Я хочу спросить тебя кое о чём.', duration: 3 },
            { type: 'wait', duration: 2 },
            { type: 'text', text: 'Выходи за меня?', duration: 5 },
            { type: 'fade', duration: 3, fadeIn: false },
            { type: 'text', text: 'Конец', duration: 5 },
            { type: 'scene', scene: 'menu' }
        ];
    }
}
