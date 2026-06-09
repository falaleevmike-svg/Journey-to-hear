/**
 * Collectible - коллекционный предмет (воспоминание/фотография)
 * Собираются на уровнях, отображаются в фотоальбоме
 */

class Collectible {
    constructor(x, y, type = 'memory', options = {}) {
        this.x = x;
        this.y = y;
        this.width = 32;
        this.height = 32;
        this.type = type; // memory, coin, key, stamp
        this.collected = false;
        this.active = true;

        // Опции
        this.options = {
            id: options.id || `collectible_${Date.now()}_${Math.random()}`,
            title: options.title || 'Воспоминание',
            description: options.description || 'Приятное воспоминание из путешествия',
            image: options.image || null,
            level: options.level || 1,
            ...options
        };

        // Анимация
        this.animTimer = 0;
        this.bobOffset = 0;
        this.bobSpeed = 2;
        this.bobHeight = 8;
        this.rotation = 0;

        // Эффект свечения
        this.glowSize = 0;
        this.glowMax = 20;

        // Частицы при сборе
        this.collectParticles = {
            count: 12,
            colors: ['#FFD700', '#FF6B8A', '#FFB6C1', '#FFFFFF'],
            speed: 120,
            life: 0.6
        };
    }

    /**
     * Обновление коллекционного предмета
     * @param {number} deltaTime
     */
    update(deltaTime) {
        if (this.collected) return;

        // Плавное покачивание
        this.animTimer += deltaTime;
        this.bobOffset = Math.sin(this.animTimer * this.bobSpeed) * this.bobHeight;

        // Медленное вращение
        this.rotation += deltaTime * 0.5;

        // Пульсация свечения
        this.glowSize = Math.sin(this.animTimer * 3) * 5 + this.glowMax;
    }

    /**
     * Сбор предмета
     * @param {Renderer} renderer
     * @returns {Object} данные о собранном предмете
     */
    collect(renderer) {
        if (this.collected) return null;

        this.collected = true;
        this.active = false;

        // Создание частиц
        if (renderer) {
            renderer.createParticles(this.x + this.width / 2, this.y + this.height / 2, this.collectParticles);
            renderer.flashScreen(0.2);
        }

        return {
            id: this.options.id,
            type: this.type,
            title: this.options.title,
            description: this.options.description,
            image: this.options.image,
            level: this.options.level
        };
    }

    /**
     * Отрисовка коллекционного предмета
     * @param {Renderer} renderer
     */
    draw(renderer) {
        if (this.collected || !this.active) return;

        const drawX = this.x;
        const drawY = this.y + this.bobOffset;

        // Свечение
        renderer.ctx.save();
        renderer.ctx.globalAlpha = 0.3;
        renderer.ctx.fillStyle = '#FFD700';
        renderer.ctx.beginPath();
        renderer.ctx.arc(
            drawX + this.width / 2 - renderer.camera.x,
            drawY + this.height / 2 - renderer.camera.y,
            this.glowSize,
            0,
            Math.PI * 2
        );
        renderer.ctx.fill();
        renderer.ctx.restore();

        // Основной спрайт (фотография)
        const colors = {
            memory: '#FFD700',
            coin: '#FFA500',
            key: '#C0C0C0',
            stamp: '#FF4444'
        };

        const color = colors[this.type] || colors.memory;

        // Рамка фотографии
        renderer.drawRect(drawX, drawY, this.width, this.height, '#8B4513');
        renderer.drawRect(drawX + 2, drawY + 2, this.width - 4, this.height - 4, color);

        // Иконка внутри
        const iconSize = 16;
        const iconX = drawX + (this.width - iconSize) / 2;
        const iconY = drawY + (this.height - iconSize) / 2;

        // Рисуем простую иконку сердечка
        renderer.ctx.save();
        renderer.ctx.fillStyle = '#FF6B8A';
        renderer.ctx.translate(iconX + iconSize / 2 - renderer.camera.x, iconY + iconSize / 2 - renderer.camera.y);
        renderer.ctx.rotate(this.rotation);
        this._drawHeart(renderer.ctx, 0, 0, iconSize / 2);
        renderer.ctx.restore();
    }

    /**
     * Отрисовка сердечка
     * @private
     */
    _drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
        ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 3 / 4, x, y + size);
        ctx.bezierCurveTo(x, y + size * 3 / 4, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
        ctx.fill();
    }
}

/**
 * Checkpoint - чекпоинт (скамейка)
 * При активации сохраняет позицию и показывает милую анимацию
 */
class Checkpoint {
    constructor(x, y, options = {}) {
        this.x = x;
        this.y = y;
        this.width = 64;
        this.height = 32;
        this.activated = false;
        this.active = true;

        this.options = {
            id: options.id || `checkpoint_${Date.now()}`,
            animation: options.animation || 'hug', // hug, kiss, sit
            ...options
        };

        // Анимация активации
        this.activationTimer = 0;
        this.activationDuration = 2.0;
        this.showHearts = false;
        this.heartParticles = [];
    }

    /**
     * Активация чекпоинта
     * @param {PlayerPair} player
     * @param {Renderer} renderer
     * @param {Function} onActivate - колбэк при активации
     */
    activate(player, renderer, onActivate) {
        if (this.activated) return;

        this.activated = true;
        player.setCheckpoint(this.x, this.y - player.height);

        // Анимация отдыха
        player.playInteractAnimation(this.activationDuration);

        // Частицы сердечек
        if (renderer) {
            for (let i = 0; i < 8; i++) {
                this.heartParticles.push({
                    x: this.x + this.width / 2,
                    y: this.y - 20,
                    vx: (Math.random() - 0.5) * 60,
                    vy: -Math.random() * 80 - 40,
                    life: 1.5,
                    size: 8 + Math.random() * 8
                });
            }

            renderer.createParticles(this.x + this.width / 2, this.y, {
                count: 10,
                colors: ['#FF6B8A', '#FFB6C1', '#FFD700'],
                speed: 60,
                life: 1.0
            });
        }

        if (onActivate) onActivate(this);
    }

    /**
     * Обновление чекпоинта
     * @param {number} deltaTime
     * @param {Renderer} renderer
     */
    update(deltaTime, renderer) {
        // Обновление частиц сердечек
        for (let i = this.heartParticles.length - 1; i >= 0; i--) {
            const p = this.heartParticles[i];
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += 30 * deltaTime; // гравитация
            p.life -= deltaTime;

            if (p.life <= 0) {
                this.heartParticles.splice(i, 1);
            }
        }
    }

    /**
     * Отрисовка чекпоинта
     * @param {Renderer} renderer
     */
    draw(renderer) {
        const screenX = this.x - renderer.camera.x;
        const screenY = this.y - renderer.camera.y;

        // Скамейка
        const benchColor = this.activated ? '#8B4513' : '#654321';
        renderer.ctx.fillStyle = benchColor;
        renderer.ctx.fillRect(screenX, screenY + 8, this.width, 12); // Сиденье
        renderer.ctx.fillRect(screenX + 4, screenY + 20, 8, 12); // Ножка левая
        renderer.ctx.fillRect(screenX + this.width - 12, screenY + 20, 8, 12); // Ножка правая

        // Спинка
        renderer.ctx.fillRect(screenX, screenY, this.width, 8);

        // Индикатор активации
        if (this.activated) {
            // Маленькие сердечки
            renderer.ctx.fillStyle = '#FF6B8A';
            for (const p of this.heartParticles) {
                const alpha = Math.max(0, p.life / 1.5);
                renderer.ctx.globalAlpha = alpha;
                this._drawHeart(renderer.ctx, p.x - renderer.camera.x, p.y - renderer.camera.y, p.size);
            }
            renderer.ctx.globalAlpha = 1.0;

            // Звёздочка активации
            const starAlpha = Math.sin(Date.now() * 0.005) * 0.3 + 0.7;
            renderer.ctx.fillStyle = `rgba(255, 215, 0, ${starAlpha})`;
            renderer.ctx.font = '16px sans-serif';
            renderer.ctx.fillText('★', screenX + this.width / 2 - 8, screenY - 10);
        } else {
            // Индикатор неактивного чекпоинта
            const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
            renderer.ctx.fillStyle = `rgba(255, 255, 255, ${pulse})`;
            renderer.ctx.font = '12px sans-serif';
            renderer.ctx.fillText('💤', screenX + this.width / 2 - 6, screenY - 5);
        }
    }

    /**
     * Отрисовка сердечка
     * @private
     */
    _drawHeart(ctx, x, y, size) {
        ctx.beginPath();
        ctx.moveTo(x, y + size / 4);
        ctx.bezierCurveTo(x, y, x - size / 2, y, x - size / 2, y + size / 4);
        ctx.bezierCurveTo(x - size / 2, y + size / 2, x, y + size * 3 / 4, x, y + size);
        ctx.bezierCurveTo(x, y + size * 3 / 4, x + size / 2, y + size / 2, x + size / 2, y + size / 4);
        ctx.bezierCurveTo(x + size / 2, y, x, y, x, y + size / 4);
        ctx.fill();
    }

    /**
     * Проверка пересечения с игроком
     * @param {PlayerPair} player
     * @returns {boolean}
     */
    checkCollision(player) {
        return Utils.checkRectCollision(
            { x: player.x, y: player.y, width: player.width, height: player.height },
            { x: this.x - 10, y: this.y - 10, width: this.width + 20, height: this.height + 20 }
        );
    }
}
