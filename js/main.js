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
            editedDeadline: this.card.deadline
        };
    },
    template: `
        <div class="card">
            <div v-if="!isEditing">
                <h4>{{ card.title }}</h4>
                <p v-if="card.description">Описание: {{ card.description }}</p>
                <p v-if="card.deadline">Дедлайн: {{ card.deadline }}</p>
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
                <button @click="moveCard(1)">Запланированные задачи</button>
                <button @click="moveCard(2)">Задачи в работе</button>
                <button @click="moveCard(3)">Тестирование</button>
                <button @click="moveCard(4)">Выполненные задачи</button>
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
        addItem() {
            if (this.card.newItemText.trim() !== '') {
                this.card.items.push({ text: this.card.newItemText, checked: false });
                this.card.newItemText = '';
                this.checkAndMoveCard(this.card);
            }
        },
        moveCard(column) {
            this.$emit('move-card', this.card, column);
        },
        deleteCard() {
            this.$emit('delete-card', this.card);
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

Vue.component('column-component', {
    props: ['column', 'columnIndex'],
    template: `
        <div class="task-column" :id="'column' + (Number(columnIndex) + 1)">
            <h3>{{ getColumnTitle(Number(columnIndex) + 1) }}</h3>
            <div v-if="isFirstColumn">
                <input type="text" v-model="newTaskTitle" placeholder="Название задачи"><br>
                <textarea v-model="newTaskDescription" placeholder="Описание задачи"></textarea><br>
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
                newItemText: '' 
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