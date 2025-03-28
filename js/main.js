const STORAGE_KEY = 'vue-kanban-data'; // Ключ, под которым хранятся данные в localStorage

Vue.component('task-component', {
    props: ['item', 'card'], //с  tasks переименовала на item
    template: `
        <li>
            <input type="checkbox" v-model="item.checked" @change="checkAndMoveCard">
            {{ item.text }}
        </li>
    `,
    methods: {
        checkAndMoveCard() {
            this.$emit('check-and-move-card', this.card);
        }
    }
});

Vue.component('card-component', {
    props: ['card', 'column'],
    data() {
        return {
            isEditing: false,
            editedTitle: this.card.title,
            editedDescription: this.card.description,
            editedDeadline: this.card.deadline,
            returnReasonInput: '' 
        };
    },
    template: `
        <div class="card">
            <div v-if="!isEditing">
                <h4>{{ card.title }}</h4>
                <p v-if="card.description">Описание: {{ card.description }}</p>
                <p v-if="card.deadline">Дедлайн: {{ card.deadline }}</p>
                <p>Создано: {{ formatDate(card.createdAt) }}</p>
                <p v-if="card.updatedAt && card.updatedAt !== card.createdAt">
                    Последнее редактирование: {{ formatDate(card.updatedAt) }}
                </p>
                <p v-if="card.returnReason">Причина возврата: {{ card.returnReason }}</p> 
                <div v-if="card.title">
                    <ul>
                        <task-component
                            v-for="(item, index) in card.items"
                            :key="index"
                            :item="item"
                            :card="card"
                            @check-and-move-card="checkAndMoveCard"
                        ></task-component>
                    </ul>
                    <input type="text" v-model="card.newItemText" placeholder="Новый пункт списка">
                    <button class="add-item-button" @click="addItem">Добавить пункт</button>
                </div>
                <button v-if="column === 1" @click="startEditing">Редактировать</button>
                <template v-if="card.column === 1">
                    <button @click="moveCard(2)">В работу</button>
                </template>
                <template v-if="card.column === 2">
                    <button @click="moveCard(3)">В тестирование</button>
                </template>
                <template v-if="card.column === 3">
                    <button @click="moveCard(4)">Выполнено</button>
                    <button @click="showReturnReasonInput">Вернуть в работу</button> 
                    <div v-if="showReturnReason">
                        <input type="text" v-model="returnReasonInput" placeholder="Причина возврата">
                        <button @click="returnToWork">Подтвердить возврат</button>
                        <button @click="cancelReturn">Отмена</button>
                    </div>
                </template>
                <button @click="deleteCard">Удалить</button>
            </div>
            <div v-else>
                <input type="text" v-model="editedTitle" placeholder="Заголовок">
                <textarea v-model="editedDescription" placeholder="Описание"></textarea>
                <input type="date" v-model="editedDeadline">
                <button @click="saveChanges">Сохранить</button>
                <button @click="cancelEditing">Отмена</button>
            </div>
        </div>
    `,
    methods: {
        startEditing() {
            this.isEditing = true;
            this.editedTitle = this.card.title;
            this.editedDescription = this.card.description;
            this.editedDeadline = this.card.deadline;
        },
        saveChanges() {
            this.card.title = this.editedTitle;
            this.card.description = this.editedDescription;
            this.card.deadline = this.editedDeadline;
            this.card.updatedAt = new Date();
            this.isEditing = false;
        },
        cancelEditing() {
            this.isEditing = false;
        },
        showReturnReasonInput() {
            this.showReturnReason = true; 
        },
        returnToWork() {
            if (this.returnReasonInput.trim() !== '') {
                this.card.returnReason = this.returnReasonInput;
                this.moveCard(2); 
                this.showReturnReason = false; 
                this.returnReasonInput = ''; 
            } else {
                alert('Пожалуйста, укажите причину возврата.');
            }
        },
        cancelReturn() {
            this.showReturnReason = false; 
            this.returnReasonInput = ''; 
        },
        formatDate(dateString) {
            const date = new Date(dateString);
            const day = date.getDate().toString().padStart(2, '0');
            const month = (date.getMonth() + 1).toString().padStart(2, '0');
            const year = date.getFullYear();
            const hours = date.getHours().toString().padStart(2, '0');
            const minutes = date.getMinutes().toString().padStart(2, '0');
            return `${day}.${month}.${year} ${hours}:${minutes}`;
        },
        addItem() {
            if (this.card.newItemText.trim() !== '') {
                this.card.items.push({ text: this.card.newItemText, checked: false });
                this.card.newItemText = '';
                this.checkAndMoveCard(this.card);
            }
        },
        moveCard(targetColumn) {
            const currentColumn = this.card.column;
            if (
                (currentColumn === 1 && targetColumn === 2) ||
                (currentColumn === 2 && targetColumn === 3) ||
                (currentColumn === 3 && (targetColumn === 4 || targetColumn === 2))
            ) {
                this.$emit('move-card', this.card, targetColumn);
            } else {
                alert('Нельзя переместить карточку в этот столбец!');
            }
        },
        showReturnReason: false,
        deleteCard() {
            this.$emit('delete-card', this.card);
        },
        checkAndMoveCard(card) {
            const totalItems = card.items.length;
            const checkedItems = card.items.filter(item => item.checked).length;
            const percentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

            if (percentage > 50 && percentage <= 100 && card.column === 2) { 
                this.moveCard(3);
            }
        }
    }
});

Vue.component('column-component', {
    props: ['column', 'columnIndex'],
    template: `
        <div class="task-column" :id="'column' + (Number(columnIndex) + 1)">
            <h3>{{ getColumnTitle(Number(columnIndex) + 1) }}</h3>
            <div v-if="isFirstColumn">
                <input type="text" v-model="newTaskTitle" placeholder="Название задачи"><br>
                <textarea class="textDescription" v-model="newTaskDescription" placeholder="Описание задачи"></textarea><br>
                <p>Выбери дедлайн:<input type="date" v-model="newTaskDeadline"></p><br>
                <button class="add-item-button" @click="addCard">Добавить задачу</button>
            </div>
            <div class="task-list" :id="'cards' + (Number(columnIndex) + 1)">
                <card-component
                    v-for="card in filteredCards"
                    :key="card.id"
                    :card="card"
                    :column="Number(columnIndex) + 1"
                    @move-card="moveCard"
                    @delete-card="deleteCard"
                    @check-and-move-card="checkAndMoveCard"
                ></card-component>
            </div>
        </div>
    `,
    data() {
        return {
            newTaskTitle: '',
            newTaskDescription: '',
            newTaskDeadline: ''
        };
    },
    computed: {
        filteredCards() {
            return this.$root.cards.filter(card => card.column === Number(this.columnIndex) + 1);
        },
        column1CardCount() {
            return this.$root.cards.filter(card => card.column === 1).length;
        },
        column2CardCount() {
            return this.$root.cards.filter(card => card.column === 2).length;
        },
        isFirstColumn() {
            return Number(this.columnIndex) === 0; // Явное приведение к числу
        }
    },
    methods: {
        getColumnTitle(column) {
            switch (column) {
                case 1: return 'Запланированные задачи';
                case 2: return 'Задачи в работе';
                case 3: return 'Тестирование';
                case 4: return 'Выполненные задачи'
                default: return '';
            }
        },
        addCard() {
            if (this.newTaskTitle.trim() === '') {
                alert('Введите название задачи!');
                return;
            }

            const newCard = {
                id: Date.now(),
                title: this.newTaskTitle,
                description: this.newTaskDescription,
                deadline: this.newTaskDeadline,
                createdAt: new Date(),
                updatedAt: new Date(),
                column: Number(this.columnIndex) + 1,
                items: [],
                newItemText: ''
            };
            this.$root.cards.push(newCard);
            this.newTaskTitle = '';
            this.newTaskDescription = '';
            this.newTaskDeadline = '';
        },
        moveCard(card, column) {
            card.column = column;
        },
        deleteCard(card) {
            const index = this.$root.cards.indexOf(card);
            if (index > -1) {
                this.$root.cards.splice(index, 1);
            }
        },
        checkAndMoveCard(card) {
            const totalItems = card.items.length;
            const checkedItems = card.items.filter(item => item.checked).length;
            const percentage = totalItems > 0 ? (checkedItems / totalItems) * 100 : 0;

            if (percentage > 50 && percentage < 100) {
                this.moveCard(2);
            } else if (percentage === 100) {
                this.moveCard(3);
            }
        }
    }
});

new Vue({
    el: '#app',
    data: {
        columns: [{}, {}, {}, {}],
        cards: [
            { 
                id: 1, 
                column: 1, 
                title: 'Задача 1', 
                description: 'Описание задачи 1', 
                deadline: '2024-12-31', 
                createdAt: new Date(), 
                updatedAt: new Date(), 
                items: [], 
                newItemText: '',
                returnReason: '' 
            },
            { 
                id: 2, 
                column: 2, 
                title: 'Задача 2', 
                description: 'Описание задачи 2', 
                deadline: '2024-11-30', 
                createdAt: new Date(), 
                updatedAt: new Date(), 
                items: [], 
                newItemText: '' 
            },
            { 
                id: 3, 
                column: 3, 
                title: 'Задача 3', 
                description: 'Описание задачи 3', 
                deadline: '2024-10-31', 
                createdAt: new Date(), 
                updatedAt: new Date(), 
                items: [], 
                newItemText: '' 
            }
        ]
    },
    created() {
        this.loadData();
    },
    watch: {
        cards: {
            handler: 'saveData',
            deep: true
        }
    },
    methods: {
        saveData() {
            const serializedData = JSON.stringify(this.cards);
            localStorage.setItem(STORAGE_KEY, serializedData);
        },
        loadData() {
            const serializedData = localStorage.getItem(STORAGE_KEY);
            if (serializedData) {
                try {
                    this.cards = JSON.parse(serializedData);
                } catch (error) {
                    console.error('Ошибка при парсинге данных из localStorage:', error);
                }
            }
        }
    }
});