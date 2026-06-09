/**
 * Physics - физический движок игры
 * Обработка гравитации, столкновений, движения
 */

class Physics {
    constructor() {
        this.gravity = 0.6;           // Сила гравитации
        this.friction = 0.85;         // Трение о поверхность
        this.airResistance = 0.98;    // Сопротивление воздуха
        this.terminalVelocity = 12;   // Максимальная скорость падения

        // Типы столкновений
        this.COLLISION_TYPES = {
            NONE: 0,
            SOLID: 1,      // Твёрдый блок
            PLATFORM: 2,   // Платформа (можно проходить снизу)
            HAZARD: 3,     // Опасность (возвращает к чекпоинту)
            INTERACTIVE: 4 // Интерактивный объект
        };
    }

    /**
     * Применение гравитации к объекту
     * @param {Object} entity - сущность с velocityY
     */
    applyGravity(entity) {
        if (entity.velocityY === undefined) return;

        entity.velocityY += this.gravity;
        entity.velocityY = Utils.clamp(entity.velocityY, -this.terminalVelocity, this.terminalVelocity);
    }

    /**
     * Применение трения
     * @param {Object} entity
     * @param {boolean} onGround - объект на земле
     */
    applyFriction(entity, onGround) {
        if (entity.velocityX === undefined) return;

        const resistance = onGround ? this.friction : this.airResistance;
        entity.velocityX *= resistance;

        // Остановка при очень малой скорости
        if (Math.abs(entity.velocityX) < 0.1) {
            entity.velocityX = 0;
        }
    }

    /**
     * Обновление позиции объекта
     * @param {Object} entity
     */
    updatePosition(entity) {
        if (entity.x === undefined || entity.y === undefined) return;

        entity.x += entity.velocityX || 0;
        entity.y += entity.velocityY || 0;
    }

    /**
     * Проверка столкновения с платформами
     * @param {Object} entity - {x, y, width, height, velocityX, velocityY}
     * @param {Array} platforms - массив платформ
     * @returns {Object} - результат столкновения
     */
    checkPlatformCollisions(entity, platforms) {
        const result = {
            onGround: false,
            hitCeiling: false,
            hitWall: false,
            collisions: []
        };

        for (const platform of platforms) {
            if (!platform.active) continue;

            const collision = this._checkCollision(entity, platform);
            if (!collision) continue;

            result.collisions.push({ platform, collision });

            switch (platform.type) {
                case this.COLLISION_TYPES.SOLID:
                    this._resolveSolidCollision(entity, platform, collision, result);
                    break;
                case this.COLLISION_TYPES.PLATFORM:
                    this._resolvePlatformCollision(entity, platform, collision, result);
                    break;
                case this.COLLISION_TYPES.HAZARD:
                    result.isHazard = true;
                    break;
                case this.COLLISION_TYPES.INTERACTIVE:
                    result.isInteractive = true;
                    result.interactiveObject = platform;
                    break;
            }
        }

        return result;
    }

    /**
     * Проверка пересечения двух прямоугольников
     * @private
     */
    _checkCollision(entity, platform) {
        const entityRect = {
            x: entity.x,
            y: entity.y,
            width: entity.width,
            height: entity.height
        };

        const platformRect = {
            x: platform.x,
            y: platform.y,
            width: platform.width,
            height: platform.height
        };

        if (!Utils.checkRectCollision(entityRect, platformRect)) {
            return null;
        }

        // Вычисление направления столкновения
        const overlapX = (entityRect.width + platformRect.width) / 2 - 
                        Math.abs((entityRect.x + entityRect.width / 2) - (platformRect.x + platformRect.width / 2));
        const overlapY = (entityRect.height + platformRect.height) / 2 - 
                        Math.abs((entityRect.y + entityRect.height / 2) - (platformRect.y + platformRect.height / 2));

        return {
            overlapX,
            overlapY,
            direction: overlapX < overlapY ? 'horizontal' : 'vertical'
        };
    }

    /**
     * Разрешение столкновения с твёрдым блоком
     * @private
     */
    _resolveSolidCollision(entity, platform, collision, result) {
        if (collision.direction === 'vertical') {
            // Вертикальное столкновение
            if (entity.y + entity.height / 2 < platform.y + platform.height / 2) {
                // Столкновение сверху (приземление)
                entity.y = platform.y - entity.height;
                entity.velocityY = 0;
                result.onGround = true;
            } else {
                // Столкновение снизу (удар головой)
                entity.y = platform.y + platform.height;
                entity.velocityY = 0;
                result.hitCeiling = true;
            }
        } else {
            // Горизонтальное столкновение
            if (entity.x + entity.width / 2 < platform.x + platform.width / 2) {
                entity.x = platform.x - entity.width;
            } else {
                entity.x = platform.x + platform.width;
            }
            entity.velocityX = 0;
            result.hitWall = true;
        }
    }

    /**
     * Разрешение столкновения с платформой (можно проходить снизу)
     * @private
     */
    _resolvePlatformCollision(entity, platform, collision, result) {
        // Платформа - только приземление сверху
        if (entity.velocityY > 0 && 
            entity.y + entity.height - entity.velocityY <= platform.y + 5) {
            entity.y = platform.y - entity.height;
            entity.velocityY = 0;
            result.onGround = true;
        }
    }

    /**
     * Проверка столкновения с коллекционными предметами
     * @param {Object} entity
     * @param {Array} collectibles
     * @returns {Array} - собранные предметы
     */
    checkCollectibleCollisions(entity, collectibles) {
        const collected = [];

        for (const item of collectibles) {
            if (item.collected) continue;

            if (Utils.checkRectCollision(
                { x: entity.x, y: entity.y, width: entity.width, height: entity.height },
                { x: item.x, y: item.y, width: item.width, height: item.height }
            )) {
                item.collected = true;
                collected.push(item);
            }
        }

        return collected;
    }

    /**
     * Проверка столкновения с NPC
     * @param {Object} entity
     * @param {Array} npcs
     * @returns {Object|null}
     */
    checkNPCCollision(entity, npcs) {
        for (const npc of npcs) {
            if (!npc.active) continue;

            // Увеличенная зона взаимодействия для NPC
            const interactZone = {
                x: npc.x - 10,
                y: npc.y - 10,
                width: npc.width + 20,
                height: npc.height + 20
            };

            if (Utils.checkRectCollision(
                { x: entity.x, y: entity.y, width: entity.width, height: entity.height },
                interactZone
            )) {
                return npc;
            }
        }
        return null;
    }

    /**
     * Проверка выхода за границы уровня
     * @param {Object} entity
     * @param {Object} bounds - {width, height}
     * @returns {Object}
     */
    checkBounds(entity, bounds) {
        const result = { outOfBounds: false };

        if (entity.y > bounds.height + 100) {
            result.outOfBounds = true;
            result.direction = 'bottom';
        }

        if (entity.x < -100 || entity.x > bounds.width + 100) {
            result.outOfBounds = true;
            result.direction = 'side';
        }

        return result;
    }

    /**
     * Применение импульса (прыжок, отталкивание)
     * @param {Object} entity
     * @param {number} forceX
     * @param {number} forceY
     */
    applyImpulse(entity, forceX, forceY) {
        entity.velocityX = (entity.velocityX || 0) + forceX;
        entity.velocityY = (entity.velocityY || 0) + forceY;
    }

    /**
     * Проверка, может ли объект прыгнуть
     * @param {Object} entity
     * @param {Object} collisionResult
     * @returns {boolean}
     */
    canJump(entity, collisionResult) {
        return collisionResult && collisionResult.onGround;
    }
}
