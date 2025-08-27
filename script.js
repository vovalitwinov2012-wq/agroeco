// SCRIPT.JS - ЛОГИКА ПРИЛОЖЕНИЯ

let tg;
let userData = {
    score: 0,
    purchases: [],
    stats: {
        quizzesCompleted: 0,
        questsCompleted: 0,
        totalEarned: 0
    },
    profile: {
        name: '',
        phone: '',
        address: ''
    }
};
let currentQuestion = 0;
let currentQuestStep = 0;

// Инициализация Telegram Web App
function initTelegram() {
    tg = window.Telegram.WebApp;
    
    // Ждем полной инициализации WebApp
    if (tg && tg.initDataUnsafe) {
        setupApp();
    } else {
        // Если Telegram API еще не загружен, ждем
        setTimeout(initTelegram, 100);
    }
}

function setupApp() {
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Показываем данные пользователя из Telegram
    const user = tg.initDataUnsafe.user;
    if (user) {
        document.getElementById('userFirstName').textContent = user.first_name;
        document.getElementById('menu-user-name').textContent = user.first_name;
        
        if (user.username) {
            document.getElementById('userUserName').textContent = '@' + user.username;
            document.getElementById('profile-user-name').textContent = '@' + user.username;
        }
        
        document.getElementById('profile-full-name').textContent = 
            `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
        
        if (user.photo_url) {
            document.getElementById('user-avatar').src = user.photo_url;
        }
    }
    
    // Загружаем данные пользователя
    loadUserData();
}

// Загрузка данных пользователя
function loadUserData() {
    try {
        const savedData = tg.CloudStorage.getItem('user_data');
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            userData = { ...userData, ...parsedData };
        }
        updateUI();
        showScreen('screen-menu');
    } catch (e) {
        console.error('Error loading user data:', e);
        showScreen('screen-menu');
    }
}

// Сохранение данных пользователя
function saveUserData() {
    userData.profile.name = document.getElementById('user-name').value;
    userData.profile.phone = document.getElementById('user-phone').value;
    userData.profile.address = document.getElementById('user-address').value;
    
    // Сохраняем в хранилище Telegram
    tg.CloudStorage.setItem('user_data', JSON.stringify(userData));
    
    const statusElement = document.getElementById('profile-save-status');
    statusElement.textContent = 'Данные успешно сохранены!';
    statusElement.style.color = '#4CAF50';
    
    setTimeout(() => {
        statusElement.textContent = '';
    }, 3000);
}

// Обновление интерфейса
function updateUI() {
    document.getElementById('userScore').textContent = userData.score;
    
    // Обновляем статистику
    document.getElementById('stat-total-score').textContent = userData.stats.totalEarned;
    document.getElementById('stat-quizzes-completed').textContent = userData.stats.quizzesCompleted;
    document.getElementById('stat-quests-completed').textContent = userData.stats.questsCompleted;
    document.getElementById('stat-items-purchased').textContent = userData.purchases.length;
    
    updatePurchasesList();
}

// Показ экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    // Специфическая логика для разных экранов
    if (screenId === 'screen-profile') {
        document.getElementById('user-name').value = userData.profile.name || '';
        document.getElementById('user-phone').value = userData.profile.phone || '';
        document.getElementById('user-address').value = userData.profile.address || '';
    } else if (screenId === 'screen-store') {
        loadStoreItems();
    } else if (screenId === 'screen-stats') {
        updateUI();
    }
}

// Обновление счета
function updateScore(points) {
    userData.score += points;
    userData.stats.totalEarned += points;
    tg.CloudStorage.setItem('user_data', JSON.stringify(userData));
    updateUI();
    
    // Анимация добавления баллов
    if (points > 0) {
        const scoreElement = document.getElementById('userScore');
        scoreElement.style.transform = 'scale(1.5)';
        scoreElement.style.color = '#4CAF50';
        setTimeout(() => {
            scoreElement.style.transform = 'scale(1)';
            scoreElement.style.color = '';
        }, 500);
    }
}

// ТЕСТ
function startQuiz() {
    currentQuestion = 0;
    showScreen('screen-quiz');
    loadQuestion();
}

function loadQuestion() {
    if (currentQuestion >= config.quiz.questions.length) {
        finishQuiz();
        return;
    }

    const q = config.quiz.questions[currentQuestion];
    document.getElementById('question').textContent = q.question;
    document.getElementById('quiz-progress').textContent = `Вопрос ${currentQuestion + 1} из ${config.quiz.questions.length}`;

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

    Array.from(allButtons).forEach(btn => { btn.disabled = true; });

    if (userChoice === correctIndex) {
        buttonElement.style.background = 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
        buttonElement.style.color = 'white';
        updateScore(config.quiz.rewardPerQuestion);
    } else {
        buttonElement.style.background = '#ffebee';
        buttonElement.style.color = '#c62828';
        allButtons[correctIndex].style.background = 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
        allButtons[correctIndex].style.color = 'white';
    }

    document.getElementById('next-question').disabled = false;
}

function nextQuestion() {
    currentQuestion++;
    loadQuestion();
}

function exitQuiz() {
    if (confirm('Вы уверены, что хотите выйти? Весь прогресс текущего теста будет потерян.')) {
        showScreen('screen-menu');
    }
}

function finishQuiz() {
    // Добавляем бонус за завершение теста
    updateScore(config.quiz.completionBonus);
    userData.stats.quizzesCompleted++;
    tg.CloudStorage.setItem('user_data', JSON.stringify(userData));
    
    showScreen('screen-success');
    document.getElementById('success-message').textContent = 
        `Тест завершен! Вы заработали ${config.quiz.completionBonus + (config.quiz.questions.length * config.quiz.rewardPerQuestion)} пяточков 🐽!`;
}

// КВЕСТ
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
    
    // Устанавливаем изображение для квеста
    const questImage = document.getElementById('quest-image');
    questImage.style.backgroundImage = `url('${step.image}')`;

    const optionsContainer = document.getElementById('quest-options');
    optionsContainer.innerHTML = '';

    step.options.forEach(option => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => {
            if (option.correct) {
                updateScore(config.quest.rewardPerStep);
            }
            currentQuestStep = option.nextStep;
            loadQuestStep(option.nextStep);
        };
        optionsContainer.appendChild(button);
    });
}

function exitQuest() {
    if (confirm('Вы уверены, что хотите выйти? Весь прогресс текущего квеста будет потерян.')) {
        showScreen('screen-menu');
    }
}

function questFailed() {
    showScreen('screen-success');
    document.getElementById('success-message').textContent = 'Квест не пройден. Попробуйте еще раз, чтобы лучше узнать АГРОЭКО!';
}

function questFinished() {
    // Добавляем бонус за завершение квеста
    updateScore(config.quest.completionBonus);
    userData.stats.questsCompleted++;
    tg.CloudStorage.setItem('user_data', JSON.stringify(userData));
    
    showScreen('screen-success');
    document.getElementById('success-message').textContent = 
        `Поздравляем! Вы прошли квест и заработали ${config.quest.completionBonus + (config.quest.steps.length * config.quest.rewardPerStep)} пяточков 🐽!`;
}

// МАГАЗИН
function loadStoreItems() {
    const storeContainer = document.getElementById('store-items');
    storeContainer.innerHTML = '';

    config.store.items.forEach(item => {
        const canBuy = userData.score >= item.price;
        const isPurchased = userData.purchases.includes(item.id);
        
        const itemElement = document.createElement('div');
        itemElement.className = 'store-item';
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="price">Цена: ${item.price} 🐽</p>
            <button onclick="buyItem(${item.id}, ${item.price}, '${item.name}')" 
                    ${!canBuy || isPurchased ? 'disabled' : ''}>
                ${isPurchased ? 'Получено' : (canBuy ? 'Обменять' : 'Недостаточно 🐽')}
            </button>
        `;
        storeContainer.appendChild(itemElement);
    });
}

function buyItem(itemId, price, itemName) {
    if (userData.score >= price && !userData.purchases.includes(itemId)) {
        updateScore(-price);
        userData.purchases.push(itemId);
        tg.CloudStorage.setItem('user_data', JSON.stringify(userData));
        
        showScreen('screen-success');
        document.getElementById('success-message').textContent = 
            `Поздравляем с покупкой "${itemName}"! Для получения приза заполните данные в профиле.`;
        
        loadStoreItems();
        updatePurchasesList();
    }
}

function updatePurchasesList() {
    const purchasesList = document.getElementById('user-purchases');
    purchasesList.innerHTML = '';
    
    userData.purchases.forEach(purchaseId => {
        const item = config.store.items.find(i => i.id === purchaseId);
        if (item) {
            const li = document.createElement('li');
            li.textContent = item.name;
            li.innerHTML = `
                <span>${item.name}</span>
                <span>✅</span>
            `;
            purchasesList.appendChild(li);
        }
    });
    
    if (userData.purchases.length === 0) {
        purchasesList.innerHTML = '<li>У вас пока нет полученных призов</li>';
    }
}

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
});
