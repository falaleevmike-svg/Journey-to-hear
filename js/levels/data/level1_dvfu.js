const LEVEL1_DVFU = {
    id: 1,
    name: "Кампус ДВФУ",
    description: "Владивосток. Бег по крышам общежитий, прыжки между корпусами и экзамен у Киреева.",

    // Стартовая позиция игроков (парень и девушка)
    startPositions: {
        player1: { x: 100, y: 300 },
        player2: { x: 140, y: 300 }
    },

    // Размеры уровня
    width: 4000,
    height: 800,

    // Фон
    background: {
        type: "gradient",
        colors: ["#1a1a2e", "#16213e", "#0f3460"],
        // Звёзды/огни города
        stars: true
    },

    // Платформы (крыши, перекрытия, балконы)
    platforms: [
        // Стартовая крыша общежития
        { x: 0, y: 400, width: 300, height: 20, type: "roof", color: "#4a4a6a" },
        { x: 50, y: 350, width: 40, height: 50, type: "wall", color: "#3a3a5a" },
        { x: 200, y: 350, width: 40, height: 50, type: "wall", color: "#3a3a5a" },

        // Переход к следующему корпусу (разрыв с чайками)
        { x: 350, y: 380, width: 150, height: 20, type: "roof", color: "#4a4a6a" },
        { x: 380, y: 330, width: 30, height: 50, type: "wall", color: "#3a3a5a" },

        // Промежуточная платформа (белый шаттл как препятствие)
        { x: 550, y: 360, width: 100, height: 15, type: "shuttle", color: "#ffffff", 
          obstacle: true, name: "Белый шаттл ДВФУ" },

        // Крыша следующего корпуса
        { x: 700, y: 400, width: 250, height: 20, type: "roof", color: "#4a4a6a" },
        { x: 720, y: 350, width: 50, height: 50, type: "wall", color: "#3a3a5a" },
        { x: 880, y: 350, width: 50, height: 50, type: "wall", color: "#3a3a5a" },

        // Зона с упавшими учебниками (препятствия)
        { x: 1000, y: 380, width: 80, height: 15, type: "book", color: "#8b4513", 
          obstacle: true, name: "Упавший учебник" },
        { x: 1100, y: 350, width: 80, height: 15, type: "book", color: "#8b4513", 
          obstacle: true, name: "Упавший учебник" },
        { x: 1200, y: 320, width: 80, height: 15, type: "book", color: "#8b4513", 
          obstacle: true, name: "Упавший учебник" },

        // Длинная крыша с вентиляциями
        { x: 1350, y: 400, width: 400, height: 20, type: "roof", color: "#4a4a6a" },
        { x: 1400, y: 360, width: 30, height: 40, type: "vent", color: "#555555" },
        { x: 1550, y: 360, width: 30, height: 40, type: "vent", color: "#555555" },
        { x: 1700, y: 360, width: 30, height: 40, type: "vent", color: "#555555" },

        // Стая чаек (подвижные препятствия)
        { x: 1800, y: 300, width: 60, height: 15, type: "seagull", color: "#ffffff", 
          moving: true, moveRange: 100, moveSpeed: 2, name: "Чайка" },
        { x: 1900, y: 280, width: 60, height: 15, type: "seagull", color: "#ffffff", 
          moving: true, moveRange: 120, moveSpeed: 2.5, name: "Чайка" },
        { x: 2000, y: 320, width: 60, height: 15, type: "seagull", color: "#ffffff", 
          moving: true, moveRange: 80, moveSpeed: 3, name: "Чайка" },

        // Платформа перед аудиторией Киреева
        { x: 2150, y: 400, width: 300, height: 20, type: "roof", color: "#4a4a6a" },
        { x: 2200, y: 350, width: 40, height: 50, type: "wall", color: "#3a3a5a" },
        { x: 2350, y: 350, width: 40, height: 50, type: "wall", color: "#3a3a5a" },

        // Вход в аудиторию (триггер босс-файта)
        { x: 2400, y: 380, width: 50, height: 20, type: "door", color: "#8b0000", 
          trigger: "boss", name: "Аудитория Киреева" },

        // Скрытая зона — крыша с видом на залив (доступна через сложные прыжки)
        { x: 2600, y: 200, width: 200, height: 20, type: "secret_roof", color: "#5a5a7a", 
          secret: true, name: "Секретная крыша" },
        { x: 2650, y: 150, width: 30, height: 50, type: "wall", color: "#4a4a6a" },
        { x: 2750, y: 150, width: 30, height: 50, type: "wall", color: "#4a4a6a" },

        // Путь к секретной зоне (сложные прыжки)
        { x: 2500, y: 350, width: 50, height: 15, type: "jump_pad", color: "#ff6b6b", 
          jumpBoost: true, name: "Прыжковая площадка" },
        { x: 2550, y: 280, width: 40, height: 15, type: "roof", color: "#4a4a6a" },
        { x: 2580, y: 240, width: 40, height: 15, type: "roof", color: "#4a4a6a" },
    ],

    // Собираемые предметы (билеты с ответами для босса + обычные)
    collectibles: [
        // Обычные предметы на пути
        { x: 150, y: 360, type: "coin", value: 10, name: "Студенческий жетон" },
        { x: 400, y: 340, type: "coin", value: 10, name: "Студенческий жетон" },
        { x: 750, y: 370, type: "coin", value: 10, name: "Студенческий жетон" },
        { x: 1050, y: 340, type: "coin", value: 10, name: "Студенческий жетон" },
        { x: 1500, y: 370, type: "coin", value: 10, name: "Студенческий жетон" },
        { x: 1850, y: 270, type: "coin", value: 20, name: "Жетон чайки" },
        { x: 1950, y: 250, type: "coin", value: 20, name: "Жетон чайки" },

        // Билеты с ответами (для босс-файта с Киреевым)
        { x: 2300, y: 370, type: "ticket", id: "ticket_1", name: "Билет с ответами №1", 
          bossItem: true, description: "Билет с подготовленными ответами на экзамен" },
        { x: 2320, y: 370, type: "ticket", id: "ticket_2", name: "Билет с ответами №2", 
          bossItem: true, description: "Билет с подготовленными ответами на экзамен" },
        { x: 2340, y: 370, type: "ticket", id: "ticket_3", name: "Билет с ответами №3", 
          bossItem: true, description: "Билет с подготовленными ответами на экзамен" },

        // Секретный предмет на скрытой крыше
        { x: 2700, y: 170, type: "secret", id: "view_photo", name: "Фото вида на залив", 
          secret: true, description: "Редкое фото заката над Амурским заливом" }
    ],

    // NPC
    npcs: [
        // Студенты на крышах (фоновые диалоги)
        { x: 300, y: 370, type: "student", name: "Студент Вася", 
          dialog: "Видел чаек? Они тут постоянно воруют еду!" },
        { x: 800, y: 370, type: "student", name: "Студентка Маша", 
          dialog: "Белый шаттл снова сломался... Классика ДВФУ." },
        { x: 1450, y: 370, type: "student", name: "Студент Петя", 
          dialog: "Киреев завтра экзамен ставит. Уже билеты ищу!" },

        // Киреев (босс) — появляется при входе в аудиторию
        { x: 2450, y: 350, type: "boss", id: "kireev", name: "Профессор Киреев", 
          triggerZone: { x: 2400, y: 380, width: 50, height: 20 },
          bossType: "minigame",
          minigame: {
                name: "Экзамен у Киреева",
                description: "Соберите 3 билета с ответами за 60 секунд, уворачиваясь от мелков и учебников!",
                timeLimit: 60,
                requiredItems: ["ticket_1", "ticket_2", "ticket_3"],

                // Препятствия в мини-игре
                obstacles: [
                    { type: "chalk", spawnRate: 2000, speed: 3, damage: false, 
                      name: "Летающий мелок" },
                    { type: "book_falling", spawnRate: 3000, speed: 4, damage: false, 
                      name: "Падающий учебник" }
                ],

                // Диалог после успеха
                successDialog: {
                    speaker: "Киреев",
                    text: "Ну-ка, покажите ваши билеты... Хм, ответы верные. Ладно, зачётку на стол.",
                    choices: [
                        { text: "Спасибо, Иван Иванович! (правильный)", correct: true, 
                          result: "Зачёт получен! Киреев подписывает зачётку." },
                        { text: "Это было легко... (неправильный)", correct: false, 
                          result: "Киреев хмурится: 'Легко? Пересдача через неделю.'" },
                        { text: "Можно ещё один шанс? (неправильный)", correct: false, 
                          result: "Киреев: 'Нет. Собирайте билеты заново.'" }
                    ]
                },

                // При неудаче — повтор без штрафа
                failRetry: true,
                failDialog: "Киреев: 'Не собрали все билеты? Попробуйте ещё раз, я подожду.'"
          }
        }
    ],

    // Чекпоинты
    checkpoints: [
        { x: 100, y: 400, id: "start" },
        { x: 700, y: 400, id: "mid_roof" },
        { x: 1500, y: 400, id: "long_roof" },
        { x: 2200, y: 400, id: "before_boss" }
    ],

    // Финиш уровня (после успешного диалога с Киреевым)
    exit: {
        x: 2450, y: 350,
        trigger: "boss_complete",
        nextLevel: 2, // Переход к уровню 2 (Москва)
        dialog: "Киреев подписывает зачётку. Пора в путь — следующая остановка Москва!"
    },

    // Музыка/звуки
    audio: {
        background: "dvfu_night.mp3",
        ambient: ["seagulls.mp3", "wind.mp3"],
        boss: "exam_tension.mp3"
    },

    // Визуальные эффекты
    effects: {
        rain: false,
        snow: false,
        wind: true,
        fog: true
    }
};
