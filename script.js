// SCRIPT.JS - ЛОГИКА ПРИЛОЖЕНИЯ

let tg;
let userData = {
    score: 0,
    purchases: [],
    completed: {
        quiz: false,
        quest: false
    },
    stats: {
        quizzesCompleted: 0,
        questsCompleted: 0,
        totalEarned: 0
    },
    profile: {
        name: '',
        phone: '',
        address: ''
    },
    userId: null,
    username: '',
    firstName: ''
};
let currentQuestion = 0;
let currentQuestStep = 0;

// Инициализация Telegram Web App
function initTelegram() {
    tg = window.Telegram.WebApp;
    
    if (tg && tg.initDataUnsafe) {
        setupApp();
    } else {
        setTimeout(initTelegram, 100);
    }
}

function setupApp() {
    tg.expand();
    tg.enableClosingConfirmation();
    
    // Получаем данные пользователя из Telegram
    const user = tg.initDataUnsafe.user;
    if (user) {
        userData.userId = user.id;
        userData.username = user.username || '';
        userData.firstName = user.first_name;
        
        document.getElementById('userFirstName').textContent = user.first_name;
        document.getElementById('menu-user-name').textContent = user.first_name;
        
        if (user.username) {
            document.getElementById('userUserName').textContent = '@' + user.username;
            document.getElementById('profile-user-name').textContent = '@' + user.username;
        }
        
        document.getElementById('profile-full-name').textContent = 
            `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
        document.getElementById('profile-user-id').textContent = user.id;
        
        if (user.photo_url) {
            document.getElementById('user-avatar').src = user.photo_url;
        }
        
        // Показываем кнопку админа если это администратор
        if (user.id === config.adminId) {
            document.getElementById('admin-btn').style.display = 'block';
        }
    }
    
    // Загружаем данные пользователя
    loadUserData();
}

// Загрузка данных пользователя
function loadUserData() {
    try {
        const savedData = tg.CloudStorage.getItem('user_data_' + userData.userId);
        if (savedData) {
            const parsedData = JSON.parse(savedData);
            // Сохраняем только данные, не перезаписываем userId и username
            userData.score = parsedData.score || 0;
            userData.purchases = parsedData.purchases || [];
            userData.completed = parsedData.completed || { quiz: false, quest: false };
            userData.stats = parsedData.stats || { quizzesCompleted: 0, questsCompleted: 0, totalEarned: 0 };
            userData.profile = parsedData.profile || { name: '', phone: '', address: '' };
        }
        updateUI();
        updateMenuButtons();
    } catch (e) {
        console.error('Error loading user data:', e);
    }
}

// Сохранение данных пользователя
function saveUserData() {
    userData.profile.name = document.getElementById('user-name').value;
    userData.profile.phone = document.getElementById('user-phone').value;
    userData.profile.address = document.getElementById('user-address').value;
    
    tg.CloudStorage.setItem('user_data_' + userData.userId, JSON.stringify(userData));
    
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
    document.getElementById('stat-current-score').textContent = userData.score;
    document.getElementById('stat-total-score').textContent = userData.stats.totalEarned;
    document.getElementById('stat-quizzes-completed').textContent = userData.stats.quizzesCompleted;
    document.getElementById('stat-quests-completed').textContent = userData.stats.questsCompleted;
    
    updatePurchasesList();
}

// Обновление кнопок меню
function updateMenuButtons() {
    const quizBtn = document.getElementById('quiz-btn');
    const questBtn = document.getElementById('quest-btn');
    
    if (userData.completed.quiz) {
        quizBtn.textContent = '✅ Тест пройден';
        quizBtn.disabled = true;
    }
    
    if (userData.completed.quest) {
        questBtn.textContent = '✅ Квест пройден';
        questBtn.disabled = true;
    }
}

// Показ экранов
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    document.getElementById(screenId).classList.add('active');
    
    if (screenId === 'screen-profile') {
        document.getElementById('user-name').value = userData.profile.name || '';
        document.getElementById('user-phone').value = userData.profile.phone || '';
        document.getElementById('user-address').value = userData.profile.address || '';
    } else if (screenId === 'screen-store') {
        loadStoreItems();
    } else if (screenId === 'screen-stats') {
        updateUI();
    } else if (screenId === 'screen-admin') {
        loadOrders();
    }
}

// Обновление счета
function updateScore(points) {
    userData.score += points;
    userData.stats.totalEarned += points;
    tg.CloudStorage.setItem('user_data_' + userData.userId, JSON.stringify(userData));
    updateUI();
    
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
    if (userData.completed.quiz) {
        showScreen('screen-completed');
        document.getElementById('completed-message').textContent = 'Вы уже прошли этот тест и получили свои награды!';
        return;
    }
    
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
    updateScore(config.quiz.completionBonus);
    userData.stats.quizzesCompleted++;
    userData.completed.quiz = true;
    tg.CloudStorage.setItem('user_data_' + userData.userId, JSON.stringify(userData));
    updateMenuButtons();
    
    showScreen('screen-success');
    document.getElementById('success-message').textContent = 
        `Тест завершен! Вы заработали ${config.quiz.completionBonus + (config.quiz.questions.length * config.quiz.rewardPerQuestion)} пяточков 🐽!`;
}

// КВЕСТ
function startQuest() {
    if (userData.completed.quest) {
        showScreen('screen-completed');
        document.getElementById('completed-message').textContent = 'Вы уже прошли этот квест и получили свои награды!';
        return;
    }
    
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
    document.getElementById('quest-description').textContent = step.description;
    document.getElementById('quest-progress').textContent = `Шаг ${stepIndex + 1} из ${config.quest.steps.length}`;
    
    const questImage = document.getElementById('quest-image');
    questImage.style.backgroundImage = `url('${step.image}')`;

    const answersContainer = document.getElementById('quest-answers');
    answersContainer.innerHTML = '';

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
        answersContainer.appendChild(button);
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
    updateScore(config.quest.completionBonus);
    userData.stats.questsCompleted++;
    userData.completed.quest = true;
    tg.CloudStorage.setItem('user_data_' + userData.userId, JSON.stringify(userData));
    updateMenuButtons();
    
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
        
        // Сохраняем заказ
        saveOrder(itemId, itemName, price);
        
        tg.CloudStorage.setItem('user_data_' + userData.userId, JSON.stringify(userData));
        
        showScreen('screen-success');
        document.getElementById('success-message').textContent = 
            `Поздравляем с покупкой "${itemName}"! Для получения приза заполните данные в профиле.`;
        
        loadStoreItems();
        updatePurchasesList();
    }
}

// Сохранение заказа
function saveOrder(itemId, itemName, price) {
    const order = {
        id: Date.now(),
        userId: userData.userId,
        username: userData.username,
        firstName: userData.firstName,
        itemId: itemId,
        itemName: itemName,
        price: price,
        date: new Date().toLocaleString('ru-RU'),
        profile: { ...userData.profile },
        status: 'новый'
    };
    
    // Получаем текущие заказы
    const orders = JSON.parse(tg.CloudStorage.getItem('orders') || '[]');
    orders.push(order);
    tg.CloudStorage.setItem('orders', JSON.stringify(orders));
}

// Загрузка заказов для админа
function loadOrders() {
    const orders = JSON.parse(tg.CloudStorage.getItem('orders') || '[]');
    const tbody = document.getElementById('orders-table-body');
    
    if (orders.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8">Заказов пока нет</td></tr>';
        return;
    }
    
    tbody.innerHTML = '';
    orders.forEach(order => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${order.date}</td>
            <td>${order.firstName}${order.username ? ' (@' + order.username + ')' : ''}</td>
            <td>${order.itemName}</td>
            <td>${order.price} 🐽</td>
            <td>${order.profile.name || 'Не указано'}</td>
            <td>${order.profile.phone || 'Не указан'}</td>
            <td>${order.profile.address || 'Не указан'}</td>
            <td>${order.status}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Экспорт заказов в CSV
function exportOrders() {
    const orders = JSON.parse(tg.CloudStorage.getItem('orders') || '[]');
    if (orders.length === 0) {
        alert('Нет заказов для экспорта');
        return;
    }
    
    let csv = 'Дата,Пользователь,Приз,Цена,ФИО,Телефон,Адрес,Статус\n';
    
    orders.forEach(order => {
        csv += `"${order.date}","${order.firstName}${order.username ? ' (@' + order.username + ')' : ''}","${order.itemName}",${order.price},"${order.profile.name || ''}","${order.profile.phone || ''}","${order.profile.address || ''}","${order.status}"\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'agroeco_orders.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function updatePurchasesList() {
    const purchasesList = document.getElementById('user-purchases');
    purchasesList.innerHTML = '';
    
    userData.purchases.forEach(purchaseId => {
        const item = config.store.items.find(i => i.id === purchaseId);
        if (item) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name}</span><span>✅</span>`;
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
