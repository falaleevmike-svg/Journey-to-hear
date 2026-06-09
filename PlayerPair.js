/**
 * PlayerPair - игровой юнит (пара мальчик + девочка)
 * Управляется как единое целое, с анимациями взаимодействия
 */

class PlayerPair {
    constructor(x, y) {
        // Позиция и размеры (хитбокс пары)
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 64;

        // Физика
        this.velocityX = 0;
        this.velocityY = 0;
        this.speed = 200;
        this.jumpForce = -350;
        this.sprintMultiplier = 1.5;

        // Состояния
        this.state = 'idle'; // idle, run, jump, fall, interact, hurt
        this.direction = 1; // 1 - вправо, -1 - влево
        this.onGround = false;
        this.canDoubleJump = true;
        this.hasDoubleJumped = false;

        // Анимация
        this.animTimer = 0;
        this.animFrame = 0;
        this.animSpeed = 8; // кадров в секунду

        // Сердечки (жизни)
        this.hearts = 3;
        this.maxHearts = 3;
        this.invincible = false;
        this.invincibleTimer = 0;

        // Взаимодействие
        this.interactTimer = 0;
        this.interactTarget = null;

        // Чекпоинт
        this.checkpointX = x;
        this.checkpointY = y;

        // Спрайты (будут загружены AssetLoader)
        this.sprites = {};
    }

    /**
     * Загрузка спрайтов
     * @param {AssetLoader} loader
     */
    loadSprites(loader) {
        this.sprites.idle = loader.get('player_idle');
        this.sprites.run = loader.get('player_run');
        this.sprites.jump = loader.get('player_jump');
        this.sprites.fall = loader.get('player_fall');
    }

    /**
     * Обновление состояния пары
     * @param {InputHandler} input
     * @param {Physics} physics
     * @param {Object} level
     * @param {number} deltaTime
     */
    update(input, physics, level, deltaTime) {
        // Обновление неуязвимости
        if (this.invincible) {
            this.invincibleTimer -= deltaTime;
            if (this.invincibleTimer <= 0) {
                this.invincible = false;
            }
        }

        // Обновление взаимодействия
        if (this.interactTimer > 0) {
            this.interactTimer -= deltaTime;
            if (this.interactTimer <= 0) {
                this.state = 'idle';
            }
            return; // Во время взаимодействия не двигаемся
        }

        // Горизонтальное движение
        const horizontalInput = input.getHorizontalAxis();
        const sprinting = input.isPressed('sprint');
        const currentSpeed = sprinting ? this.speed * this.sprintMultiplier : this.speed;

        if (horizontalInput !== 0) {
            this.velocityX += horizontalInput * currentSpeed * deltaTime * 3;
            this.velocityX = Utils.clamp(this.velocityX, -currentSpeed, currentSpeed);
            this.direction = horizontalInput > 0 ? 1 : -1;

            if (this.onGround) {
                this.state = 'run';
            }
        } else {
            // Торможение
            physics.applyFriction(this, this.onGround);
        }

        // Прыжок
        if (input.isJustPressed('jump')) {
            if (this.onGround) {
                this.velocityY = this.jumpForce;
                this.onGround = false;
                this.state = 'jump';
                this.hasDoubleJumped = false;

                // Частицы при прыжке
                if (level.renderer) {
                    level.renderer.createParticles(this.x + this.width / 2, this.y + this.height, {
                        count: 5,
                        colors: ['#FFB6C1', '#FFD700'],
                        speed: 50,
                        life: 0.3
                    });
                }
            } else if (this.canDoubleJump && !this.hasDoubleJumped) {
                // Двойной прыжок (девочка подпрыгивает на руках мальчика)
                this.velocityY = this.jumpForce * 0.8;
                this.hasDoubleJumped = true;
                this.state = 'jump';

                // Частицы при двойном прыжке
                if (level.renderer) {
                    level.renderer.createParticles(this.x + this.width / 2, this.y + this.height, {
                        count: 8,
                        colors: ['#FF69B4', '#FFD700', '#FF6B8A'],
                        speed: 80,
                        life: 0.4
                    });
                }
            }
        }

        // Применение гравитации
        physics.applyGravity(this);

        // Обновление позиции
        physics.updatePosition(this);

        // Столкновения с платформами
        const collisionResult = physics.checkPlatformCollisions(this, level.platforms);
        this.onGround = collisionResult.onGround;

        // Обновление состояния по вертикальной скорости
        if (!this.onGround) {
            if (this.velocityY < 0) {
                this.state = 'jump';
            } else if (this.velocityY > 0) {
                this.state = 'fall';
            }
        } else if (Math.abs(this.velocityX) < 0.1) {
            this.state = 'idle';
        }

        // Сбор коллекционных предметов
        const collected = physics.checkCollectibleCollisions(this, level.collectibles);
        for (const item of collected) {
            level.onCollectible(item);
        }

        // Проверка столкновения с NPC
        const npc = physics.checkNPCCollision(this, level.npcs);
        if (npc && input.isJustPressed('interact')) {
            level.onNPCInteract(npc);
        }

        // Проверка выхода за границы
        const boundsCheck = physics.checkBounds(this, level.bounds);
        if (boundsCheck.outOfBounds) {
            this.fall(level);
        }

        // Обновление анимации
        this.updateAnimation(deltaTime);
    }

    /**
     * Обновление анимации
     * @param {number} deltaTime
     */
    updateAnimation(deltaTime) {
        this.animTimer += deltaTime;

        if (this.animTimer >= 1 / this.animSpeed) {
            this.animTimer = 0;
            this.animFrame++;

            // Количество кадров для каждого состояния
            const frameCounts = {
                idle: 4,
                run: 8,
                jump: 2,
                fall: 2,
                interact: 4,
                hurt: 2
            };

            const maxFrames = frameCounts[this.state] || 1;
            this.animFrame = this.animFrame % maxFrames;
        }
    }

    /**
     * Падение (возвращение к чекпоинту)
     * @param {Object} level
     */
    fall(level) {
        // Потеря сердечка
        this.hearts--;

        // Анимация возвращения
        this.state = 'hurt';
        this.invincible = true;
        this.invincibleTimer = 2.0;

        // Частицы
        if (level.renderer) {
            level.renderer.createParticles(this.x + this.width / 2, this.y + this.height / 2, {
                count: 15,
                colors: ['#FF6B8A', '#FFB6C1', '#FFD700'],
                speed: 100,
                life: 0.8
            });
            level.renderer.shakeScreen(5);
        }

        // Возвращение к чекпоинту
        this.x = this.checkpointX;
        this.y = this.checkpointY;
        this.velocityX = 0;
        this.velocityY = 0;

        // Если сердечки закончились - всё равно возвращаем, но с грустной анимацией
        if (this.hearts <= 0) {
            this.hearts = this.maxHearts; // Восстановление (нет game over)
        }

        // Показать сообщение о чекпоинте
        if (level.ui) {
            level.ui.showCheckpointMessage();
        }
    }

    /**
     * Установка чекпоинта
     * @param {number} x
     * @param {number} y
     */
    setCheckpoint(x, y) {
        this.checkpointX = x;
        this.checkpointY = y;
    }

    /**
     * Взаимодействие (анимация)
     * @param {number} duration
     */
    playInteractAnimation(duration = 1.0) {
        this.state = 'interact';
        this.interactTimer = duration;
        this.velocityX = 0;
    }

    /**
     * Отрисовка пары
     * @param {Renderer} renderer
     */
    draw(renderer) {
        const sprite = this.sprites[this.state] || this.sprites.idle;
        if (!sprite) return;

        // Мигание при неуязвимости
        let alpha = 1.0;
        if (this.invincible) {
            alpha = Math.sin(Date.now() * 0.01) > 0 ? 1.0 : 0.3;
        }

        renderer.drawSprite({
            image: sprite,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            flipX: this.direction === -1,
            alpha: alpha
        });

        // Отрисовка хитбокса (для отладки)
        renderer.drawHitbox(this, 'rgba(0, 255, 0, 0.2)');
    }

    /**
     * Получение центра пары
     * @returns {Object} {x, y}
     */
    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}
