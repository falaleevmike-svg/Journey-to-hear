/**
 * NPC - неигровые персонажи
 * Диалоги, квесты, мини-игры
 */

class NPC {
    constructor(x, y, type, options = {}) {
        this.x = x;
        this.y = y;
        this.width = 48;
        this.height = 64;
        this.type = type; // kireev, babka, buddist, panda, etc.
        this.active = true;
        this.interacted = false;

        // Опции
        this.options = {
            name: options.name || 'NPC',
            dialogues: options.dialogues || [],
            quest: options.quest || null,
            miniGame: options.miniGame || null,
            sprite: options.sprite || null,
            ...options
        };

        // Анимация
        this.animTimer = 0;
        this.bobOffset = 0;

        // Диалог
        this.currentDialog = 0;
        this.dialogActive = false;

        // Квест
        this.questCompleted = false;
        this.questItems = [];
    }

    /**
     * Обновление NPC
     * @param {number} deltaTime
     * @param {PlayerPair} player
     */
    update(deltaTime, player) {
        // Плавное покачивание
        this.animTimer += deltaTime;
        this.bobOffset = Math.sin(this.animTimer * 1.5) * 3;
    }

    /**
     * Взаимодействие с NPC
     * @param {PlayerPair} player
     * @param {Object} ui - UI менеджер
     * @returns {Object|null} - результат взаимодействия
     */
    interact(player, ui) {
        if (!this.active) return null;

        // Если есть мини-игра
        if (this.options.miniGame && !this.interacted) {
            return { type: 'minigame', game: this.options.miniGame };
        }

        // Если есть квест
        if (this.options.quest && !this.questCompleted) {
            return this._handleQuest(player);
        }

        // Диалог
        if (this.options.dialogues.length > 0) {
            return this._handleDialogue(ui);
        }

        return null;
    }

    /**
     * Обработка диалога
     * @private
     */
    _handleDialogue(ui) {
        const dialogue = this.options.dialogues[this.currentDialog];
        if (!dialogue) return null;

        this.dialogActive = true;

        // Если есть выбор ответов
        if (dialogue.choices) {
            return {
                type: 'dialogue',
                text: dialogue.text,
                speaker: this.options.name,
                choices: dialogue.choices,
                onChoice: (choiceIndex) => {
                    if (dialogue.onChoice) {
                        dialogue.onChoice(choiceIndex, this);
                    }
                    this.currentDialog++;
                    this.dialogActive = false;
                }
            };
        }

        // Простой диалог
        return {
            type: 'dialogue',
            text: dialogue.text,
            speaker: this.options.name,
            onComplete: () => {
                this.currentDialog++;
                this.dialogActive = false;
                if (this.currentDialog >= this.options.dialogues.length) {
                    this.interacted = true;
                }
            }
        };
    }

    /**
     * Обработка квеста
     * @private
     */
    _handleQuest(player) {
        const quest = this.options.quest;

        // Проверка выполнения
        if (quest.checkCompletion && quest.checkCompletion(player, this)) {
            this.questCompleted = true;
            return {
                type: 'quest_complete',
                reward: quest.reward,
                text: quest.completeText || 'Квест выполнен!'
            };
        }

        // Выдача квеста
        return {
            type: 'quest',
            text: quest.description,
            objective: quest.objective
        };
    }

    /**
     * Отрисовка NPC
     * @param {Renderer} renderer
     */
    draw(renderer) {
        if (!this.active) return;

        const drawX = this.x;
        const drawY = this.y + this.bobOffset;

        // Цвета для разных типов NPC
        const colors = {
            kireev: '#808080',      // Серый (лысый препод)
            babka: '#8B4513',       // Коричневый (бабка)
            buddist: '#FFD700',     // Золотой (буддист)
            panda: '#FFFFFF',       // Белый (панда)
            seagull: '#FFFFFF',     // Белый (чайка)
            colleague: '#4169E1',   // Синий (коллега)
            boss: '#FF4444'         // Красный (начальник)
        };

        const color = colors[this.type] || '#888888';

        // Тело
        renderer.drawRect(drawX, drawY, this.width, this.height, color);

        // Голова
        renderer.drawRect(drawX + 8, drawY - 16, 32, 24, color);

        // Глаза
        renderer.drawRect(drawX + 14, drawY - 10, 6, 6, '#FFFFFF');
        renderer.drawRect(drawX + 28, drawY - 10, 6, 6, '#FFFFFF');
        renderer.drawRect(drawX + 16, drawY - 8, 2, 2, '#000000');
        renderer.drawRect(drawX + 30, drawY - 8, 2, 2, '#000000');

        // Индикатор взаимодействия
        if (!this.interacted && !this.dialogActive) {
            const indicatorY = drawY - 30 + Math.sin(Date.now() * 0.005) * 5;
            renderer.ctx.fillStyle = '#FFD700';
            renderer.ctx.font = 'bold 16px sans-serif';
            renderer.ctx.fillText('!', drawX + this.width / 2 - 4 - renderer.camera.x, indicatorY - renderer.camera.y);
        }

        // Имя
        renderer.ctx.fillStyle = '#FFFFFF';
        renderer.ctx.font = '10px sans-serif';
        renderer.ctx.textAlign = 'center';
        renderer.ctx.fillText(
            this.options.name,
            drawX + this.width / 2 - renderer.camera.x,
            drawY - 24 - renderer.camera.y
        );
    }
}

/**
 * DialogueSystem - система диалогов
 * Управление диалоговыми окнами, выбором ответов
 */
class DialogueSystem {
    constructor() {
        this.active = false;
        this.currentDialogue = null;
        this.onComplete = null;
        this.selectedChoice = 0;
    }

    /**
     * Запуск диалога
     * @param {Object} dialogue - {text, speaker, choices, onChoice, onComplete}
     * @param {Function} onComplete
     */
    startDialogue(dialogue, onComplete) {
        this.active = true;
        this.currentDialogue = dialogue;
        this.onComplete = onComplete;
        this.selectedChoice = 0;
    }

    /**
     * Обновление диалога (ввод)
     * @param {InputHandler} input
     */
    update(input) {
        if (!this.active || !this.currentDialogue) return;

        // Выбор ответа
        if (this.currentDialogue.choices) {
            if (input.isJustPressed('up')) {
                this.selectedChoice = Math.max(0, this.selectedChoice - 1);
            }
            if (input.isJustPressed('down')) {
                this.selectedChoice = Math.min(this.currentDialogue.choices.length - 1, this.selectedChoice + 1);
            }
            if (input.isJustPressed('interact') || input.isJustPressed('jump')) {
                if (this.currentDialogue.onChoice) {
                    this.currentDialogue.onChoice(this.selectedChoice);
                }
                this.close();
            }
        } else {
            // Простой диалог - любая клавиша для продолжения
            if (input.isJustPressed('interact') || input.isJustPressed('jump')) {
                if (this.currentDialogue.onComplete) {
                    this.currentDialogue.onComplete();
                }
                this.close();
            }
        }
    }

    /**
     * Закрытие диалога
     */
    close() {
        this.active = false;
        this.currentDialogue = null;
        if (this.onComplete) {
            this.onComplete();
        }
    }

    /**
     * Отрисовка диалогового окна
     * @param {Renderer} renderer
     * @param {number} screenWidth
     * @param {number} screenHeight
     */
    draw(renderer, screenWidth, screenHeight) {
        if (!this.active || !this.currentDialogue) return;

        const ctx = renderer.ctx;
        const padding = 20;
        const boxWidth = Math.min(600, screenWidth - 40);
        const boxHeight = 150;
        const boxX = (screenWidth - boxWidth) / 2;
        const boxY = screenHeight - boxHeight - 40;

        // Фон диалогового окна
        ctx.fillStyle = 'rgba(20, 20, 40, 0.95)';
        ctx.strokeStyle = '#ffb6c1';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(boxX, boxY, boxWidth, boxHeight, 12);
        ctx.fill();
        ctx.stroke();

        // Имя говорящего
        if (this.currentDialogue.speaker) {
            ctx.fillStyle = '#ffb6c1';
            ctx.font = 'bold 16px sans-serif';
            ctx.fillText(this.currentDialogue.speaker, boxX + padding, boxY + 25);
        }

        // Текст диалога
        ctx.fillStyle = '#ffffff';
        ctx.font = '14px sans-serif';
        this._drawWrappedText(ctx, this.currentDialogue.text, boxX + padding, boxY + 50, boxWidth - padding * 2, 20);

        // Варианты ответов
        if (this.currentDialogue.choices) {
            const choiceY = boxY + 90;
            for (let i = 0; i < this.currentDialogue.choices.length; i++) {
                const choice = this.currentDialogue.choices[i];
                const isSelected = i === this.selectedChoice;

                ctx.fillStyle = isSelected ? '#ffb6c1' : 'rgba(255, 182, 193, 0.3)';
                ctx.fillRect(boxX + padding, choiceY + i * 30, boxWidth - padding * 2, 25);

                ctx.fillStyle = isSelected ? '#1a1a2e' : '#ffb6c1';
                ctx.font = isSelected ? 'bold 13px sans-serif' : '13px sans-serif';
                ctx.fillText(`> ${choice.text}`, boxX + padding + 10, choiceY + i * 30 + 17);
            }
        } else {
            // Подсказка продолжения
            const blink = Math.sin(Date.now() * 0.005) > 0;
            if (blink) {
                ctx.fillStyle = '#ffb6c1';
                ctx.font = '12px sans-serif';
                ctx.fillText('Нажмите E или Пробел для продолжения...', boxX + boxWidth - 200, boxY + boxHeight - 10);
            }
        }
    }

    /**
     * Отрисовка текста с переносом строк
     * @private
     */
    _drawWrappedText(ctx, text, x, y, maxWidth, lineHeight) {
        const words = text.split(' ');
        let line = '';
        let currentY = y;

        for (const word of words) {
            const testLine = line + word + ' ';
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && line !== '') {
                ctx.fillText(line, x, currentY);
                line = word + ' ';
                currentY += lineHeight;
            } else {
                line = testLine;
            }
        }

        ctx.fillText(line, x, currentY);
    }
}
