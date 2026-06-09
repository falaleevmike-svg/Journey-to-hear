/**
 * Platform - игровая платформа/тайл
 * Различные типы: твёрдые блоки, платформы, опасности, интерактивные
 */

class Platform {
    constructor(x, y, width, height, type = 'solid', options = {}) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.type = type; // solid, platform, hazard, interactive, moving
        this.active = true;

        // Опции
        this.options = {
            color: '#5a5a7a',
            texture: null,
            visible: true,
            ...options
        };

        // Для движущихся платформ
        if (type === 'moving') {
            this.movePath = options.movePath || []; // [{x, y, duration}]
            this.moveIndex = 0;
            this.moveTimer = 0;
            this.moveSpeed = options.moveSpeed || 1;
            this.startX = x;
            this.startY = y;
        }

        // Для ломающихся платформ
        if (type === 'breakable') {
            this.breakTimer = 0;
            this.breakDelay = options.breakDelay || 1.0;
            this.breaking = false;
            this.respawnTime = options.respawnTime || 3.0;
            this.respawnTimer = 0;
        }

        // Для пружинящих платформ
        if (type === 'spring') {
            this.bounceForce = options.bounceForce || -500;
        }

        // Анимация
        this.animOffset = Math.random() * Math.PI * 2;
    }

    /**
     * Обновление платформы
     * @param {number} deltaTime
     * @param {PlayerPair} player
     */
    update(deltaTime, player) {
        // Движущиеся платформы
        if (this.type === 'moving' && this.movePath.length > 0) {
            this._updateMoving(deltaTime);
        }

        // Ломающиеся платформы
        if (this.type === 'breakable') {
            this._updateBreakable(deltaTime, player);
        }
    }

    /**
     * Обновление движущейся платформы
     * @private
     */
    _updateMoving(deltaTime) {
        if (this.movePath.length === 0) return;

        const currentTarget = this.movePath[this.moveIndex];
        const nextIndex = (this.moveIndex + 1) % this.movePath.length;
        const nextTarget = this.movePath[nextIndex];

        this.moveTimer += deltaTime * this.moveSpeed;

        const t = Utils.clamp(this.moveTimer / currentTarget.duration, 0, 1);
        const easedT = Utils.easeInOut(t);

        this.x = Utils.lerp(currentTarget.x, nextTarget.x, easedT);
        this.y = Utils.lerp(currentTarget.y, nextTarget.y, easedT);

        if (t >= 1) {
            this.moveIndex = nextIndex;
            this.moveTimer = 0;
        }
    }

    /**
     * Обновление ломающейся платформы
     * @private
     */
    _updateBreakable(deltaTime, player) {
        // Проверка, стоит ли игрок на платформе
        const playerOnPlatform = player.onGround && 
            Utils.checkRectCollision(
                { x: player.x, y: player.y, width: player.width, height: player.height },
                { x: this.x, y: this.y - 2, width: this.width, height: 4 }
            );

        if (playerOnPlatform && !this.breaking) {
            this.breaking = true;
        }

        if (this.breaking) {
            this.breakTimer += deltaTime;

            if (this.breakTimer >= this.breakDelay) {
                this.active = false;
                this.breaking = false;
                this.breakTimer = 0;
            }
        }

        // Возрождение
        if (!this.active) {
            this.respawnTimer += deltaTime;
            if (this.respawnTimer >= this.respawnTime) {
                this.active = true;
                this.respawnTimer = 0;
            }
        }
    }

    /**
     * Получение типа столкновения для физики
     * @returns {number}
     */
    getCollisionType() {
        if (!this.active) return 0; // NONE

        switch (this.type) {
            case 'solid': return 1; // SOLID
            case 'platform': return 2; // PLATFORM
            case 'hazard': return 3; // HAZARD
            case 'interactive': return 4; // INTERACTIVE
            case 'moving': return 1; // SOLID
            case 'breakable': return this.breaking ? 2 : 1;
            case 'spring': return 1; // SOLID, но с особой обработкой
            default: return 1;
        }
    }

    /**
     * Отрисовка платформы
     * @param {Renderer} renderer
     */
    draw(renderer) {
        if (!this.active || !this.options.visible) return;

        const colors = {
            solid: this.options.color || '#5a5a7a',
            platform: this.options.color || '#7a7a9a',
            hazard: '#ff4444',
            interactive: '#44ff44',
            moving: '#ffaa44',
            breakable: '#cc8844',
            spring: '#44aaff'
        };

        let color = colors[this.type] || colors.solid;

        // Анимация трещин для ломающейся платформы
        if (this.type === 'breakable' && this.breaking) {
            const shake = Math.sin(this.breakTimer * 20) * 2;
            color = `rgb(${200 + shake * 10}, ${100 + shake * 5}, 50)`;
        }

        // Пульсация для интерактивных
        if (this.type === 'interactive') {
            const pulse = Math.sin(Date.now() * 0.003 + this.animOffset) * 0.2 + 0.8;
            color = Utils.hexToRgba('#44ff44', pulse);
        }

        renderer.drawRect(this.x, this.y, this.width, this.height, color);

        // Детали для разных типов
        if (this.type === 'platform') {
            // Полоска сверху
            renderer.drawRect(this.x, this.y, this.width, 4, '#9a9aba');
        }

        if (this.type === 'spring') {
            // Пружина
            renderer.drawRect(this.x + this.width / 2 - 4, this.y, 8, this.height, '#FFD700');
        }

        if (this.type === 'moving') {
            // Стрелки направления
            const arrowY = this.y + this.height / 2 - 4;
            renderer.drawRect(this.x + 4, arrowY, 8, 8, '#ffffff');
            renderer.drawRect(this.x + this.width - 12, arrowY, 8, 8, '#ffffff');
        }
    }
}

/**
 * TileMap - система тайлов для уровня
 * Оптимизированная отрисовка через grid
 */
class TileMap {
    constructor(tileSize = 32) {
        this.tileSize = tileSize;
        this.tiles = new Map(); // key: "x,y", value: Platform
        this.platforms = []; // Массив для быстрой итерации
    }

    /**
     * Добавление тайла
     * @param {number} gridX
     * @param {number} gridY
     * @param {string} type
     * @param {Object} options
     */
    addTile(gridX, gridY, type = 'solid', options = {}) {
        const x = gridX * this.tileSize;
        const y = gridY * this.tileSize;
        const platform = new Platform(x, y, this.tileSize, this.tileSize, type, options);

        this.tiles.set(`${gridX},${gridY}`, platform);
        this.platforms.push(platform);

        return platform;
    }

    /**
     * Получение тайла по координатам сетки
     * @param {number} gridX
     * @param {number} gridY
     * @returns {Platform|null}
     */
    getTile(gridX, gridY) {
        return this.tiles.get(`${gridX},${gridY}`) || null;
    }

    /**
     * Удаление тайла
     * @param {number} gridX
     * @param {number} gridY
     */
    removeTile(gridX, gridY) {
        const key = `${gridX},${gridY}`;
        const platform = this.tiles.get(key);
        if (platform) {
            this.tiles.delete(key);
            const index = this.platforms.indexOf(platform);
            if (index > -1) this.platforms.splice(index, 1);
        }
    }

    /**
     * Получение платформ в области видимости камеры
     * @param {Object} camera - {x, y, width, height}
     * @returns {Array}
     */
    getVisiblePlatforms(camera) {
        const visible = [];
        const startX = Math.floor(camera.x / this.tileSize) - 1;
        const startY = Math.floor(camera.y / this.tileSize) - 1;
        const endX = Math.ceil((camera.x + camera.width) / this.tileSize) + 1;
        const endY = Math.ceil((camera.y + camera.height) / this.tileSize) + 1;

        for (let x = startX; x <= endX; x++) {
            for (let y = startY; y <= endY; y++) {
                const tile = this.tiles.get(`${x},${y}`);
                if (tile && tile.active) {
                    visible.push(tile);
                }
            }
        }

        return visible;
    }

    /**
     * Загрузка тайлов из массива
     * @param {Array} data - массив строк или чисел, где каждый элемент - тип тайла
     * @param {number} width - ширина уровня в тайлах
     */
    loadFromArray(data, width) {
        this.tiles.clear();
        this.platforms = [];

        const typeMap = {
            0: null,        // Пусто
            1: 'solid',     // Твёрдый блок
            2: 'platform',  // Платформа
            3: 'hazard',    // Опасность
            4: 'interactive', // Интерактивный
            5: 'moving',    // Движущийся
            6: 'breakable', // Ломающийся
            7: 'spring'     // Пружина
        };

        for (let i = 0; i < data.length; i++) {
            const gridX = i % width;
            const gridY = Math.floor(i / width);
            const type = typeMap[data[i]];

            if (type) {
                this.addTile(gridX, gridY, type);
            }
        }
    }

    /**
     * Отрисовка видимых тайлов
     * @param {Renderer} renderer
     * @param {Object} camera
     */
    draw(renderer, camera) {
        const visible = this.getVisiblePlatforms(camera);
        for (const platform of visible) {
            platform.draw(renderer);
        }
    }

    /**
     * Обновление всех тайлов
     * @param {number} deltaTime
     * @param {PlayerPair} player
     */
    update(deltaTime, player) {
        for (const platform of this.platforms) {
            platform.update(deltaTime, player);
        }
    }
}
