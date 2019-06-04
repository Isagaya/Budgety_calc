// BUDGET CONTROLLER
var budgetController = (function() {
   
    var Expense = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
        this.percentage = -1;
    };

    Expense.prototype.calcPercentage = function (totalIncome) {
        if (totalIncome > 0) {
            this.percentage = Math.round((this.value / totalIncome) * 100);
        } else {
            this.percentage = -1;
        }
    };

    Expense.prototype.getPercentage = function () {
        return this.percentage;
    };

    var Income = function(id, description, value) {
        this.id = id;
        this.description = description;
        this.value = value;
    };

    var calculateTotal = function(type) {
        var sum = 0;

        data.allItems[type].forEach(function(cur) {
            sum += cur.value;
        });

        data.totals[type] = sum;
    };

    var data = {
        allItems: {
            exp: [],
            inc: []
        },
        totals: {
            exp: 0,
            inc: 0
        },
        budget: 0,
        percentage: -1
    };

    return {
        addItem: function(type, des, val) {
            var newItem, ID;

            // Создание айдишника
            if (data.allItems[type].length > 0) {
                ID = data.allItems[type][data.allItems[type].length - 1].id + 1;
            } else {
                ID = 0;
            }

            // Создает новое наименование, исходя из Поступления или Вычета (inc/exp)
            if (type === 'inc') {
                newItem = new Income(ID, des, val);
            } else if (type === 'exp') {
                newItem = new Expense(ID, des, val);
            }

            // Запись нового наименования в дату, в соответствующий type массив
            data.allItems[type].push(newItem);

            // Возвращение наименования, которое можно обработать другими функциями
            // содержит (ID, des, val)
            return newItem;
        },

        deleteItem: function(type, id) {
            var ids, index;

            ids = data.allItems[type].map(function(current) { // метод мап в отличии от форИч возвращает новый массив
                return current.id;
            });

            index = ids.indexOf(id); // метод проверет, какой индекс в массиве ids принадлежит id, если его нет, возвращает -1

            if (index !== -1) {
                data.allItems[type].splice(index, 1); // метод удаляет элементы массива, всего 1 элемент.

            };
        },

        calculateBudget: function () {
            // расчет всех пополнений и затрат
            calculateTotal('exp');
            calculateTotal('inc');

            // расчет в бюджете отдельно Пополнения и Затраты
            data.budget = data.totals.inc - data.totals.exp;

            // расчет процента затрат от пополнений
            if (data.totals.inc > 0) {
                data.percentage = Math.round((data.totals.exp / data.totals.inc) * 100);
            } else {
                data.percentage = -1;
            };
        },

        calculatePercentages: function () {
            data.allItems.exp.forEach(function (cur) {
                cur.calcPercentage(data.totals.inc);
            });
        },

        getPercentages: function () {
            var allPerc = data.allItems.exp.map(function (cur) {
                return cur.getPercentage();
            });
            return allPerc;
        },

        getBudget: function() {
            return {
                budget: data.budget,
                totalInc: data.totals.inc,
                totalExp: data.totals.exp,
                percentage: data.percentage
            }
        },

        testing: function() {
            console.log(data);
        }
    };

})();






// UI CONTROLLER
var UIController = (function() {

    var DOMstrings = {
        inputType: '.add__type',
        inputDescription: '.add__description',
        inputValue: '.add__value',
        inputBtn: '.add__btn',
        incomeContainer: '.income__list',
        expensesContainer: '.expenses__list',
        budgetLabel: '.budget__value',
        incomeLabel: '.budget__income--value',
        expenseLabel: '.budget__expenses--value',
        percentageLabel: '.budget__expenses--percentage',
        container: '.container',
        expensesPercLabel: '.item__percentage',
        dateLabel: '.budget__title--month'
    };

    var formatNumber = function (num, type) {

        var numSplit, int, dec;
        /*
            + или -  перед числом
            добавление 2 чисел после точки
            разделитель запятой тысячных частей

            2345.67210  -> 2,345.67
            2000 -> 2,000.00
        */

        num = Math.abs(num); // приведение числа к абсолютному значению (убираем знак минус)
        num = num.toFixed(2); // в данном случае, метод добавляет к числу 2 знака после точки (дробная часть), и округляет значение

        numSplit = num.split('.'); // превращаем число в массив, разделяющий между собой целую и дробную часть
        int = numSplit[0];

        if (int.length > 3) {
            int = int.substr(0, int.length - 3) + ',' + int.substr(int.length - 3, int.length);
        }

        dec = numSplit[1];

        return (type === 'exp' ? '-' : '+') + ' ' + int + '.' + dec;

    };

    var nodeListForEach = function(list, callback) {
        for (var i = 0; i < list.length; i++) {
            callback(list[i], i);
        }
    };

    return {
        getInput: function() {
            return {
                type: document.querySelector(DOMstrings.inputType).value, // inc или exp
                description: document.querySelector(DOMstrings.inputDescription).value,
                value: parseFloat(document.querySelector(DOMstrings.inputValue).value) 
            };
        },

        addListItem: function(obj, type) {
            var html, newHtml, element;
            
            // Создаем хтмл теги 
            if (type === 'inc') {
                element = DOMstrings.incomeContainer;
                html = '<div class="item clearfix" id="inc-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            } else if (type === 'exp') {
                element = DOMstrings.expensesContainer;
                html = '<div class="item clearfix" id="exp-%id%"><div class="item__description">%description%</div><div class="right clearfix"><div class="item__value">%value%</div><div class="item__percentage">21%</div><div class="item__delete"><button class="item__delete--btn"><i class="ion-ios-close-outline"></i></button></div></div></div>';
            }

            // Вставляем нужные данные из объекта заместо %плейсхолдер%
            newHtml = html.replace('%id%', obj.id);
            newHtml = newHtml.replace('%description%', obj.description);
            newHtml = newHtml.replace('%value%', formatNumber(obj.value, type));

            // Запихиваем хтмлку в ДОМ
            document.querySelector(element).insertAdjacentHTML('beforeend', newHtml);
        },

        deleteListItem: function (selectorID) {
            var el = document.getElementById(selectorID);
            el.parentNode.removeChild(el);  // поднимаемся выше, и удаляем чайлд элемент (трюк)
        },

        clearFields: function() {
            var fields, fieldsArr;
            
            fields = document.querySelectorAll(DOMstrings.inputDescription + ', ' + DOMstrings.inputValue);
            
            // трюк переведения листа значений fields в массив. Т.к. метод .slice() превращает в массив
            // он применяется к массивам и строковым значениям. У нас же лист, который мы превращаем в
            // массив с помощью конструктора массивов.
            fieldsArr = Array.prototype.slice.call(fields);

            fieldsArr.forEach(function(current, index, array) {
                current.value = '';
            });

            fieldsArr[0].focus();
        },

        displayBudget: function(obj) {
            var type;
            obj.budget > 0 ? type = 'inc' : type = 'exp';

            document.querySelector(DOMstrings.budgetLabel).textContent = formatNumber(obj.budget, type);
            document.querySelector(DOMstrings.incomeLabel).textContent = formatNumber(obj.totalInc, 'inc');
            document.querySelector(DOMstrings.expenseLabel).textContent = formatNumber(obj.totalExp, 'exp');

            if (obj.percentage > 0) {
                document.querySelector(DOMstrings.percentageLabel).textContent = obj.percentage + '%';
            } else {
                document.querySelector(DOMstrings.percentageLabel).textContent = '---';
            };
        },

        displayPercentages: function(percentages) {
            var fields = document.querySelectorAll(DOMstrings.expensesPercLabel);
            // fields = Array.prototype.slice.call(fields); 

            nodeListForEach(fields, function(current, index) {
                if (percentages[index] > 0) {
                    current.textContent = percentages[index] + '%';
                } else {
                    current.textContent = '---';
                }
            });

        },

        displayMonth: function () {
            var now, year, month, months;

            months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

            now = new Date();
            year = now.getFullYear();
            month = now.getMonth();

            document.querySelector(DOMstrings.dateLabel).textContent = months[month] + ' ' + year;

        },

        changedType: function () {

            var fields = document.querySelectorAll(DOMstrings.inputType + ',' + DOMstrings.inputValue + ',' + DOMstrings.inputDescription);
            nodeListForEach(fields, function(current) {
                current.classList.toggle('red-focus');
            });

            document.querySelector(DOMstrings.inputBtn).classList.toggle('red');

        },

        getDOMstrings: function() {
            return DOMstrings;
        }
    };
})();





// GLOBAL APP CONTROLLER
var controller = (function(budgetCtrl, UICtrl) {

    var setupEventListeners = function() {
        var DOM = UICtrl.getDOMstrings();
        var addBtn = document.querySelector(DOM.inputBtn);

        addBtn.addEventListener('click', ctrlAddItem);

        document.addEventListener('keypress', function(event) {
            if(event.keyCode === 13 || event.which === 13) {
                ctrlAddItem();
            };
        });

        document.querySelector(DOM.container).addEventListener('click', ctrlDeleteItem);

        document.querySelector(DOM.inputType).addEventListener('change', UICtrl.changedType);
    };

    var updateBudget = function () {
        budgetCtrl.calculateBudget();
        var budget = budgetCtrl.getBudget(); // возвращает посчитанные суммарные значения пополнений и затрат
        UICtrl.displayBudget(budget); // затем этот объект помещаем в качестве аргумента в новый метод
    };

    var updatePercentages = function () {
        // Расчет процентов
        budgetCtrl.calculatePercentages();

        // Чтение процентов из бюджет контроллера
        var percentages = budgetCtrl.getPercentages();

        // вывод процентов в UI
        UICtrl.displayPercentages(percentages);
    };
   

    // функция для обработки данных вводимых в поле
    var ctrlAddItem = function () {
        var input, newItem;

        input = UICtrl.getInput(); // обращается к методу UI контроллера, который возвращает объект со значениями инпутов

        if (input.description !== '' && !isNaN(input.value) && input.value > 0) {
            // Добавляем наименование в бюджет контроллер
            newItem = budgetCtrl.addItem(input.type, input.description, input.value);

            // Добавляем наименование в UI и отображаем его в калькуляторе
            UICtrl.addListItem(newItem, input.type);
            UICtrl.clearFields(); // очищаем поля

            updateBudget(); // обновление интерфейса

            updatePercentages(); // обновление процентов в полях
        }
    };

    var ctrlDeleteItem = function(event) {
        var itemID, splitID, type, ID;
        itemID = event.target.parentNode.parentNode.parentNode.parentNode.id;

        if (itemID) {
            // собираем данные об элементе
            splitID = itemID.split('-');
            type = splitID[0];
            ID = parseInt(splitID[1]);

            // удаляем элемент из даты (объект data)
            budgetCtrl.deleteItem(type, ID);

            // удаляем элемент из UI контроллера
            UICtrl.deleteListItem(itemID);

            // обновляем интерфейс
            updateBudget();
        };


    };

    return {
        init: function() {
            console.log('приложение запущено!');
            UICtrl.displayMonth();
            setupEventListeners();
            var budget = budgetCtrl.getBudget();
            UICtrl.displayBudget(budget);
        }
    };

})(budgetController, UIController);

controller.init();