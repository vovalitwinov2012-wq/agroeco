// CONFIG.JS - КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ

window.config = {
    // ID администратора (замените на ваш Telegram ID)
    adminId: 123456789,
    
    // Настройки хранения данных
    storage: {
        useLocalStorage: true,
        useTelegramStorage: true,
        syncInterval: 30000
    },
    
    // НАСТРОЙКИ ТЕСТА
    quiz: {
        title: "Тест: Знакомство с АГРОЭКО",
        questions: [
            {
                question: "В каком году была основана компания АГРОЭКО?",
                answers: ["2009 год", "2012 год", "2015 год"],
                correct: 0
            },
            {
                question: "Какой главный принцип растениеводства в АГРОЭКО?",
                answers: ["Традиционное земледелие", "Органическое земледелие без химии", "Высокоэффективное точное земледелие"],
                correct: 2
            },
            {
                question: "Какую уникальную технологию свиноводства использует компания?",
                answers: ["Выгульное содержание", "Многофазная система содержания", "Домашнее фермерское содержание"],
                correct: 1
            },
            {
                question: "Что является основой кормовой базы для животных в АГРОЭКО?",
                answers: ["Покупные комбикорма", "Собственные экологически чистые корма", "Импортные кормовые добавки"],
                correct: 1
            },
            {
                question: "Какой из этих лозунгов отражает философию АГРОЭКО?",
                answers: ["«Больше урожая любой ценой»", "«Заботимся о земле и животных»", "«Скорость и эффективность»"],
                correct: 1
            }
        ],
        rewardPerQuestion: 10,
        completionBonus: 20,
        maxAttempts: 1
    },

    // НАСТРОЙКИ КВЕСТА
    quest: {
        title: "Квест: Путь к успеху АГРОЭКО",
        steps: [
            {
                description: "Вы - новый агроном в компании АГРОЭКО. Ваша первая задача - выбрать стратегию для повышения урожайности. Что вы выберете?",
                image: "https://images.unsplash.com/photo-1625246335525-8f984e4f34a3?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                options: [
                    { text: "Интенсивное использование химикатов", nextStep: -1 },
                    { text: "Внедрение точного земледелия и современных технологий", nextStep: 1, correct: true },
                    { text: "Оставить всё как есть", nextStep: -1 }
                ]
            },
            {
                description: "Отличный выбор! Теперь в свиноводческом комплексе. Как обеспечить лучшие условия для животных?",
                image: "https://images.unsplash.com/photo-1596363505726-56d487670c42?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                options: [
                    { text: "Минимальные затраты на содержание", nextStep: -1 },
                    { text: "Многофазная система и современные технологии содержания", nextStep: 2, correct: true },
                    { text: "Традиционные методы", nextStep: -1 }
                ]
            },
            {
                description: "Правильно! Финальный этап - производство кормов. Какой подход соответствует философии АГРОЭКО?",
                image: "https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
                options: [
                    { text: "Закупка дешёвых кормов", nextStep: -1 },
                    { text: "Полный цикл производства собственных экологичных кормов", nextStep: 3, correct: true },
                    { text: "Смешанная стратегия", nextStep: -1 }
                ]
            }
        ],
        rewardPerStep: 10,
        completionBonus: 30,
        maxAttempts: 1
    },

    // НАСТРОЙКИ МАГАЗИНА (ОБНОВЛЕННЫЕ КАРТИНКИ)
    store: {
        title: "Магазин призов",
        items: [
            {
                id: 1,
                name: "Фирменная ручка АГРОЭКО",
                description: "Стильная ручка с логотипом компании для повседневных записей.",
                price: 30,
                image: "https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
            },
            {
                id: 2,
                name: "Набор экопродукции",
                description: "Вкуснейшие продукты от АГРОЭКО: свежие овощи и экологичное мясо.",
                price: 60,
                image: "https://images.unsplash.com/photo-1542838132-92c53300491e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
            },
            {
                id: 3,
                name: "Фирменная футболка",
                description: "Качественная хлопковая футболка с символикой АГРОЭКО.",
                price: 80,
                image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
            },
            {
                id: 4,
                name: "Экскурсия на ферму + полный набор",
                description: "Увлекательная экскурсия на современную свиноферму компании + все призы!",
                price: 100,
                image: "https://images.unsplash.com/photo-1589923188937-cb64779f4abe?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80"
            }
        ]
    }
};
