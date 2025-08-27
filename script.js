// SCRIPT.JS - ЛОГИКА ПРИЛОЖЕНИЯ

let tg;
let userScore = 0;
let currentQuestion = 0;
let currentQuestStep = 0;

function initTelegram() {
    tg = window.Telegram.WebApp;
    tg.expand();
    tg.BackButton.onClick(() => {
        tg.BackButton.hide();
        showScreen('screen-menu');
    });
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');

    // Показываем/прячем кнопку "Назад" в Telegram
    if (screenId !== 'screen-menu') {
        tg.BackButton.show();
    } else {
        tg.BackButton.hide();
    }
}

function updateScore(points) {
    userScore += points;
    document.getElementById('userScore').textContent = userScore;
    // В реальном приложении здесь нужно сохранять счет пользователя (через бэкенд или локально)
}

// ФУНКЦИОНАЛ ТЕСТА
function loadQuestion() {
    if (currentQuestion >= config.quiz.questions.length) {
        finishQuiz();
        return;
    }

    const q = config.quiz.questions[currentQuestion];
    document.getElementById('question').textContent = q.question;

    const answersContainer = document.getElementById('answers');
    answersContainer.innerHTML = '';
    document.getElementById('next-question').disabled = true;

    q.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.onclick = () => checkAnswer(index, button);
        answersContainer.appendChild(button);
    });
}

function checkAnswer(userChoice, buttonElement) {
    const correctIndex = config.quiz.questions[currentQuestion].correct;
    const allButtons = document.getElementById('answers').getElementsByTagName('button');

    // Делаем все кнопки неактивными
    Array.from(allButtons).forEach(btn => { btn.disabled = true; });

    if (userChoice === correctIndex) {
        buttonElement.style.backgroundColor = '#4CAF50'; // Зеленый для правильного
        updateScore(config.quiz.rewardPerQuestion);
    } else {
        buttonElement.style.backgroundColor = '#f44336'; // Красный для неправильного
        allButtons[correctIndex].style.backgroundColor = '#4CAF50'; // Подсвечиваем правильный
    }

    document.getElementById('next-question').disabled = false;
}

function nextQuestion() {
    currentQuestion++;
    loadQuestion();
}

function finishQuiz() {
    showScreen('screen-success');
    document.getElementById('success-message').textContent = `Вы ответили правильно на все вопросы и заработали ${userScore} пяточков 🐽!`;
    currentQuestion = 0; // Сброс для следующей попытки
}

// ФУНКЦИОНАЛ КВЕСТА
function startQuest() {
    currentQuestStep = 0;
    showScreen('screen-quest');
    loadQuestStep(currentQuestStep);
}

function loadQuestStep(stepIndex) {
    if (stepIndex === -1) {
        questFailed();
        return;
    }
    if (stepIndex >= config.quest.steps.length) {
        questFinished();
        return;
    }

    const step = config.quest.steps[stepIndex];
    document.getElementById('quest-title').textContent = config.quest.title;
    document.getElementById('quest-description').textContent = step.description;

    const optionsContainer = document.getElementById('quest-options');
    optionsContainer.innerHTML = '';

    step.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => {
            if (option.correct) {
                updateScore(config.quest.rewardPerStep);
            }
            loadQuestStep(option.nextStep);
        };
        optionsContainer.appendChild(button);
    });
}

function questFailed() {
    showScreen('screen-success');
    document.getElementById('success-message').textContent = 'Квест провален. Попробуйте еще раз!';
}

function questFinished() {
    showScreen('screen-success');
    document.getElementById('success-message').textContent = `Поздравляем! Вы прошли квест и заработали ${config.quest.rewardPerStep * (config.quest.steps.length - 1)} пяточков 🐽!`;
}

// ФУНКЦИОНАЛ МАГАЗИНА
function loadStoreItems() {
    const storeContainer = document.getElementById('store-items');
    storeContainer.innerHTML = '';

    config.store.items.forEach(item => {
        const itemElement = document.createElement('div');
        itemElement.className = 'store-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" style="width:100px; height:100px; object-fit:cover;">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p><strong>Цена: ${item.price} 🐽</strong></p>
            <button onclick="buyItem(${item.price}, '${item.name}')" ${userScore < item.price ? 'disabled' : ''}>Обменять</button>
        `;
        storeContainer.appendChild(itemElement);
    });
}

function buyItem(price, itemName) {
    if (userScore >= price) {
        updateScore(-price); // Вычитаем цену
        alert(`Поздравляем с покупкой "${itemName}"! Для получения приза с вами свяжутся.`);
        // В реальном приложении здесь должен быть запрос данных пользователя и отправка заказа на бэкенд
        loadStoreItems(); // Обновляем список товаров
    }
}

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
    showScreen('screen-menu');
    // Вешаем обработчики на кнопки меню, которые загружают соответствующие данные
    document.querySelector('[onclick="showScreen(\'screen-store\')"]').addEventListener('click', loadStoreItems);
});