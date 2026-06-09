/**
 * LevelManager - управление уровнями игры
 * Загрузка, переключение, сохранение прогресса
 */

import { LEVEL1_DVFU } from './data/level1_dvfu.js';
class LevelManager {
    constructor(assetLoader) {
        this.assetLoader = assetLoader;
        this.levels = new Map();
        this.currentLevel = null;
        this.currentLevelId = null;

        // Доступные уровни
        this.levelData = {
            1: LEVEL1_DVFU,
            // 2: LEVEL2_MOSCOW,
            // 3: LEVEL3_CHINA,
            // 4: LEVEL4_TURKEY,
            // 5: LEVEL5_OFFICE,
            // 6: LEVEL6_BEACH
        };

        // Прогресс
        this.progress = {
            unlockedLevels: [1],
            completedLevels: [],
            collectedItems: {},
            totalItems: {}
        };

        // Загрузка сохранённого прогресса
        this._loadProgress();
    }

    /**
     * Загрузка прогресса из localStorage
     * @private
     */
    _loadProgress() {
        const saved = Utils.loadFromStorage('progress');
        if (saved) {
            this.progress = { ...this.progress, ...saved };
        }
    }

    /**
     * Сохранение прогресса
     */
    saveProgress() {
        Utils.saveToStorage('progress', this.progress);
    }

    /**
     * Загрузка уровня
     * @param {number} levelId
     * @returns {Level|null}
     */
    loadLevel(levelId) {
        const data = this.levelData[levelId];
        if (!data) {
            console.error(`Уровень ${levelId} не найден`);
            return null;
        }

        // Проверка, разблокирован ли уровень
        if (!this.isLevelUnlocked(levelId)) {
            console.warn(`Уровень ${levelId} заблокирован`);
            return null;
        }

        // Создание уровня
        const level = new Level(data, this.assetLoader);

        // Загрузка сохранённого состояния
        const savedState = Utils.loadFromStorage(`level_${levelId}`);
        if (savedState) {
            level.loadState(savedState);
        }

        // Установка колбэков
        level.onCollectible = (item) => this._onCollectible(levelId, item);
        level.onCheckpoint = (cp) => this._onCheckpoint(levelId, cp);
        level.onLevelComplete = (nextLevelId) => this._onLevelComplete(levelId, nextLevelId);
        level.onNPCInteract = (npc, result) => this._onNPCInteract(levelId, npc, result);

        this.currentLevel = level;
        this.currentLevelId = levelId;

        return level;
    }

    /**
     * Проверка, разблокирован ли уровень
     * @param {number} levelId
     * @returns {boolean}
     */
    isLevelUnlocked(levelId) {
        return this.progress.unlockedLevels.includes(levelId);
    }

    /**
     * Проверка, пройден ли уровень
     * @param {number} levelId
     * @returns {boolean}
     */
    isLevelCompleted(levelId) {
        return this.progress.completedLevels.includes(levelId);
    }

    /**
     * Получение прогресса уровня
     * @param {number} levelId
     * @returns {Object}
     */
    getLevelProgress(levelId) {
        return {
            collected: this.progress.collectedItems[levelId] || 0,
            total: this.progress.totalItems[levelId] || 0,
            completed: this.isLevelCompleted(levelId)
        };
    }

    /**
     * Обработка сбора предмета
     * @private
     */
    _onCollectible(levelId, item) {
        // Сохранение собранного предмета
        if (!this.progress.collectedItems[levelId]) {
            this.progress.collectedItems[levelId] = [];
        }
        this.progress.collectedItems[levelId].push(item.id);

        this.saveProgress();

        console.log(`Собрано: ${item.title}`);
    }

    /**
     * Обработка активации чекпоинта
     * @private
     */
    _onCheckpoint(levelId, checkpoint) {
        // Сохранение состояния уровня
        if (this.currentLevel) {
            const state = this.currentLevel.saveState();
            Utils.saveToStorage(`level_${levelId}`, state);
        }

        console.log('Чекпоинт активирован:', checkpoint.options?.id);
    }

    /**
     * Обработка прохождения уровня
     * @private
     */
    _onLevelComplete(levelId, nextLevelId) {
        // Отметка уровня как пройденного
        if (!this.progress.completedLevels.includes(levelId)) {
            this.progress.completedLevels.push(levelId);
        }

        // Разблокировка следующего уровня
        if (nextLevelId && !this.progress.unlockedLevels.includes(nextLevelId)) {
            this.progress.unlockedLevels.push(nextLevelId);
        }

        // Сохранение
        this.saveProgress();

        console.log(`Уровень ${levelId} пройден!`);

        // Переход к следующему уровню (или меню)
        if (nextLevelId) {
            // Событие для сцены
            if (this.onLevelComplete) {
                this.onLevelComplete(nextLevelId);
            }
        }
    }

    /**
     * Обработка взаимодействия с NPC
     * @private
     */
    _onNPCInteract(levelId, npc, result) {
        console.log('Взаимодействие с NPC:', npc.options.name, result);
    }

    /**
     * Перезапуск текущего уровня
     * @returns {Level|null}
     */
    restartLevel() {
        if (this.currentLevelId) {
            // Удаление сохранённого состояния
            localStorage.removeItem(`jth_level_${this.currentLevelId}`);
            return this.loadLevel(this.currentLevelId);
        }
        return null;
    }

    /**
     * Получение общего прогресса игры
     * @returns {Object}
     */
    getOverallProgress() {
        const totalLevels = Object.keys(this.levelData).length;
        const completedLevels = this.progress.completedLevels.length;
        const totalCollectibles = Object.values(this.progress.collectedItems).flat().length;

        return {
            totalLevels,
            completedLevels,
            completionPercentage: (completedLevels / totalLevels) * 100,
            totalCollectibles,
            unlockedLevels: this.progress.unlockedLevels
        };
    }

    /**
     * Сброс всего прогресса
     */
    resetAllProgress() {
        this.progress = {
            unlockedLevels: [1],
            completedLevels: [],
            collectedItems: {},
            totalItems: {}
        };

        // Очистка localStorage
        for (let i = 1; i <= 6; i++) {
            localStorage.removeItem(`jth_level_${i}`);
        }

        this.saveProgress();
    }
}
