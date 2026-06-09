/**
 * InputHandler - обработка пользовательского ввода
 * Поддержка клавиатуры и тач-управления для мобильных устройств
 */

class InputHandler {
    constructor() {
        this.keys = {};
        this.keysPressed = {}; // Одноразовое нажатие
        this.keysReleased = {}; // Одноразовый отпуск

        // Настройки управления
        this.keyMap = {
            left: ['ArrowLeft', 'KeyA', 'a'],
            right: ['ArrowRight', 'KeyD', 'd'],
            up: ['ArrowUp', 'KeyW', 'w'],
            down: ['ArrowDown', 'KeyS', 's'],
            jump: ['Space', 'KeyW', 'w', 'ArrowUp'],
            interact: ['KeyE', 'e'],
            sprint: ['ShiftLeft', 'ShiftRight', 'Shift'],
            pause: ['Escape', 'KeyP', 'p']
        };

        // Тач-управление
        this.touch = {
            active: false,
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            joystick: { x: 0, y: 0 }
        };

        this._bindEvents();
    }

    /**
     * Привязка событий ввода
     * @private
     */
    _bindEvents() {
        // Клавиатура
        window.addEventListener('keydown', (e) => {
            // Предотвращаем скроллинг и другие стандартные действия только для игровых клавиш
            const gameKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyE', 'Escape', 'KeyP', 'ShiftLeft', 'ShiftRight'];
            if (gameKeys.includes(e.code)) {
                e.preventDefault();
            }
            this.keys[e.code] = true;
            this.keys[e.key.toLowerCase()] = true;
            if (!this.keysPressed[e.code]) {
                this.keysPressed[e.code] = true;
            }
        });

        window.addEventListener('keyup', (e) => {
            this.keys[e.code] = false;
            this.keys[e.key.toLowerCase()] = false;
            this.keysReleased[e.code] = true;
            delete this.keysPressed[e.code];
        });

        // Тач-события для мобильных
        const canvas = document.getElementById('game-canvas');
        if (canvas) {
            canvas.addEventListener('touchstart', (e) => this._handleTouchStart(e), { passive: false });
            canvas.addEventListener('touchmove', (e) => this._handleTouchMove(e), { passive: false });
            canvas.addEventListener('touchend', (e) => this._handleTouchEnd(e), { passive: false });
        }
    }

    /**
     * Обработка начала тача
     * @private
     */
    _handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touch.active = true;
        this.touch.startX = touch.clientX;
        this.touch.startY = touch.clientY;
        this.touch.currentX = touch.clientX;
        this.touch.currentY = touch.clientY;
    }

    /**
     * Обработка движения тача
     * @private
     */
    _handleTouchMove(e) {
        e.preventDefault();
        if (!this.touch.active) return;

        const touch = e.touches[0];
        this.touch.currentX = touch.clientX;
        this.touch.currentY = touch.clientY;

        // Вычисление смещения джойстика
        const dx = this.touch.currentX - this.touch.startX;
        const dy = this.touch.currentY - this.touch.startY;
        const maxDist = 60;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > maxDist) {
            const angle = Math.atan2(dy, dx);
            this.touch.joystick.x = Math.cos(angle) * maxDist;
            this.touch.joystick.y = Math.sin(angle) * maxDist;
        } else {
            this.touch.joystick.x = dx;
            this.touch.joystick.y = dy;
        }
    }

    /**
     * Обработка окончания тача
     * @private
     */
    _handleTouchEnd(e) {
        e.preventDefault();
        this.touch.active = false;
        this.touch.joystick.x = 0;
        this.touch.joystick.y = 0;
    }

    /**
     * Проверка, нажата ли клавиша действия
     * @param {string} action - название действия (left, right, jump, etc.)
     * @returns {boolean}
     */
    isPressed(action) {
        const mappedKeys = this.keyMap[action];
        if (!mappedKeys) return false;

        // Проверка клавиатуры
        for (const key of mappedKeys) {
            if (this.keys[key]) return true;
        }

        // Проверка тач-управления
        if (this.touch.active) {
            switch (action) {
                case 'left': return this.touch.joystick.x < -20;
                case 'right': return this.touch.joystick.x > 20;
                case 'up': return this.touch.joystick.y < -20;
                case 'down': return this.touch.joystick.y > 20;
                case 'jump': return this.touch.joystick.y < -40;
            }
        }

        return false;
    }

    /**
     * Проверка одноразового нажатия (срабатывает один раз за нажатие)
     * @param {string} action
     * @returns {boolean}
     */
    isJustPressed(action) {
        const mappedKeys = this.keyMap[action];
        if (!mappedKeys) return false;

        for (const key of mappedKeys) {
            if (this.keysPressed[key]) {
                delete this.keysPressed[key];
                return true;
            }
        }
        return false;
    }

    /**
     * Проверка отпускания клавиши
     * @param {string} action
     * @returns {boolean}
     */
    isReleased(action) {
        const mappedKeys = this.keyMap[action];
        if (!mappedKeys) return false;

        for (const key of mappedKeys) {
            if (this.keysReleased[key]) {
                delete this.keysReleased[key];
                return true;
            }
        }
        return false;
    }

    /**
     * Получение оси горизонтального ввода (-1..1)
     * @returns {number}
     */
    getHorizontalAxis() {
        let value = 0;
        if (this.isPressed('left')) value -= 1;
        if (this.isPressed('right')) value += 1;

        // Тач-джойстик
        if (this.touch.active && Math.abs(this.touch.joystick.x) > 20) {
            value = Utils.clamp(this.touch.joystick.x / 60, -1, 1);
        }

        return value;
    }

    /**
     * Получение оси вертикального ввода (-1..1)
     * @returns {number}
     */
    getVerticalAxis() {
        let value = 0;
        if (this.isPressed('up')) value -= 1;
        if (this.isPressed('down')) value += 1;

        if (this.touch.active && Math.abs(this.touch.joystick.y) > 20) {
            value = Utils.clamp(this.touch.joystick.y / 60, -1, 1);
        }

        return value;
    }

    /**
     * Сброс состояния ввода
     */
    reset() {
        this.keysPressed = {};
        this.keysReleased = {};
    }

    /**
     * Отключение ввода (например, во время катсцен)
     */
    disable() {
        this.keys = {};
        this.keysPressed = {};
        this.keysReleased = {};
    }
}
