/**
 * Level - базовый класс игрового уровня
 * Управление объектами, коллизиями, прогрессом
 */

class Level {
    constructor(data, assetLoader) {
        this.data = data;
        this.assetLoader = assetLoader;

        // Размеры
        this.width = data.width || 3200;
        this.height = data.height || 1200;
        this.bounds = { width: this.width, height: this.height };

        // Игровые объекты
        this.platforms = [];
        this.collectibles = [];
        this.checkpoints = [];
        this.npcs = [];
        this.obstacles = [];
        this.triggers = [];

        // Тайловая карта
        this.tileMap = new TileMap(data.tileMap?.tileSize || 32);

        // Игрок
        this.player = null;

        // Состояние уровня
        this.collectedItems = [];
        this.completed = false;
        this.dialogueSystem = new DialogueSystem();

        // Parallax
        this.parallaxLayers = [];

        // Ссылки на внешние системы (устанавливаются позже)
        this.renderer = null;
        this.ui = null;
        this.physics = null;

        // Колбэки
        this.onCollectible = null;
        this.onNPCInteract = null;
        this.onLevelComplete = null;
        this.onCheckpoint = null;

        // Инициализация
        this._init();
    }

    /**
     * Инициализация уровня
     * @private
     */
    _init() {
        // Загрузка тайловой карты
        if (this.data.tileMap && this.data.tileMap.data) {
            this.tileMap.loadFromArray(
                this.data.tileMap.data.flat(),
                this.data.tileMap.data[0]?.length || 100
            );
        }

        // Добавление платформ из тайлов
        for (const platform of this.tileMap.platforms) {
            this.platforms.push(platform);
        }

        // Дополнительные платформы
        if (this.data.platforms) {
            for (const p of this.data.platforms) {
                const platform = new Platform(p.x, p.y, p.width, p.height, p.type, p.options || {});
                this.platforms.push(platform);
            }
        }

        // Коллекционные предметы
        if (this.data.collectibles) {
            for (const c of this.data.collectibles) {
                const collectible = new Collectible(c.x, c.y, c.type, c.options || {});
                this.collectibles.push(collectible);
            }
        }

        // Чекпоинты
        if (this.data.checkpoints) {
            for (const cp of this.data.checkpoints) {
                const checkpoint = new Checkpoint(cp.x, cp.y, cp.options || {});
                this.checkpoints.push(checkpoint);
            }
        }

        // NPC
        if (this.data.npcs) {
            for (const n of this.data.npcs) {
                const npc = new NPC(n.x, n.y, n.type, n.options || {});
                this.npcs.push(npc);
            }
        }

        // Препятствия
        if (this.data.obstacles) {
            for (const o of this.data.obstacles) {
                const obstacle = new Obstacle(o.x, o.y, o.type, o.options || {});
                this.obstacles.push(obstacle);
            }
        }

        // Триггеры
        if (this.data.triggers) {
            for (const t of this.data.triggers) {
                const trigger = new TriggerZone(t.x, t.y, t.width, t.height, t.type, t.options || {});
                this.triggers.push(trigger);
            }
        }

        // Скрытая зона
        if (this.data.secretArea) {
            const sa = this.data.secretArea;
            if (sa.collectible) {
                const secret = new Collectible(
                    sa.collectible.x, 
                    sa.collectible.y, 
                    sa.collectible.type, 
                    sa.collectible.options || {}
                );
                this.collectibles.push(secret);
            }
        }

        // Parallax слои
        if (this.data.parallax) {
            for (const layer of this.data.parallax) {
                this.parallaxLayers.push({
                    speed: layer.speed,
                    image: this.assetLoader.get(`bg_${this.data.id}_${layer.speed}`) || null,
                    y: layer.y || 0,
                    color: layer.color || '#000000'
                });
            }
        }

        // Создание игрока
        const startPos = this.data.playerStart || { x: 100, y: 100 };
        this.player = new PlayerPair(startPos.x, startPos.y);
        this.player.loadSprites(this.assetLoader);
    }

    /**
     * Обновление уровня
     * @param {InputHandler} input
     * @param {Physics} physics
     * @param {number} deltaTime
     */
    update(input, physics, deltaTime) {
        if (!this.player || this.dialogueSystem.active) return;

        // Обновление игрока
        this.player.update(input, physics, this, deltaTime);

        // Обновление платформ
        for (const platform of this.platforms) {
            platform.update(deltaTime, this.player);
        }

        // Обновление коллекционных предметов
        for (const item of this.collectibles) {
            item.update(deltaTime);
        }

        // Обновление чекпоинтов
        for (const cp of this.checkpoints) {
            cp.update(deltaTime, this.renderer);

            // Проверка активации
            if (!cp.activated && cp.checkCollision(this.player)) {
                cp.activate(this.player, this.renderer, (checkpoint) => {
                    if (this.onCheckpoint) this.onCheckpoint(checkpoint);
                });
            }
        }

        // Обновление NPC
        for (const npc of this.npcs) {
            npc.update(deltaTime, this.player);
        }

        // Обновление препятствий
        for (const obstacle of this.obstacles) {
            obstacle.update(deltaTime, this.player);

            // Проверка столкновения
            const collision = obstacle.checkCollision(this.player);
            if (collision && collision.damage && !this.player.invincible) {
                this.player.fall(this);
            }
        }

        // Обновление триггеров
        for (const trigger of this.triggers) {
            trigger.draw(this.renderer); // для отладки

            if (trigger.checkTrigger(this.player)) {
                this._handleTrigger(trigger);
            }
        }

        // Обновление диалоговой системы
        this.dialogueSystem.update(input);

        // Обновление камеры
        if (this.renderer) {
            this.renderer.updateCamera(this.player.getCenter(), this.bounds);
        }
    }

    /**
     * Обработка триггера
     * @private
     */
    _handleTrigger(trigger) {
        switch (trigger.type) {
            case 'level_end':
                this.completed = true;
                if (this.onLevelComplete) {
                    this.onLevelComplete(trigger.options?.nextLevel);
                }
                break;
            case 'cutscene':
                // Запуск катсцены
                break;
            case 'dialog':
                // Запуск диалога
                break;
            case 'teleport':
                // Телепортация
                if (trigger.options?.destination) {
                    this.player.x = trigger.options.destination.x;
                    this.player.y = trigger.options.destination.y;
                }
                break;
        }
    }

    /**
     * Обработка сбора предмета
     * @param {Collectible} item
     */
    onCollectible(item) {
        const data = item.collect(this.renderer);
        if (data) {
            this.collectedItems.push(data);
            if (this.onCollectible) {
                this.onCollectible(data);
            }
        }
    }

    /**
     * Обработка взаимодействия с NPC
     * @param {NPC} npc
     */
    onNPCInteract(npc) {
        const result = npc.interact(this.player, this.ui);

        if (result) {
            switch (result.type) {
                case 'dialogue':
                    this.dialogueSystem.startDialogue(result, () => {
                        // Диалог завершён
                    });
                    break;
                case 'minigame':
                    // Запуск мини-игры
                    this._startMinigame(result.game);
                    break;
                case 'quest':
                    // Показ квеста
                    if (this.ui) {
                        this.ui.showQuest(result);
                    }
                    break;
                case 'quest_complete':
                    // Квест выполнен
                    if (this.ui) {
                        this.ui.showQuestComplete(result);
                    }
                    break;
            }

            if (this.onNPCInteract) {
                this.onNPCInteract(npc, result);
            }
        }
    }

    /**
     * Запуск мини-игры
     * @private
     */
    _startMinigame(game) {
        // Заглушка для мини-игры
        console.log('Мини-игра:', game);

        // Пример: мини-игра с Киреевым
        if (game.type === 'exam') {
            // Создание билетов и мелков
            // ...
        }
    }

    /**
     * Отрисовка уровня
     * @param {Renderer} renderer
     * @param {number} deltaTime
     */
    draw(renderer, deltaTime) {
        this.renderer = renderer;

        // Parallax фон
        renderer.drawParallaxBackground(this.parallaxLayers);

        // Фоновый цвет (если нет parallax)
        if (this.data.colors && this.data.colors.sky) {
            renderer.ctx.fillStyle = this.data.colors.sky;
            renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);
        }

        // Платформы
        for (const platform of this.platforms) {
            platform.draw(renderer);
        }

        // Тайловая карта
        this.tileMap.draw(renderer, renderer.camera);

        // Чекпоинты
        for (const cp of this.checkpoints) {
            cp.draw(renderer);
        }

        // Коллекционные предметы
        for (const item of this.collectibles) {
            item.draw(renderer);
        }

        // NPC
        for (const npc of this.npcs) {
            npc.draw(renderer);
        }

        // Препятствия
        for (const obstacle of this.obstacles) {
            obstacle.draw(renderer);
        }

        // Триггеры (для отладки)
        for (const trigger of this.triggers) {
            trigger.draw(renderer);
        }

        // Игрок
        if (this.player) {
            this.player.draw(renderer);
        }

        // Частицы
        renderer.updateAndDrawParticles(deltaTime);

        // Диалог
        this.dialogueSystem.draw(renderer, renderer.width, renderer.height);

        // Сетка (отладка)
        renderer.drawGrid();
    }

    /**
     * Получение прогресса уровня
     * @returns {Object}
     */
    getProgress() {
        return {
            levelId: this.data.id,
            collected: this.collectedItems.length,
            totalCollectibles: this.collectibles.length,
            completed: this.completed,
            items: this.collectedItems
        };
    }

    /**
     * Сохранение состояния
     * @returns {Object}
     */
    saveState() {
        return {
            levelId: this.data.id,
            playerX: this.player.x,
            playerY: this.player.y,
            checkpointX: this.player.checkpointX,
            checkpointY: this.player.checkpointY,
            collectedIds: this.collectedItems.map(i => i.id),
            hearts: this.player.hearts,
            completed: this.completed
        };
    }

    /**
     * Загрузка состояния
     * @param {Object} state
     */
    loadState(state) {
        if (state.checkpointX && state.checkpointY) {
            this.player.setCheckpoint(state.checkpointX, state.checkpointY);
            this.player.x = state.checkpointX;
            this.player.y = state.checkpointY;
        }

        if (state.hearts) {
            this.player.hearts = state.hearts;
        }

        if (state.collectedIds) {
            for (const id of state.collectedIds) {
                const item = this.collectibles.find(c => c.options.id === id);
                if (item) {
                    item.collected = true;
                    item.active = false;
                }
            }
        }

        this.completed = state.completed || false;
    }
}
