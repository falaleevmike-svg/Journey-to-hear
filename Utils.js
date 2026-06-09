/**
 * Утилиты для игры "Путешествие к сердцу"
 * Общие функции, используемые во всём проекте
 */

class Utils {
    /**
     * Проверка пересечения двух прямоугольников (AABB)
     * @param {Object} rect1 - {x, y, width, height}
     * @param {Object} rect2 - {x, y, width, height}
     * @returns {boolean}
     */
    static checkRectCollision(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }

    /**
     * Проверка, находится ли точка внутри прямоугольника
     * @param {number} x
     * @param {number} y
     * @param {Object} rect - {x, y, width, height}
     * @returns {boolean}
     */
    static pointInRect(x, y, rect) {
        return x >= rect.x && x <= rect.x + rect.width &&
               y >= rect.y && y <= rect.y + rect.height;
    }

    /**
     * Линейная интерполяция
     * @param {number} start
     * @param {number} end
     * @param {number} t - значение от 0 до 1
     * @returns {number}
     */
    static lerp(start, end, t) {
        return start + (end - start) * t;
    }

    /**
     * Ограничение значения диапазоном
     * @param {number} value
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    /**
     * Случайное число в диапазоне
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static randomRange(min, max) {
        return Math.random() * (max - min) + min;
    }

    /**
     * Случайное целое число в диапазоне
     * @param {number} min
     * @param {number} max
     * @returns {number}
     */
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    /**
     * Расстояние между двумя точками
     * @param {number} x1
     * @param {number} y1
     * @param {number} x2
     * @param {number} y2
     * @returns {number}
     */
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    /**
     * Форматирование времени (секунды -> MM:SS)
     * @param {number} seconds
     * @returns {string}
     */
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    /**
     * Сохранение данных в localStorage
     * @param {string} key
     * @param {Object} data
     */
    static saveToStorage(key, data) {
        try {
            localStorage.setItem(`jth_${key}`, JSON.stringify(data));
        } catch (e) {
            console.warn('Не удалось сохранить в localStorage:', e);
        }
    }

    /**
     * Загрузка данных из localStorage
     * @param {string} key
     * @param {*} defaultValue
     * @returns {*}
     */
    static loadFromStorage(key, defaultValue = null) {
        try {
            const data = localStorage.getItem(`jth_${key}`);
            return data ? JSON.parse(data) : defaultValue;
        } catch (e) {
            console.warn('Не удалось загрузить из localStorage:', e);
            return defaultValue;
        }
    }

    /**
     * Проверка поддержки localStorage
     * @returns {boolean}
     */
    static isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }

    /**
     * Создание цвета из HEX с альфа-каналом
     * @param {string} hex
     * @param {number} alpha
     * @returns {string}
     */
    static hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Плавное появление/исчезновение (ease-in-out)
     * @param {number} t
     * @returns {number}
     */
    static easeInOut(t) {
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
    }

    /**
     * Отскок (bounce easing)
     * @param {number} t
     * @returns {number}
     */
    static easeBounce(t) {
        const n1 = 7.5625;
        const d1 = 2.75;
        if (t < 1 / d1) {
            return n1 * t * t;
        } else if (t < 2 / d1) {
            return n1 * (t -= 1.5 / d1) * t + 0.75;
        } else if (t < 2.5 / d1) {
            return n1 * (t -= 2.25 / d1) * t + 0.9375;
        } else {
            return n1 * (t -= 2.625 / d1) * t + 0.984375;
        }
    }

    /**
     * Дебаунс функция
     * @param {Function} func
     * @param {number} wait
     * @returns {Function}
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    /**
     * Создание спрайта программно (заглушка)
     * @param {number} width
     * @param {number} height
     * @param {string} color
     * @returns {HTMLCanvasElement}
     */
    static createPlaceholderSprite(width, height, color = '#ffb6c1') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
        return canvas;
    }

    /**
     * Генерация простого шума для текстур
     * @param {number} width
     * @param {number} height
     * @param {string} baseColor
     * @returns {HTMLCanvasElement}
     */
    static generateNoiseTexture(width, height, baseColor = '#4a4a6a') {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        ctx.fillStyle = baseColor;
        ctx.fillRect(0, 0, width, height);

        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const noise = (Math.random() - 0.5) * 30;
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
}
