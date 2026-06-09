/**
 * AssetLoader - загрузчик игровых ассетов
 * Поддерживает спрайты, аудио, данные уровней
 * Загрузка выполняется асинхронно с отслеживанием прогресса
 */

class AssetLoader {
    constructor() {
        this.assets = new Map();
        this.loaded = 0;
        this.total = 0;
        this.onProgress = null;
        this.onComplete = null;
    }

    /**
     * Загрузка изображения
     * @param {string} key - ключ для доступа к ассету
     * @param {string} src - URL изображения
     * @returns {Promise<HTMLImageElement>}
     */
    loadImage(key, src) {
        this.total++;
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.assets.set(key, img);
                this.loaded++;
                this._updateProgress();
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Не удалось загрузить изображение: ${src}`);
                // Создаём заглушку
                const placeholder = Utils.createPlaceholderSprite(32, 32);
                this.assets.set(key, placeholder);
                this.loaded++;
                this._updateProgress();
                resolve(placeholder);
            };
            img.src = src;
        });
    }

    /**
     * Загрузка аудио
     * @param {string} key
     * @param {string} src
     * @returns {Promise<HTMLAudioElement>}
     */
    loadAudio(key, src) {
        this.total++;
        return new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.assets.set(key, audio);
                this.loaded++;
                this._updateProgress();
                resolve(audio);
            };
            audio.onerror = () => {
                console.warn(`Не удалось загрузить аудио: ${src}`);
                this.loaded++;
                this._updateProgress();
                resolve(null);
            };
            audio.src = src;
            audio.load();
        });
    }

    /**
     * Загрузка JSON данных
     * @param {string} key
     * @param {string} src
     * @returns {Promise<Object>}
     */
    async loadJSON(key, src) {
        this.total++;
        try {
            const response = await fetch(src);
            const data = await response.json();
            this.assets.set(key, data);
            this.loaded++;
            this._updateProgress();
            return data;
        } catch (e) {
            console.warn(`Не удалось загрузить JSON: ${src}`);
            this.loaded++;
            this._updateProgress();
            return null;
        }
    }

    /**
     * Создание программного спрайта (заглушка)
     * @param {string} key
     * @param {number} width
     * @param {number} height
     * @param {string} color
     */
    createSprite(key, width, height, color) {
        const sprite = Utils.createPlaceholderSprite(width, height, color);
        this.assets.set(key, sprite);
    }

    /**
     * Получение загруженного ассета
     * @param {string} key
     * @returns {*}
     */
    get(key) {
        return this.assets.get(key);
    }

    /**
     * Проверка, загружен ли ассет
     * @param {string} key
     * @returns {boolean}
     */
    has(key) {
        return this.assets.has(key);
    }

    /**
     * Обновление прогресса загрузки
     * @private
     */
    _updateProgress() {
        const progress = this.total > 0 ? (this.loaded / this.total) : 0;
        if (this.onProgress) {
            this.onProgress(progress, this.loaded, this.total);
        }
        if (this.loaded >= this.total && this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Сброс загрузчика
     */
    reset() {
        this.loaded = 0;
        this.total = 0;
    }

    /**
     * Создание всех необходимых заглушек для спрайтов
     * Вызывается при отсутствии реальных ассетов
     */
    createPlaceholderAssets() {
        // Спрайты персонажей
        this.createSprite('player_idle', 64, 64, '#8B4513');
        this.createSprite('player_run', 64, 64, '#A0522D');
        this.createSprite('player_jump', 64, 64, '#CD853F');
        this.createSprite('player_fall', 64, 64, '#D2691E');

        // Тайлы
        this.createSprite('tile_ground', 32, 32, '#5a5a7a');
        this.createSprite('tile_platform', 32, 32, '#7a7a9a');
        this.createSprite('tile_wall', 32, 32, '#4a4a6a');
        this.createSprite('tile_roof', 32, 32, '#6a6a8a');

        // Коллекционные предметы
        this.createSprite('memory_photo', 32, 32, '#FFD700');
        this.createSprite('checkpoint', 48, 48, '#FF69B4');

        // NPC и объекты
        this.createSprite('npc_kireev', 48, 64, '#808080');
        this.createSprite('npc_babka', 48, 64, '#8B4513');
        this.createSprite('obstacle_shuttle', 64, 32, '#FFFFFF');
        this.createSprite('obstacle_book', 32, 32, '#4169E1');
        this.createSprite('obstacle_seagull', 32, 32, '#FFFFFF');

        // UI
        this.createSprite('ui_heart', 32, 32, '#FF6B8A');
        this.createSprite('ui_heart_empty', 32, 32, '#666666');

        // Фоны
        this.createSprite('bg_dvfu_sky', 800, 600, '#87CEEB');
        this.createSprite('bg_dvfu_buildings', 800, 300, '#4682B4');
        this.createSprite('bg_dvfu_sea', 800, 200, '#1E90FF');
    }
}
