/**
 * Renderer - система рендеринга игры
 * Отрисовка спрайтов, фонов, UI, частиц, parallax-эффектов
 */

class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;

        // Камера
        this.camera = {
            x: 0,
            y: 0,
            targetX: 0,
            targetY: 0,
            smoothness: 0.1
        };

        // Parallax слои
        this.parallaxLayers = [];

        // Частицы
        this.particles = [];

        // Эффекты экрана
        this.screenEffects = {
            shake: 0,
            flash: 0,
            fade: 0
        };

        // Отладка
        this.debug = false;
    }

    /**
     * Установка размера canvas
     * @param {number} width
     * @param {number} height
     */
    setSize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
    }

    /**
     * Обновление камеры (следование за целью)
     * @param {Object} target - {x, y}
     * @param {Object} levelBounds - {width, height}
     */
    updateCamera(target, levelBounds) {
        // Центрирование камеры на цели
        this.camera.targetX = target.x - this.width / 2;
        this.camera.targetY = target.y - this.height / 2;

        // Плавное следование
        this.camera.x = Utils.lerp(this.camera.x, this.camera.targetX, this.camera.smoothness);
        this.camera.y = Utils.lerp(this.camera.y, this.camera.targetY, this.camera.smoothness);

        // Ограничение границами уровня
        this.camera.x = Utils.clamp(this.camera.x, 0, Math.max(0, levelBounds.width - this.width));
        this.camera.y = Utils.clamp(this.camera.y, 0, Math.max(0, levelBounds.height - this.height));
    }

    /**
     * Начало кадра - очистка и настройка
     */
    beginFrame() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Эффект тряски экрана
        if (this.screenEffects.shake > 0) {
            const shakeX = (Math.random() - 0.5) * this.screenEffects.shake;
            const shakeY = (Math.random() - 0.5) * this.screenEffects.shake;
            this.ctx.save();
            this.ctx.translate(shakeX, shakeY);
            this.screenEffects.shake *= 0.9;
            if (this.screenEffects.shake < 0.5) this.screenEffects.shake = 0;
        }
    }

    /**
     * Конец кадра - восстановление контекста
     */
    endFrame() {
        if (this.screenEffects.shake > 0) {
            this.ctx.restore();
        }

        // Эффект вспышки
        if (this.screenEffects.flash > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.screenEffects.flash})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
            this.screenEffects.flash *= 0.9;
            if (this.screenEffects.flash < 0.01) this.screenEffects.flash = 0;
        }

        // Эффект затемнения
        if (this.screenEffects.fade > 0) {
            this.ctx.fillStyle = `rgba(0, 0, 0, ${this.screenEffects.fade})`;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }
    }

    /**
     * Отрисовка parallax-фона
     * @param {Array} layers - массив слоёв [{image, speed, y}]
     */
    drawParallaxBackground(layers) {
        for (const layer of layers) {
            if (!layer.image) continue;

            const parallaxX = this.camera.x * layer.speed;
            const parallaxY = this.camera.y * layer.speed * 0.3;

            // Повторяющийся фон
            const imgWidth = layer.image.width || this.width;
            const imgHeight = layer.image.height || this.height;

            const offsetX = -(parallaxX % imgWidth);
            const offsetY = layer.y || 0;

            // Рисуем несколько копий для бесшовного скроллинга
            for (let x = offsetX - imgWidth; x < this.width + imgWidth; x += imgWidth) {
                this.ctx.drawImage(layer.image, x, offsetY - parallaxY, imgWidth, imgHeight);
            }
        }
    }

    /**
     * Отрисовка спрайта
     * @param {Object} sprite - {image, x, y, width, height, flipX, flipY, rotation, alpha}
     */
    drawSprite(sprite) {
        if (!sprite.image) return;

        const x = sprite.x - this.camera.x;
        const y = sprite.y - this.camera.y;

        this.ctx.save();

        // Прозрачность
        if (sprite.alpha !== undefined) {
            this.ctx.globalAlpha = sprite.alpha;
        }

        // Поворот
        if (sprite.rotation) {
            this.ctx.translate(x + sprite.width / 2, y + sprite.height / 2);
            this.ctx.rotate(sprite.rotation);
            this.ctx.translate(-sprite.width / 2, -sprite.height / 2);
        } else {
            this.ctx.translate(x, y);
        }

        // Отражение
        if (sprite.flipX) {
            this.ctx.translate(sprite.width, 0);
            this.ctx.scale(-1, 1);
        }

        if (sprite.flipY) {
            this.ctx.translate(0, sprite.height);
            this.ctx.scale(1, -1);
        }

        // Отрисовка
        this.ctx.drawImage(sprite.image, 0, 0, sprite.width, sprite.height);

        this.ctx.restore();
    }

    /**
     * Отрисовка прямоугольника
     * @param {number} x
     * @param {number} y
     * @param {number} width
     * @param {number} height
     * @param {string} color
     * @param {boolean} fill
     */
    drawRect(x, y, width, height, color, fill = true) {
        const screenX = x - this.camera.x;
        const screenY = y - this.camera.y;

        this.ctx.fillStyle = color;
        if (fill) {
            this.ctx.fillRect(screenX, screenY, width, height);
        } else {
            this.ctx.strokeStyle = color;
            this.ctx.strokeRect(screenX, screenY, width, height);
        }
    }

    /**
     * Отрисовка текста
     * @param {string} text
     * @param {number} x
     * @param {number} y
     * @param {Object} options - {font, color, align, baseline, shadow}
     */
    drawText(text, x, y, options = {}) {
        const screenX = x - this.camera.x;
        const screenY = y - this.camera.y;

        this.ctx.save();
        this.ctx.font = options.font || '16px sans-serif';
        this.ctx.fillStyle = options.color || '#ffffff';
        this.ctx.textAlign = options.align || 'left';
        this.ctx.textBaseline = options.baseline || 'top';

        if (options.shadow) {
            this.ctx.shadowColor = options.shadow.color || 'rgba(0,0,0,0.5)';
            this.ctx.shadowBlur = options.shadow.blur || 4;
            this.ctx.shadowOffsetX = options.shadow.offsetX || 2;
            this.ctx.shadowOffsetY = options.shadow.offsetY || 2;
        }

        this.ctx.fillText(text, screenX, screenY);
        this.ctx.restore();
    }

    /**
     * Отрисовка частиц
     * @param {number} deltaTime
     */
    updateAndDrawParticles(deltaTime) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];

            // Обновление
            p.x += p.vx * deltaTime;
            p.y += p.vy * deltaTime;
            p.vy += p.gravity * deltaTime;
            p.life -= deltaTime;
            p.size *= p.shrink;

            if (p.life <= 0 || p.size < 0.5) {
                this.particles.splice(i, 1);
                continue;
            }

            // Отрисовка
            const screenX = p.x - this.camera.x;
            const screenY = p.y - this.camera.y;

            this.ctx.save();
            this.ctx.globalAlpha = p.life / p.maxLife;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(screenX, screenY, p.size, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.restore();
        }
    }

    /**
     * Создание частиц
     * @param {number} x
     * @param {number} y
     * @param {Object} options
     */
    createParticles(x, y, options = {}) {
        const count = options.count || 10;
        const colors = options.colors || ['#FFD700', '#FF6B8A', '#FFB6C1'];

        for (let i = 0; i < count; i++) {
            this.particles.push({
                x: x + (Math.random() - 0.5) * (options.spread || 20),
                y: y + (Math.random() - 0.5) * (options.spread || 20),
                vx: (Math.random() - 0.5) * (options.speed || 100),
                vy: (Math.random() - 0.5) * (options.speed || 100) - 50,
                gravity: options.gravity || 100,
                life: options.life || 1.0,
                maxLife: options.life || 1.0,
                size: options.size || 4,
                shrink: options.shrink || 0.98,
                color: colors[Math.floor(Math.random() * colors.length)]
            });
        }
    }

    /**
     * Эффект тряски экрана
     * @param {number} intensity
     */
    shakeScreen(intensity) {
        this.screenEffects.shake = intensity;
    }

    /**
     * Эффект вспышки
     * @param {number} intensity
     */
    flashScreen(intensity) {
        this.screenEffects.flash = intensity;
    }

    /**
     * Эффект затемнения
     * @param {number} alpha
     */
    fadeScreen(alpha) {
        this.screenEffects.fade = alpha;
    }

    /**
     * Отрисовка сетки (для отладки)
     * @param {number} cellSize
     */
    drawGrid(cellSize = 32) {
        if (!this.debug) return;

        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const startX = Math.floor(this.camera.x / cellSize) * cellSize;
        const startY = Math.floor(this.camera.y / cellSize) * cellSize;

        for (let x = startX; x < this.camera.x + this.width; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x - this.camera.x, 0);
            this.ctx.lineTo(x - this.camera.x, this.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < this.camera.y + this.height; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y - this.camera.y);
            this.ctx.lineTo(this.width, y - this.camera.y);
            this.ctx.stroke();
        }
    }

    /**
     * Отрисовка хитбокса (для отладки)
     * @param {Object} entity - {x, y, width, height}
     * @param {string} color
     */
    drawHitbox(entity, color = 'rgba(255, 0, 0, 0.3)') {
        if (!this.debug) return;
        this.drawRect(entity.x, entity.y, entity.width, entity.height, color);
    }
}
