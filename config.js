// CONFIG.JS - КОНФИГУРАЦИЯ ПРИЛОЖЕНИЯ
// ВСЕ ТЕКСТЫ И НАСТРОЙКИ МЕНЯЮТСЯ ЗДЕСЬ

window.config = {
    // НАСТРОЙКИ ТЕСТА
    quiz: {
        title: "Тест: Знакомство с AgroEco",
        questions: [
            {
                question: "В каком году была основана компания AgroEco?",
                answers: ["1994 год", "2005 год", "2012 год"],
                correct: 0
            },
            {
                question: "Какой главный принцип растениеводства в AgroEco?",
                answers: ["Традиционное земледелие", "Органическое земледелие без химии", "Высокоэффективное точное земледелие"],
                correct: 2
            },
            {
                question: "Какую уникальную технологию свиноводства использует компания?",
                answers: ["Выгульное содержание", "Многофазная система содержания", "Домашнее фермерское содержание"],
                correct: 1
            },
            {
                question: "Что является основой кормовой базы для животных в AgroEco?",
                answers: ["Покупные комбикорма", "Собственные экологически чистые корма", "Импортные кормовые добавки"],
                correct: 1
            },
            {
                question: "Какой из этих лозунгов отражает философию AgroEco?",
                answers: ["«Больше урожая любой ценой»", "«Заботимся о земле и животных»", "«Скорость и эффективность»"],
                correct: 1
            }
        ],
        rewardPerQuestion: 3
    },

    // НАСТРОЙКИ КВЕСТА
    quest: {
        title: "Квест: Путь к успеху AgroEco",
        steps: [
            {
                description: "Вы - новый агроном в компании AgroEco. Ваша первая задача - выбрать стратегию для повышения урожайности. Что вы выберете?",
                image: "https://agroeco.ru/upload/iblock/195/195dccd6cae13283778c803d7560c98f.jpg",
                options: [
                    { text: "Интенсивное использование химикатов", nextStep: -1 },
                    { text: "Внедрение точного земледелия и современных технологий", nextStep: 1, correct: true },
                    { text: "Оставить всё как есть", nextStep: -1 }
                ]
            },
            {
                description: "Отличный выбор! Теперь в свиноводческом комплексе. Как обеспечить лучшие условия для животных?",
                image: "https://agroeco.ru/upload/iblock/48b/48b0d2e7e534ed1c5d2c0d72c6c6c7c1.jpg",
                options: [
                    { text: "Минимальные затраты на содержание", nextStep: -1 },
                    { text: "Многофазная система и современные технологии содержания", nextStep: 2, correct: true },
                    { text: "Традиционные методы", nextStep: -1 }
                ]
            },
            {
                description: "Правильно! Финальный этап - производство кормов. Какой подход соответствует философии AgroEco?",
                image: "https://agroeco.ru/upload/iblock/4c4/4c4c4b4e4f4b4c4a4d4e4f4a4b4c4d4e.jpg",
                options: [
                    { text: "Закупка дешёвых кормов", nextStep: -1 },
                    { text: "Полный цикл производства собственных экологичных кормов", nextStep: 3, correct: true },
                    { text: "Смешанная стратегия", nextStep: -1 }
                ]
            },
            {
                description: "Поздравляем! Вы успешно прошли все этапы и поняли философию AgroEco - современные технологии и забота о природе и животных!",
                image: "https://agroeco.ru/upload/iblock/7a7/7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a7a.jpg",
                options: []
            }
        ],
        rewardPerStep: 5
    },

    // НАСТРОЙКИ МАГАЗИНА
    store: {
        title: "Магазин призов",
        items: [
            {
                id: 1,
                name: "Фирменная ручка AgroEco",
                description: "Стильная ручка с логотипом компании для повседневных записей.",
                price: 15,
                image: "https://via.placeholder.com/200x200/4CAF50/FFFFFF?text=Ручка+AgroEco"
            },
            {
                id: 2,
                name: "Экскурсия на ферму",
                description: "Увлекательная экскурсия на современную свиноферму компании. Увидите всё своими глазами!",
                price: 100,
                image: "https://via.placeholder.com/200x200/388E3C/FFFFFF?text=Экскурсия+на+ферму"
            },
            {
                id: 3,
                name: "Набор экопродукции",
                description: "Вкуснейшие продукты от AgroEco: свежие овощи и экологичное мясо.",
                price: 50,
                image: "https://via.placeholder.com/200x200/8BC34A/FFFFFF?text=Набор+Экопродукции"
            },
            {
                id: 4,
                name: "Фирменная футболка",
                description: "Качественная хлопковая футболка с символикой AgroEco.",
                price: 30,
                image: "https://via.placeholder.com/200x200/4CAF50/FFFFFF?text=Футболка+AgroEco"
            }
        ]
    }
};
