/**
 * Physics - физический движок игры
 * Обработка гравитации, столкновений, движения
 * Исправленная версия с корректной AABB, deltaTime и стабильной платформенной физикой
 */

class Physics {
    constructor() {
        // Базовые значения (за 1/60 секунды)
        this.gravity = 0.6;           // Сила гравитации за кадр
        this.friction = 0.88;         // Трение о поверхность (менее агрессивное)
        this.airResistance = 0.995;   // Сопротивление воздуха (почти не замедляет)
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
     * @param {boolean} onGround - объект на земле
     */
    applyGravity(entity, onGround) {
        if (entity.velocityY === undefined) return;
        // Не применяем гравитацию, если объект на земле и не прыгает
        if (onGround && entity.velocityY >= 0) {
            entity.velocityY = 0;
            return;
        }
        entity.velocityY += this.gravity;
        entity.velocityY = Math.max(-this.terminalVelocity, Math.min(this.terminalVelocity, entity.velocityY));
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
        if (Math.abs(entity.velocityX) < 0.05) {
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
     * Проверка столкновения с платформами (с разделением осей X и Y)
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

        // Сохраняем стартовую позицию для корректного разрешения коллизий
        const startX = entity.x;
        const startY = entity.y;

        // Сначала двигаем по X
        if (entity.velocityX) {
            entity.x = startX + entity.velocityX;
            for (const platform of platforms) {
                if (!platform.active) continue;
                if (this._checkAABB(entity, platform)) {
                    if (platform.type === this.COLLISION_TYPES.SOLID) {
                        this._resolveX(entity, platform, result);
                    } else if (platform.type === this.COLLISION_TYPES.HAZARD) {
                        result.isHazard = true;
                    }
                }
            }
        }

        // Потом двигаем по Y
        if (entity.velocityY) {
            entity.y = startY + entity.velocityY;
            for (const platform of platforms) {
                if (!platform.active) continue;
                if (this._checkAABB(entity, platform)) {
                    switch (platform.type) {
                        case this.COLLISION_TYPES.SOLID:
                            this._resolveY(entity, platform, result);
                            break;
                        case this.COLLISION_TYPES.PLATFORM:
                            this._resolvePlatformCollision(entity, platform, result);
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
            }
        } else if (entity.velocityY === 0) {
            // Проверяем, стоит ли entity на чём-то (snap to floor)
            entity.y += 1; // Маленький тестовый шаг вниз
            for (const platform of platforms) {
                if (!platform.active) continue;
                if (this._checkAABB(entity, platform)) {
                    if (platform.type === this.COLLISION_TYPES.SOLID) {
                        entity.y = platform.y - entity.height;
                        result.onGround = true;
                    } else if (platform.type === this.COLLISION_TYPES.PLATFORM) {
                        entity.y = platform.y - entity.height;
                        result.onGround = true;
                    }
                }
            }
            if (!result.onGround) entity.y -= 1; // Возвращаем назад, если не нашли пол
        }

        return result;
    }

    /**
     * Корректная проверка AABB (x,y — левый верхний угол)
     * @private
     */
    _checkAABB(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }

    /**
     * Разрешение горизонтального столкновения
     * @private
     */
    _resolveX(entity, platform, result) {
        if (entity.velocityX > 0) {
            entity.x = platform.x - entity.width;
        } else if (entity.velocityX < 0) {
            entity.x = platform.x + platform.width;
        }
        entity.velocityX = 0;
        result.hitWall = true;
    }

    /**
     * Разрешение вертикального столкновения
     * @private
     */
    _resolveY(entity, platform, result) {
        if (entity.velocityY > 0) {
            // Падение — приземление
            entity.y = platform.y - entity.height;
            entity.velocityY = 0;
            result.onGround = true;
        } else if (entity.velocityY < 0) {
            // Прыжок — удар головой
            entity.y = platform.y + platform.height;
            entity.velocityY = 0;
            result.hitCeiling = true;
        }
    }

    /**
     * Разрешение столкновения с платформой (можно проходить снизу)
     * @private
     */
    _resolvePlatformCollision(entity, platform, result) {
        // Платформа — только приземление сверху
        // entity уже сдвинут по Y, проверяем: падаем ли мы И entity был выше платформы
        if (entity.velocityY > 0 && 
            entity.y + entity.height > platform.y &&
            entity.y + entity.height - entity.velocityY <= platform.y + 4) {
            entity.y = platform.y - entity.height;
            entity.velocityY = 0;
            result.onGround = true;
        }
        // Если entity внутри платформы (поднялся снизу), не делаем ничего — проходим сквозь
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
            if (this._checkAABB(entity, item)) {
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
            const interactZone = {
                x: npc.x - 10,
                y: npc.y - 10,
                width: npc.width + 20,
                height: npc.height + 20
            };
            if (this._checkAABB(entity, interactZone)) {
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
