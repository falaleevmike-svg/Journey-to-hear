/**
 * MenuScene - сцена главного меню
 */

class MenuScene extends Scene {
    constructor(game) {
        super(game);
        this.menu = new Menu();
        this.photoAlbum = new PhotoAlbum();
    }

    enter() {
        super.enter();

        const progress = this.game.levelManager.getOverallProgress();

        this.menu.onStartGame = () => {
            this.game.switchScene('game', { levelId: 1 });
        };

        this.menu.onSelectLevel = (levelId) => {
            this.game.switchScene('game', { levelId });
        };

        this.menu.onShowAlbum = () => {
            const items = this.game.levelManager.progress.collectedItems;
            const allItems = Object.values(items).flat();
            this.photoAlbum.show(allItems);
        };

        this.menu.onResetProgress = () => {
            this.game.levelManager.resetAllProgress();
            this.menu.showMainMenu(this.game.levelManager.getOverallProgress());
        };

        this.menu.showMainMenu(progress);
    }

    exit() {
        super.exit();
        this.menu.hide();
        this.photoAlbum.hide();
    }

    update(deltaTime) {
        // Обновление анимации фона меню
    }

    draw(renderer, deltaTime) {
        // Фон меню
        renderer.ctx.fillStyle = '#0f0f23';
        renderer.ctx.fillRect(0, 0, renderer.width, renderer.height);

        // Анимированные частицы на фоне
        renderer.createParticles(
            renderer.width / 2,
            renderer.height / 2,
            {
                count: 1,
                colors: ['rgba(255, 182, 193, 0.3)'],
                speed: 20,
                life: 3,
                spread: renderer.width
            }
        );

        renderer.updateAndDrawParticles(deltaTime);
    }

    handleInput(input) {
        // Обработка ввода для меню
    }
}
