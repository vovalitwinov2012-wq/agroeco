// SCRIPT.JS - ПОЛНОСТЬЮ ПЕРЕРАБОТАННЫЙ КОД С ВСЕМИ НОВЫМИ ФУНКЦИЯМИ

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
    firstName: '',
    lastSave: null
};

let currentQuestion = 0;
let currentQuestStep = 0;
let storageSyncInterval;
let selectedItem = null;
let currentActivity = null;
let selectedAnswer = null;

// УНИВЕРСАЛЬНАЯ СИСТЕМА ХРАНЕНИЯ ДАННЫХ
class AgroEcoStorage {
    constructor() {
        this.storageKey = 'agroeco_';
    }
    
    async setItem(key, data) {
        const fullKey = this.storageKey + key;
        const dataToSave = {
            data: data,
            timestamp: Date.now(),
            version: '1.1'
        };
        
        try {
            if (config.storage.useLocalStorage) {
                localStorage.setItem(fullKey, JSON.stringify(dataToSave));
            }
            if (config.storage.useTelegramStorage && tg && tg.CloudStorage) {
                tg.CloudStorage.setItem(fullKey, JSON.stringify(dataToSave));
            }
        } catch (e) {
            console.warn('Storage error:', e);
        }
    }
    
    async getItem(key) {
        const fullKey = this.storageKey + key;
        let data = null;
        
        try {
            if (config.storage.useLocalStorage) {
                const stored = localStorage.getItem(fullKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (this.isDataValid(parsed)) data = parsed.data;
                }
            }
            
            if (data === null && config.storage.useTelegramStorage && tg && tg.CloudStorage) {
                const stored = tg.CloudStorage.getItem(fullKey);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    if (this.isDataValid(parsed)) {
                        data = parsed.data;
                        if (config.storage.useLocalStorage) this.setItem(key, data);
                    }
                }
            }
        } catch (e) {
            console.warn('Storage read error:', e);
        }
        
        return data;
    }
    
    isDataValid(parsedData) {
        return parsedData && parsedData.data !== undefined && parsedData.version === '1.1';
    }
    
    async removeItem(key) {
        const fullKey = this.storageKey + key;
        try {
            if (config.storage.useLocalStorage) localStorage.removeItem(fullKey);
            if (config.storage.useTelegramStorage && tg && tg.CloudStorage) {
                tg.CloudStorage.removeItem(fullKey);
            }
        } catch (e) {
            console.warn('Storage remove error:', e);
        }
    }
}

const storage = new AgroEcoStorage();

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
function initTelegram() {
    try {
        tg = window.Telegram.WebApp;
        if (tg && tg.initDataUnsafe) {
            setupApp();
        } else {
            setTimeout(initTelegram, 100);
        }
    } catch (error) {
        setupStandaloneApp();
    }
}

function setupApp() {
    try {
        tg.expand();
        tg.enableClosingConfirmation();
        
        const user = tg.initDataUnsafe.user;
        if (user) {
            userData.userId = user.id;
            userData.username = user.username || '';
            userData.firstName = user.first_name;
            updateUserInfo(user);
        }
        
        loadUserData();
        startStorageSync();
        
    } catch (error) {
        setupStandaloneApp();
    }
}

function setupStandaloneApp() {
    userData.userId = 'test_user_' + Date.now();
    userData.firstName = 'Тестовый пользователь';
    document.getElementById('userFirstName').textContent = userData.firstName;
    document.getElementById('menu-user-name').textContent = userData.firstName;
    loadUserData();
}

function updateUserInfo(user) {
    document.getElementById('userFirstName').textContent = user.first_name;
    document.getElementById('menu-user-name').textContent = user.first_name;
    
    if (user.username) {
        const userName = '@' + user.username;
        document.getElementById('userUserName').textContent = userName;
        document.getElementById('profile-user-name').textContent = userName;
    }
    
    document.getElementById('profile-full-name').textContent = 
        `${user.first_name}${user.last_name ? ' ' + user.last_name : ''}`;
    document.getElementById('profile-user-id').textContent = user.id;
    
    if (user.photo_url) {
        document.getElementById('user-avatar').src = user.photo_url;
    }
    
    if (user.id === config.adminId) {
        document.getElementById('admin-btn').style.display = 'block';
    }
}

// УПРАВЛЕНИЕ ДАННЫМИ
async function loadUserData() {
    try {
        if (!userData.userId) return;
        
        const savedData = await storage.getItem('user_data_' + userData.userId);
        if (savedData) {
            Object.assign(userData, {
                ...savedData,
                userId: userData.userId,
                username: userData.username,
                firstName: userData.firstName
            });
        }
        
        updateUI();
        updateMenuButtons();
        
    } catch (error) {
        console.error('Error loading user data:', error);
    }
}

async function saveUserData() {
    try {
        userData.profile.name = document.getElementById('user-name').value;
        userData.profile.phone = document.getElementById('user-phone').value;
        userData.profile.address = document.getElementById('user-address').value;
        
        userData.lastSave = Date.now();
        await storage.setItem('user_data_' + userData.userId, userData);
        
        showSaveStatus('Данные успешно сохранены! ✅ Менеджер свяжется с вами для выдачи призов.', true);
        
    } catch (error) {
        showSaveStatus('Ошибка сохранения!', false);
    }
}

function showSaveStatus(message, isSuccess) {
    const statusElement = document.getElementById('profile-save-status');
    statusElement.textContent = message;
    statusElement.style.color = isSuccess ? '#4CAF50' : '#ff0000';
    setTimeout(() => statusElement.textContent = '', 5000);
}

async function autoSaveUserData() {
    try {
        if (userData.userId) {
            userData.lastSave = Date.now();
            await storage.setItem('user_data_' + userData.userId, userData);
        }
    } catch (error) {
        console.error('Auto-save error:', error);
    }
}

function startStorageSync() {
    if (storageSyncInterval) clearInterval(storageSyncInterval);
    storageSyncInterval = setInterval(autoSaveUserData, config.storage.syncInterval);
}

// УПРАВЛЕНИЕ ЭКРАНАМИ
function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
        
        switch(screenId) {
            case 'screen-profile': initProfileScreen(); break;
            case 'screen-store': loadStoreItems(); break;
            case 'screen-stats': updateUI(); break;
            case 'screen-admin': loadOrders(); break;
        }
    }
}

function showIntro(activityType) {
    currentActivity = activityType;
    const activityConfig = config[activityType];
    
    document.getElementById('intro-title').textContent = activityConfig.intro.title;
    document.getElementById('intro-image').src = activityConfig.intro.image;
    document.getElementById('intro-description').textContent = activityConfig.intro.description;
    document.getElementById('intro-reward-text').textContent = activityConfig.intro.reward;
    
    document.getElementById('start-activity').onclick = () => {
        if (activityType === 'quiz') startQuiz();
        else if (activityType === 'quest') startQuest();
    };
    
    showScreen('screen-intro');
}

function initProfileScreen() {
    document.getElementById('user-name').value = userData.profile.name || '';
    document.getElementById('user-phone').value = userData.profile.phone || '';
    document.getElementById('user-address').value = userData.profile.address || '';
}

// ОБНОВЛЕНИЕ ИНТЕРФЕЙСА
function updateUI() {
    document.getElementById('userScore').textContent = userData.score;
    document.getElementById('stat-current-score').textContent = userData.score;
    document.getElementById('stat-total-score').textContent = userData.stats.totalEarned;
    document.getElementById('stat-quizzes-completed').textContent = userData.stats.quizzesCompleted;
    document.getElementById('stat-quests-completed').textContent = userData.stats.questsCompleted;
    updatePurchasesList();
}

function updateMenuButtons() {
    const quizBtn = document.getElementById('quiz-btn');
    const questBtn = document.getElementById('quest-btn');
    
    quizBtn.textContent = userData.completed.quiz ? '✅ Тест пройден' : '🌱 Пройти тест';
    quizBtn.disabled = userData.completed.quiz;
    
    questBtn.textContent = userData.completed.quest ? '✅ Квест пройден' : '🏞️ Начать квест';
    questBtn.disabled = userData.completed.quest;
}

async function updateScore(points) {
    userData.score += points;
    userData.stats.totalEarned += points;
    await autoSaveUserData();
    updateUI();
    if (points > 0) animateScoreIncrease();
}

function animateScoreIncrease() {
    const scoreElement = document.getElementById('userScore');
    scoreElement.style.transform = 'scale(1.3)';
    scoreElement.style.color = '#4CAF50';
    setTimeout(() => {
        scoreElement.style.transform = 'scale(1)';
        scoreElement.style.color = '';
    }, 500);
}

// ТЕСТ
function startQuiz() {
    if (userData.completed.quiz) {
        showCompletedScreen('Вы уже прошли этот тест и получили свои награды!');
        return;
    }
    
    currentQuestion = 0;
    selectedAnswer = null;
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
    selectedAnswer = null;

    q.answers.forEach((answer, index) => {
        const button = document.createElement('button');
        button.textContent = answer;
        button.onclick = () => selectAnswer(index, button);
        answersContainer.appendChild(button);
    });
}

function selectAnswer(answerIndex, buttonElement) {
    // Сбрасываем предыдущий выбор
    const allButtons = document.getElementById('answers').getElementsByTagName('button');
    Array.from(allButtons).forEach(btn => btn.classList.remove('selected'));
    
    // Устанавливаем новый выбор
    buttonElement.classList.add('selected');
    selectedAnswer = answerIndex;
    document.getElementById('next-question').disabled = false;
}

function nextQuestion() {
    if (selectedAnswer === null) return;
    
    const correctIndex = config.quiz.questions[currentQuestion].correct;
    const allButtons = document.getElementById('answers').getElementsByTagName('button');
    
    // Показываем правильный ответ
    Array.from(allButtons).forEach(btn => btn.disabled = true);
    
    if (selectedAnswer === correctIndex) {
        allButtons[selectedAnswer].classList.add('correct');
        updateScore(config.quiz.rewardPerQuestion);
    } else {
        allButtons[selectedAnswer].classList.add('incorrect');
        allButtons[correctIndex].classList.add('correct');
    }
    
    // Задержка перед следующим вопросом
    setTimeout(() => {
        currentQuestion++;
        loadQuestion();
    }, 1500);
}

function exitQuiz() {
    if (confirm('Вы уверены, что хотите выйти? Весь прогресс текущего теста будет потерян.')) {
        showScreen('screen-menu');
    }
}

async function finishQuiz() {
    const totalReward = config.quiz.completionBonus + (config.quiz.questions.length * config.quiz.rewardPerQuestion);
    updateScore(config.quiz.completionBonus);
    
    userData.stats.quizzesCompleted++;
    userData.completed.quiz = true;
    
    await autoSaveUserData();
    updateMenuButtons();
    
    showSuccessScreen(`Тест завершен! Вы заработали ${totalReward} пяточков 🐽!`);
}

// КВЕСТ
function startQuest() {
    if (userData.completed.quest) {
        showCompletedScreen('Вы уже прошли этот квест и получили свои награды!');
        return;
    }
    
    currentQuestStep = 0;
    selectedAnswer = null;
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
    document.getElementById('quest-progress').textContent = `Шаг ${stepIndex + 1} из ${config.quest.steps.length}`;
    document.getElementById('quest-image').style.backgroundImage = `url('${step.image}')`;
    document.getElementById('quest-description').textContent = step.description;

    const answersContainer = document.getElementById('quest-answers');
    answersContainer.innerHTML = '';
    document.getElementById('next-quest-step').disabled = true;
    selectedAnswer = null;

    step.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => selectQuestAnswer(index, button);
        answersContainer.appendChild(button);
    });
}

function selectQuestAnswer(answerIndex, buttonElement) {
    const allButtons = document.getElementById('quest-answers').getElementsByTagName('button');
    Array.from(allButtons).forEach(btn => btn.classList.remove('selected'));
    
    buttonElement.classList.add('selected');
    selectedAnswer = answerIndex;
    document.getElementById('next-quest-step').disabled = false;
}

function nextQuestStep() {
    if (selectedAnswer === null) return;
    
    const step = config.quest.steps[currentQuestStep];
    const option = step.options[selectedAnswer];
    const allButtons = document.getElementById('quest-answers').getElementsByTagName('button');
    
    Array.from(allButtons).forEach(btn => btn.disabled = true);
    
    if (option.correct) {
        allButtons[selectedAnswer].classList.add('correct');
        updateScore(config.quest.rewardPerStep);
    } else {
        allButtons[selectedAnswer].classList.add('incorrect');
        const correctIndex = step.options.findIndex(opt => opt.correct);
        if (correctIndex !== -1) {
            allButtons[correctIndex].classList.add('correct');
        }
    }
    
    setTimeout(() => {
        currentQuestStep = option.nextStep;
        loadQuestStep(option.nextStep);
    }, 1500);
}

function exitQuest() {
    if (confirm('Вы уверены, что хотите выйти? Весь прогресс текущего квеста будет потерян.')) {
        showScreen('screen-menu');
    }
}

function questFailed() {
    showSuccessScreen('Квест не пройден. Попробуйте еще раз, чтобы лучше узнать АГРОЭКО!');
}

async function questFinished() {
    const totalReward = config.quest.completionBonus + (config.quest.steps.length * config.quest.rewardPerStep);
    updateScore(config.quest.completionBonus);
    
    userData.stats.questsCompleted++;
    userData.completed.quest = true;
    
    await autoSaveUserData();
    updateMenuButtons();
    
    showSuccessScreen(`Поздравляем! Вы прошли квест и заработали ${totalReward} пяточков 🐽!`);
}

// МАГАЗИН
function loadStoreItems() {
    const storeContainer = document.getElementById('store-items');
    storeContainer.innerHTML = '';

    config.store.items.forEach(item => {
        const canBuy = userData.score >= item.price;
        const isPurchased = userData.purchases.includes(item.id);
        
        const itemElement = document.createElement('div');
        itemElement.className = `store-item ${isPurchased ? 'purchased' : ''}`;
        
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="price">Цена: ${item.price} 🐽</p>
            <button ${!canBuy || isPurchased ? 'disabled' : ''}>
                ${isPurchased ? '✅ Выбрано' : (canBuy ? '🎁 Выбрать приз' : '❌ Недостаточно 🐽')}
            </button>
        `;
        
        if (!isPurchased && canBuy) {
            itemElement.onclick = () => openModal(item);
        }
        
        storeContainer.appendChild(itemElement);
    });
}

// МОДАЛЬНЫЕ ОКНА
function openModal(item) {
    selectedItem = item;
    const modal = document.getElementById('purchase-modal');
    const modalInfo = document.getElementById('modal-item-info');
    
    modalInfo.innerHTML = `
        <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
        <h3>${item.name}</h3>
        <p>${item.description}</p>
        <p class="price">Цена: ${item.price} 🐽</p>
        <p>Ваш баланс: <strong>${userData.score} 🐽</strong></p>
        <p>Останется: <strong>${userData.score - item.price} 🐽</strong></p>
    `;
    
    modal.style.display = 'block';
}

function closeModal() {
    document.getElementById('purchase-modal').style.display = 'none';
    selectedItem = null;
}

function openSuccessModal(message) {
    document.getElementById('success-modal-message').textContent = message;
    document.getElementById('success-modal').style.display = 'block';
}

function closeSuccessModal() {
    document.getElementById('success-modal').style.display = 'none';
}

async function confirmPurchase() {
    if (!selectedItem) return;
    
    if (userData.score >= selectedItem.price && !userData.purchases.includes(selectedItem.id)) {
        updateScore(-selectedItem.price);
        userData.purchases.push(selectedItem.id);
        
        saveOrder(selectedItem.id, selectedItem.name, selectedItem.price);
        await autoSaveUserData();
        
        closeModal();
        openSuccessModal(`Приз "${selectedItem.name}" успешно выбран! 🎉`);
        
        loadStoreItems();
        updatePurchasesList();
    } else {
        alert('Недостаточно средств или товар уже выбран!');
        closeModal();
    }
}

function goToProfile() {
    closeSuccessModal();
    showScreen('screen-profile');
}

// АДМИН-ПАНЕЛЬ
async function saveOrder(itemId, itemName, price) {
    try {
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
        
        const orders = await storage.getItem('all_orders') || [];
        orders.push(order);
        await storage.setItem('all_orders', orders);
        
    } catch (error) {
        console.error('Error saving order:', error);
    }
}

async function loadOrders() {
    try {
        const orders = await storage.getItem('all_orders') || [];
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
    } catch (error) {
        console.error('Error loading orders:', error);
    }
}

function showUserManagement() {
    const userManagement = document.getElementById('user-management');
    userManagement.style.display = userManagement.style.display === 'none' ? 'block' : 'none';
}

async function resetUserProgress() {
    const userId = document.getElementById('user-id-input').value.trim();
    if (!userId) {
        showUserManagementStatus('Введите ID пользователя', false);
        return;
    }
    
    try {
        const userData = await storage.getItem('user_data_' + userId);
        if (!userData) {
            showUserManagementStatus('Пользователь не найден', false);
            return;
        }
        
        // Сбрасываем прогресс, но сохраняем профиль
        const resetData = {
            ...userData,
            score: 0,
            purchases: [],
            completed: { quiz: false, quest: false },
            stats: {
                quizzesCompleted: 0,
                questsCompleted: 0,
                totalEarned: 0
            }
        };
        
        await storage.setItem('user_data_' + userId, resetData);
        showUserManagementStatus('Прогресс пользователя сброшен ✅', true);
        
    } catch (error) {
        showUserManagementStatus('Ошибка сброса прогресса', false);
    }
}

async function deleteUserData() {
    const userId = document.getElementById('user-id-input').value.trim();
    if (!userId) {
        showUserManagementStatus('Введите ID пользователя', false);
        return;
    }
    
    if (!confirm('ВЫ УВЕРЕНЫ? Это удалит ВСЕ данные пользователя!')) return;
    
    try {
        await storage.removeItem('user_data_' + userId);
        
        // Также удаляем заказы пользователя
        const orders = await storage.getItem('all_orders') || [];
        const filteredOrders = orders.filter(order => order.userId !== userId);
        await storage.setItem('all_orders', filteredOrders);
        
        showUserManagementStatus('Данные пользователя удалены ✅', true);
        
    } catch (error) {
        showUserManagementStatus('Ошибка удаления данных', false);
    }
}

function showUserManagementStatus(message, isSuccess) {
    const statusElement = document.getElementById('user-management-status');
    statusElement.textContent = message;
    statusElement.style.color = isSuccess ? '#4CAF50' : '#ff0000';
    setTimeout(() => statusElement.textContent = '', 3000);
}

async function exportOrders() {
    try {
        const orders = await storage.getItem('all_orders') || [];
        if (orders.length === 0) {
            alert('Нет заказов для экспорта');
            return;
        }
        
        let csv = 'Дата,ID пользователя,Имя,Username,Приз,Цена,ФИО,Телефон,Адрес,Статус\n';
        
        orders.forEach(order => {
            csv += `"${order.date}",${order.userId},"${order.firstName}","${order.username || ''}","${order.itemName}",${order.price},"${order.profile.name || ''}","${order.profile.phone || ''}","${order.profile.address || ''}","${order.status}"\n`;
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
    } catch (error) {
        console.error('Error exporting orders:', error);
    }
}

// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
function updatePurchasesList() {
    const purchasesList = document.getElementById('user-purchases');
    purchasesList.innerHTML = '';
    
    userData.purchases.forEach(purchaseId => {
        const item = config.store.items.find(i => i.id === purchaseId);
        if (item) {
            const li = document.createElement('li');
            li.innerHTML = `<span>${item.name}</span><span>✅ Выбрано</span>`;
            purchasesList.appendChild(li);
        }
    });
    
    if (userData.purchases.length === 0) {
        purchasesList.innerHTML = '<li>У вас пока нет выбранных призов</li>';
    }
}

function showSuccessScreen(message) {
    document.getElementById('success-message').textContent = message;
    showScreen('screen-success');
}

function showCompletedScreen(message) {
    document.getElementById('completed-message').textContent = message;
    showScreen('screen-completed');
}

// ОБРАБОТЧИКИ СОБЫТИЙ
function setupEventListeners() {
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('purchase-modal');
        const successModal = document.getElementById('success-modal');
        if (event.target === modal) closeModal();
        if (event.target === successModal) closeSuccessModal();
    });
    
    window.addEventListener('beforeunload', autoSaveUserData);
}

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', function() {
    initTelegram();
    setupEventListeners();
});
