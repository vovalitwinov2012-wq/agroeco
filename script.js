// SCRIPT.JS - ДОБАВЛЕНА ЛОГИКА МОДАЛЬНЫХ ОКОН И УЛУЧШЕН КВЕСТ

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

// ... (предыдущий код класса AgroEcoStorage и остальные функции остаются без изменений) ...

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

function goToProfile() {
    closeSuccessModal();
    showScreen('screen-profile');
}

// Подтверждение покупки
async function confirmPurchase() {
    if (!selectedItem) return;
    
    if (userData.score >= selectedItem.price && !userData.purchases.includes(selectedItem.id)) {
        updateScore(-selectedItem.price);
        userData.purchases.push(selectedItem.id);
        
        // Сохраняем заказ
        saveOrder(selectedItem.id, selectedItem.name, selectedItem.price);
        
        await autoSaveUserData();
        
        closeModal();
        openSuccessModal(`Поздравляем с покупкой "${selectedItem.name}"! Для получения приза заполните данные в профиле.`);
        
        loadStoreItems();
        updatePurchasesList();
    } else {
        alert('Недостаточно средств или товар уже куплен!');
        closeModal();
    }
}

// МАГАЗИН - обновленная функция
function loadStoreItems() {
    const storeContainer = document.getElementById('store-items');
    storeContainer.innerHTML = '';

    config.store.items.forEach(item => {
        const canBuy = userData.score >= item.price;
        const isPurchased = userData.purchases.includes(item.id);
        
        const itemElement = document.createElement('div');
        itemElement.className = 'store-item';
        itemElement.onclick = () => {
            if (!isPurchased && canBuy) {
                openModal(item);
            }
        };
        
        itemElement.innerHTML = `
            <img src="${item.image}" alt="${item.name}" onerror="this.src='https://images.unsplash.com/photo-1560472355-536de3962603?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80'">
            <h3>${item.name}</h3>
            <p>${item.description}</p>
            <p class="price">Цена: ${item.price} 🐽</p>
            <button ${!canBuy || isPurchased ? 'disabled' : ''}>
                ${isPurchased ? 'Получено' : (canBuy ? 'Выбрать' : 'Недостаточно 🐽')}
            </button>
        `;
        
        // Добавляем класс для купленных товаров
        if (isPurchased) {
            itemElement.classList.add('purchased');
        }
        
        storeContainer.appendChild(itemElement);
    });
}

// КВЕСТ - полностью переработанный интерфейс
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
    
    // Обновляем прогресс
    document.getElementById('quest-progress').textContent = `Шаг ${stepIndex + 1} из ${config.quest.steps.length}`;
    
    // Устанавливаем изображение
    const questImage = document.getElementById('quest-image');
    questImage.style.backgroundImage = `url('${step.image}')`;
    
    // Устанавливаем описание
    document.getElementById('quest-description').textContent = step.description;

    // Создаем кнопки ответов
    const answersContainer = document.getElementById('quest-answers');
    answersContainer.innerHTML = '';

    step.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.textContent = option.text;
        button.onclick = () => {
            // Блокируем все кнопки после выбора
            const allButtons = answersContainer.getElementsByTagName('button');
            Array.from(allButtons).forEach(btn => { btn.disabled = true; });
            
            // Визуальная обратная связь
            if (option.correct) {
                button.style.background = 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
                button.style.color = 'white';
                updateScore(config.quest.rewardPerStep);
                
                // Задержка перед переходом к следующему шагу
                setTimeout(() => {
                    currentQuestStep = option.nextStep;
                    loadQuestStep(option.nextStep);
                }, 1000);
            } else {
                button.style.background = '#ffebee';
                button.style.color = '#c62828';
                
                // Подсвечиваем правильный ответ
                const correctOption = step.options.find(opt => opt.correct);
                if (correctOption) {
                    const correctIndex = step.options.indexOf(correctOption);
                    const correctButton = answersContainer.children[correctIndex];
                    correctButton.style.background = 'linear-gradient(135deg, #4CAF50 0%, #388E3C 100%)';
                    correctButton.style.color = 'white';
                }
                
                // Задержка перед переходом к провалу
                setTimeout(() => {
                    currentQuestStep = option.nextStep;
                    loadQuestStep(option.nextStep);
                }, 1500);
            }
        };
        answersContainer.appendChild(button);
    });
}

// Закрытие модального окна при клике вне его
window.onclick = function(event) {
    const modal = document.getElementById('purchase-modal');
    const successModal = document.getElementById('success-modal');
    
    if (event.target === modal) {
        closeModal();
    }
    if (event.target === successModal) {
        closeSuccessModal();
    }
};

// ... (остальной код остается без изменений) ...

// ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ
document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
});
