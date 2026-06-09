/**
 * Obstacle - игровые препятствия и интерактивные объекты
 * Чайки, учебники, шаттл, панды, обезьяны и т.д.
 */

class Obstacle {
    constructor(x, y, type, options = {}) {
        this.x = x;
        this.y = y;
        this.width = options.width || 32;
        this.height = options.height || 32;
        this.type = type; // seagull, book, shuttle, panda, monkey, etc.
        this.active = true;

        // Опции
        this.options = {
            speed: options.speed || 50,
            moveRange: options.moveRange || 100,
            damage: options.damage || false, // наносит ли урон
            pushForce: options.pushForce || 0, // отталкивает ли
            ...options
        };

        // Движение
        this.startX = x;
        this.startY = y;
        this.moveTimer = Math.random() * Math.PI * 2;
        this.moveDirection = 1;

        // Анимация
        this.animFrame = 0;
        this.animTimer = 0;

        // Состояние
        this.state = 'idle'; // idle, move, attack
    }

    /**
     * Обновление препятствия
     * @param {number} deltaTime
     * @param {PlayerPair} player
     */
    update(deltaTime, player) {
        if (!this.active) return;

        this.moveTimer += deltaTime;

        switch (this.type) {
            case 'seagull':
                this._updateSeagull(deltaTime);
                break;
            case 'book':
                this._updateBook(deltaTime);
                break;
            case 'shuttle':
                this._updateShuttle(deltaTime);
                break;
            case 'panda':
                this._updatePanda(deltaTime, player);
                break;
            case 'monkey':
                this._updateMonkey(deltaTime, player);
                break;
            case 'colleague':
                this._updateColleague(deltaTime);
                break;
            case 'printer':
                this._updatePrinter(deltaTime);
                break;
            default:
                this._updateDefault(deltaTime);
        }

        // Обновление анимации
        this.animTimer += deltaTime;
        if (this.animTimer >= 0.2) {
            this.animTimer = 0;
            this.animFrame = (this.animFrame + 1) % 4;
        }
    }

    /**
     * Обновление чайки (летает по синусоиде)
     * @private
     */
    _updateSeagull(deltaTime) {
        this.x = this.startX + Math.sin(this.moveTimer * 0.5) * this.options.moveRange;
        this.y = this.startY + Math.sin(this.moveTimer * 1.5) * 20;
    }

    /**
     * Обновление учебника (падает и исчезает)
     * @private
     */
    _updateBook(deltaTime) {
        this.y += this.options.speed * deltaTime;

        // Исчезновение при падении
        if (this.y > this.startY + 300) {
            this.active = false;
        }
    }

    /**
     * Обновление шаттла (движется по маршруту)
     * @private
     */
    _updateShuttle(deltaTime) {
        this.x += this.options.speed * this.moveDirection * deltaTime;

        if (Math.abs(this.x - this.startX) > this.options.moveRange) {
            this.moveDirection *= -1;
        }
    }

    /**
     * Обновление панды (катится как мяч)
     * @private
     */
    _updatePanda(deltaTime, player) {
        // Случайное движение
        if (Math.random() < 0.01) {
            this.moveDirection = Math.random() > 0.5 ? 1 : -1;
        }

        this.x += this.options.speed * this.moveDirection * deltaTime;

        // Ограничение диапазона
        if (Math.abs(this.x - this.startX) > this.options.moveRange) {
            this.moveDirection *= -1;
        }

        // Вращение
        this.rotation = (this.x - this.startX) * 0.1;
    }

    /**
     * Обновление обезьяны (крадёт предметы, лазает по лианам)
     * @private
     */
    _updateMonkey(deltaTime, player) {
        // Движение по лиане (синусоида)
        this.x = this.startX + Math.sin(this.moveTimer * 0.8) * this.options.moveRange;
        this.y = this.startY + Math.abs(Math.sin(this.moveTimer * 0.8)) * 50;

        // Если игрок близко - убегает
        const dist = Utils.distance(this.x, this.y, player.x, player.y);
        if (dist < 100) {
            this.x += (this.x - player.x) * deltaTime * 2;
        }
    }

    /**
     * Обновление сонного коллеги
     * @private
     */
    _updateColleague(deltaTime) {
        // Коллега спит, иногда храпит (визуальный эффект)
        this.bobOffset = Math.sin(this.moveTimer * 2) * 2;
    }

    /**
     * Обновление принтера (периодически "съедает" документы)
     * @private
     */
    _updatePrinter(deltaTime) {
        // Принтер не двигается, но имеет анимацию
        if (Math.random() < 0.005) {
            // Запуск анимации "съедания"
            this.state = 'eating';
            this.eatTimer = 1.0;
        }

        if (this.state === 'eating') {
            this.eatTimer -= deltaTime;
            if (this.eatTimer <= 0) {
                this.state = 'idle';
            }
        }
    }

    /**
     * Обновление по умолчанию
     * @private
     */
    _updateDefault(deltaTime) {
        // Простое покачивание
        this.y = this.startY + Math.sin(this.moveTimer) * 5;
    }

    /**
     * Проверка столкновения с игроком
     * @param {PlayerPair} player
     * @returns {Object|null}
     */
    checkCollision(player) {
        if (!this.active) return null;

        const hitbox = {
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height
        };

        if (Utils.checkRectCollision(
            { x: player.x, y: player.y, width: player.width, height: player.height },
            hitbox
        )) {
            return {
                type: this.type,
                damage: this.options.damage,
                pushForce: this.options.pushForce
            };
        }

        return null;
    }

    /**
     * Отрисовка препятствия
     * @param {Renderer} renderer
     */
    draw(renderer) {
        if (!this.active) return;

        const drawX = this.x;
        const drawY = this.y + (this.bobOffset || 0);

        // Цвета и формы для разных типов
        switch (this.type) {
            case 'seagull':
                this._drawSeagull(renderer, drawX, drawY);
                break;
            case 'book':
                this._drawBook(renderer, drawX, drawY);
                break;
            case 'shuttle':
                this._drawShuttle(renderer, drawX, drawY);
                break;
            case 'panda':
                this._drawPanda(renderer, drawX, drawY);
                break;
            case 'monkey':
                this._drawMonkey(renderer, drawX, drawY);
                break;
            case 'colleague':
                this._drawColleague(renderer, drawX, drawY);
                break;
            case 'printer':
                this._drawPrinter(renderer, drawX, drawY);
                break;
            default:
                renderer.drawRect(drawX, drawY, this.width, this.height, '#888888');
        }
    }

    /**
     * Отрисовка чайки
     * @private
     */
    _drawSeagull(renderer, x, y) {
        // Тело
        renderer.drawRect(x + 8, y + 12, 24, 12, '#FFFFFF');
        // Крылья
        const wingY = y + 8 + Math.sin(this.moveTimer * 10) * 4;
        renderer.drawRect(x, wingY, 12, 6, '#E0E0E0');
        renderer.drawRect(x + 28, wingY, 12, 6, '#E0E0E0');
        // Клюв
        renderer.drawRect(x + 30, y + 14, 6, 4, '#FFA500');
    }

    /**
     * Отрисовка учебника
     * @private
     */
    _drawBook(renderer, x, y) {
        // Обложка
        renderer.drawRect(x, y, this.width, this.height, '#4169E1');
        // Страницы
        renderer.drawRect(x + 4, y + 4, this.width - 8, this.height - 8, '#FFFFFF');
        // Текст (линии)
        renderer.drawRect(x + 8, y + 10, this.width - 16, 2, '#333333');
        renderer.drawRect(x + 8, y + 16, this.width - 16, 2, '#333333');
        renderer.drawRect(x + 8, y + 22, this.width - 16, 2, '#333333');
    }

    /**
     * Отрисовка шаттла
     * @private
     */
    _drawShuttle(renderer, x, y) {
        // Белый шаттл ДВФУ
        renderer.drawRect(x, y + 8, this.width, this.height - 16, '#FFFFFF');
        // Окна
        renderer.drawRect(x + 8, y + 12, 8, 8, '#87CEEB');
        renderer.drawRect(x + 24, y + 12, 8, 8, '#87CEEB');
        // Колёса
        renderer.drawRect(x + 6, y + this.height - 8, 8, 8, '#333333');
        renderer.drawRect(x + this.width - 14, y + this.height - 8, 8, 8, '#333333');
        // Надпись ДВФУ
        renderer.ctx.fillStyle = '#0066CC';
        renderer.ctx.font = '8px sans-serif';
        renderer.ctx.fillText('ДВФУ', x + 4 - renderer.camera.x, y + 26 - renderer.camera.y);
    }

    /**
     * Отрисовка панды
     * @private
     */
    _drawPanda(renderer, x, y) {
        // Тело (белый круг)
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + this.width / 2 - renderer.camera.x, y + this.height / 2 - renderer.camera.y, this.width / 2, 0, Math.PI * 2);
        renderer.ctx.fill();

        // Уши и лапы (чёрные)
        renderer.ctx.fillStyle = '#000000';
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + 8 - renderer.camera.x, y + 8 - renderer.camera.y, 6, 0, Math.PI * 2);
        renderer.ctx.fill();
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + this.width - 8 - renderer.camera.x, y + 8 - renderer.camera.y, 6, 0, Math.PI * 2);
        renderer.ctx.fill();

        // Глаза (чёрные круги с белыми зрачками)
        renderer.ctx.fillStyle = '#000000';
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + 12 - renderer.camera.x, y + 16 - renderer.camera.y, 5, 0, Math.PI * 2);
        renderer.ctx.fill();
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + this.width - 12 - renderer.camera.x, y + 16 - renderer.camera.y, 5, 0, Math.PI * 2);
        renderer.ctx.fill();

        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + 14 - renderer.camera.x, y + 14 - renderer.camera.y, 2, 0, Math.PI * 2);
        renderer.ctx.fill();
        renderer.ctx.beginPath();
        renderer.ctx.arc(x + this.width - 10 - renderer.camera.x, y + 14 - renderer.camera.y, 2, 0, Math.PI * 2);
        renderer.ctx.fill();
    }

    /**
     * Отрисовка обезьяны
     * @private
     */
    _drawMonkey(renderer, x, y) {
        // Тело (коричневый)
        renderer.drawRect(x + 8, y + 12, 24, 24, '#8B4513');
        // Голова
        renderer.drawRect(x + 12, y + 4, 16, 16, '#8B4513');
        // Лицо
        renderer.drawRect(x + 14, y + 8, 12, 10, '#D2691E');
        // Глаза
        renderer.drawRect(x + 16, y + 10, 3, 3, '#000000');
        renderer.drawRect(x + 23, y + 10, 3, 3, '#000000');
        // Хвост
        const tailX = x + Math.sin(this.moveTimer * 3) * 10;
        renderer.drawRect(tailX + this.width, y + 16, 12, 4, '#8B4513');
    }

    /**
     * Отрисовка коллеги
     * @private
     */
    _drawColleague(renderer, x, y) {
        // Тело (спит за столом)
        renderer.drawRect(x, y + 16, this.width, this.height - 16, '#4169E1');
        // Голова (наклонена)
        renderer.drawRect(x + 12, y + 8, 24, 20, '#FFDAB9');
        // Zzz
        if (Math.sin(this.moveTimer * 2) > 0) {
            renderer.ctx.fillStyle = '#FFFFFF';
            renderer.ctx.font = '12px sans-serif';
            renderer.ctx.fillText('Zzz', x + this.width - renderer.camera.x, y - renderer.camera.y);
        }
    }

    /**
     * Отрисовка принтера
     * @private
     */
    _drawPrinter(renderer, x, y) {
        // Корпус
        renderer.drawRect(x, y, this.width, this.height, '#808080');
        // Лоток
        renderer.drawRect(x + 4, y + 4, this.width - 8, 8, '#A9A9A9');
        // Индикатор
        const indicatorColor = this.state === 'eating' ? '#FF0000' : '#00FF00';
        renderer.drawRect(x + this.width - 12, y + 4, 8, 8, indicatorColor);

        // Анимация "съедания"
        if (this.state === 'eating') {
            renderer.drawRect(x + 8, y + 20, this.width - 16, 4, '#FFFFFF');
        }
    }
}

/**
 * TriggerZone - зона триггера (для событий, катсцен, переходов)
 */
class TriggerZone {
    constructor(x, y, width, height, type, options = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // cutscene, level_end, dialog, teleport
        this.active = true;
        this.triggered = false;

        this.options = {
            oneTime: options.oneTime !== false, // по умолчанию одноразовый
            data: options.data || null,
            ...options
        };
    }

    /**
     * Проверка входа игрока в зону
     * @param {PlayerPair} player
     * @returns {boolean}
     */
    checkTrigger(player) {
        if (!this.active || (this.triggered && this.options.oneTime)) return false;

        if (Utils.checkRectCollision(
            { x: player.x, y: player.y, width: player.width, height: player.height },
            { x: this.x, y: this.y, width: this.width, height: this.height }
        )) {
            this.triggered = true;
            return true;
        }

        return false;
    }

    /**
     * Отрисовка (для отладки)
     * @param {Renderer} renderer
     */
    draw(renderer) {
        if (!renderer.debug) return;

        const colors = {
            cutscene: 'rgba(255, 255, 0, 0.3)',
            level_end: 'rgba(0, 255, 0, 0.3)',
            dialog: 'rgba(0, 0, 255, 0.3)',
            teleport: 'rgba(255, 0, 255, 0.3)'
        };

        renderer.drawRect(this.x, this.y, this.width, this.height, colors[this.type] || 'rgba(255, 255, 255, 0.3)');
    }
}
