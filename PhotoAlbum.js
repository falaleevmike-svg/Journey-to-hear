/**
 * PhotoAlbum - фотоальбом воспоминаний
 * Просмотр собранных воспоминаний с описаниями
 */

class PhotoAlbum {
    constructor(container) {
        this.container = container || document.getElementById('ui-overlay');
        this.active = false;
        this.collectedItems = [];
    }

    /**
     * Показ фотоальбома
     * @param {Array} items - собранные воспоминания
     */
    show(items = []) {
        this.active = true;
        this.collectedItems = items;
        this._render();
    }

    /**
     * Скрытие альбома
     */
    hide() {
        this.active = false;
        this.container.innerHTML = '';
    }

    /**
     * Рендеринг альбома
     * @private
     */
    _render() {
        this.container.innerHTML = '';

        const album = document.createElement('div');
        album.className = 'album-screen';

        let html = `
            <h2 class="menu-title" style="margin-bottom: 10px;">📷 Фотоальбом</h2>
            <p style="color: #888; margin-bottom: 30px;">Собрано воспоминаний: ${this.collectedItems.length} / 24</p>
        `;

        // Все воспоминания по уровням
        const allMemories = this._getAllMemories();

        html += '<div class="album-grid">';

        for (const memory of allMemories) {
            const collected = this.collectedItems.find(i => i.id === memory.id);

            html += `
                <div class="album-item ${collected ? '' : 'locked'}" data-id="${memory.id}" style="
                    padding: 15px;
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    justify-content: center;
                    min-height: 150px;
                ">
                    <div style="font-size: 40px; margin-bottom: 10px;">${collected ? '📷' : '🔒'}</div>
                    <div style="color: ${collected ? '#fff' : '#888'}; font-size: 14px; text-align: center; font-weight: bold;">
                        ${collected ? memory.title : '???'}
                    </div>
                    ${collected ? `<div style="color: #aaa; font-size: 11px; text-align: center; margin-top: 8px;">${memory.description}</div>` : ''}
                    <div style="color: #666; font-size: 10px; margin-top: 8px;">Уровень ${memory.level}</div>
                </div>
            `;
        }

        html += '</div>';
        html += '<button class="menu-button" id="btn-album-back" style="margin-top: 30px;">Закрыть</button>';

        album.innerHTML = html;
        this.container.appendChild(album);

        document.getElementById('btn-album-back').onclick = () => this.hide();

        // Клик по собранному воспоминанию
        document.querySelectorAll('.album-item:not(.locked)').forEach(item => {
            item.onclick = () => {
                const id = item.dataset.id;
                const memory = this.collectedItems.find(i => i.id === id);
                if (memory) {
                    this._showMemoryDetail(memory);
                }
            };
        });
    }

    /**
     * Показ деталей воспоминания
     * @private
     */
    _showMemoryDetail(memory) {
        const detail = document.createElement('div');
        detail.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(15, 15, 35, 0.95);
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            z-index: 200;
            padding: 40px;
        `;

        detail.innerHTML = `
            <div style="font-size: 64px; margin-bottom: 20px;">📷</div>
            <h2 style="color: #ffb6c1; margin-bottom: 10px;">${memory.title}</h2>
            <p style="color: #fff; max-width: 500px; text-align: center; line-height: 1.6; margin-bottom: 30px;">${memory.description}</p>
            <div style="color: #888; font-size: 14px; margin-bottom: 30px;">Уровень ${memory.level}</div>
            <button class="menu-button" id="btn-detail-back">Назад</button>
        `;

        document.body.appendChild(detail);

        document.getElementById('btn-detail-back').onclick = () => {
            detail.remove();
        };
    }

    /**
     * Получение всех возможных воспоминаний
     * @private
     */
    _getAllMemories() {
        return [
            // Уровень 1: ДВФУ
            { id: 'dvfu_1', title: 'Первый день', description: 'Первый день в ДВФУ. Морской бриз и волнение.', level: 1 },
            { id: 'dvfu_2', title: 'Шаттл', description: 'Белый шаттл, который всегда опаздывает.', level: 1 },
            { id: 'dvfu_3', title: 'Вид на залив', description: 'Крыша общежития с лучшим видом на Аякс.', level: 1 },
            { id: 'dvfu_4', title: 'Перед экзаменом', description: 'Ночь перед экзаменом у Киреева.', level: 1 },
            { id: 'dvfu_secret', title: 'Секретный вид', description: 'Лучший вид на залив Аякс со скрытой крыши.', level: 1 },

            // Уровень 2: Москва
            { id: 'msk_1', title: 'Метро', description: 'Первый раз в московском метро.', level: 2 },
            { id: 'msk_2', title: 'Крыши', description: 'Прыжок с крыши на крышу.', level: 2 },
            { id: 'msk_3', title: 'Бабка с авоськой', description: 'Помогли бабушке донести сумки.', level: 2 },
            { id: 'msk_4', title: 'Вечерний свет', description: 'Закат над Москвой-сити.', level: 2 },

            // Уровень 3: Китай
            { id: 'chn_1', title: 'Виадуки Чунцина', description: 'Бесконечные лестницы и мосты.', level: 3 },
            { id: 'chn_2', title: 'Панды Чэнду', description: 'Панды, которые катятся как мячи.', level: 3 },
            { id: 'chn_3', title: 'Храм', description: 'Мудрые советы буддистского монаха.', level: 3 },
            { id: 'chn_4', title: 'Парящие горы', description: 'Горы Чжанцзяцзе, парящие в облаках.', level: 3 },

            // Уровень 4: Турция
            { id: 'tur_1', title: 'Базар', description: 'Ароматы специй и звуки базара.', level: 4 },
            { id: 'tur_2', title: 'Параплан', description: 'Полёт над голубой лагуной.', level: 4 },
            { id: 'tur_3', title: 'Минареты', description: 'Зов к молитве на закате.', level: 4 },
            { id: 'tur_4', title: 'Песчаные дюны', description: 'Закат в пустыне Олюдениз.', level: 4 },

            // Уровень 5: Офис
            { id: 'off_1', title: 'Кофемашина', description: 'Спасительный кофе в понедельник.', level: 5 },
            { id: 'off_2', title: 'Принтер', description: 'Принтер, который съел документ.', level: 5 },
            { id: 'off_3', title: 'Отпуск', description: 'Последняя печать в заявлении на отпуск.', level: 5 },
            { id: 'off_4', title: 'Сонный коллега', description: 'Коллега, который спит на совещании.', level: 5 },

            // Уровень 6: Побережье
            { id: 'fin_1', title: 'Закат', description: 'Последний закат перед финалом.', level: 6 },
            { id: 'fin_2', title: 'Пирс', description: 'Место, где всё начинается.', level: 6 },
            { id: 'fin_3', title: 'Предложение', description: 'Момент, который изменил всё.', level: 6 },
            { id: 'fin_4', title: 'Начало', description: 'Начало нашей истории вместе.', level: 6 }
        ];
    }
}
