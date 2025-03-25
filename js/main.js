const MAX_CARDS_COLUMN_1 = 3;
const MAX_CARDS_COLUMN_2 = 5;
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
    template: `
        <div class="card">
            {{ card.title }}
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
            <button @click="moveCard(1)">Нужно сделать</button>
            <button @click="moveCard(2)">В процессе</button>
            <button @click="moveCard(3)">Завершено</button>
            <button @click="deleteCard">Удалить</button>
        </div>
    `,
    methods: {
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
            <input type="text" v-model="newTaskTitle" :placeholder="'Название новой задачи'">
            <button @click="addCard">Добавить задачу</button>
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
        }
    },
    methods: {
        getColumnTitle(column) {
            switch (column) {
                case 1: return 'Нужно сделать';
                case 2: return 'В процессе';
                case 3: return 'Завершено';
                default: return '';
            }
        },
        addCard() {
            if (this.newTaskTitle.trim() === '') {
                alert('Введите название задачи!');
                return;
            }
            if (Number(this.columnIndex) === 0 && this.column1CardCount >= MAX_CARDS_COLUMN_1) {
                alert('В первом столбце находится максимальное количество карточек!');
                return;
            }
            if (Number(this.columnIndex) === 1 && this.column2CardCount >= MAX_CARDS_COLUMN_2) {
                alert('Во втором столбце находится максимальное количество карточек!');
                return;
            }
            const newCard = {
                title: this.newTaskTitle,
                column: Number(this.columnIndex) + 1,
                items: [],
                newItemText: ''
            };
            this.$root.cards.push(newCard);
            this.newTaskTitle = '';
        },
        moveCard(card, column) {
            if (column === 1 && this.column1CardCount >= MAX_CARDS_COLUMN_1) {
                alert('В первом столбце находится максимальное количество карточек!');
                return;
            }
            if (column === 2 && this.column2CardCount >= MAX_CARDS_COLUMN_2) {
                alert('Во втором столбце находится максимальное количество карточек!');
                return;
            }
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
        columns: [{}, {}, {}],
        cards: [
            { column: 1, title: 'Задача 1', items: [], newItemText: '' },
            { column: 2, title: 'Задача 2', items: [], newItemText: '' },
            { column: 3, title: 'Задача 3', items: [], newItemText: '' }
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