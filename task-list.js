// Кэширование, храним список задач
// Объект под задачи
let cache = {};
// Флаг, сингализирующий о том, что кэш есть и его надо использовать
let isCached = false;

// Добавить задачу в хранилище
function addCache(task) {
    cache[task.cacheId] = task;
    localStorage.setItem("cache", JSON.stringify(cache));
}

// Удалить задачу из хранилища
function removeCache(id) {
    delete cache[id];
    localStorage.setItem("cache", JSON.stringify(cache));
}

// Компонент
class TaskList extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Создаём начальную разметку компонента, css приходится писать, так как для fetch требуется сервер
    this.shadowRoot.innerHTML = `
      <style>
        /* Встроенные стили, аналогичные CSS-файлу */
        :host {
          display: block;
          font-family: Arial, sans-serif;
          max-width: 400px;
          margin: 20px auto;
          padding: 10px;
          border: 1px solid #ccc;
          border-radius: 8px;
          background: #fafafa;
        }
        .task-form {
          display: flex;
          gap: 8px;
          margin-bottom: 20px;
        }
        .task-input {
          flex: 1;
          padding: 6px 8px;
          font-size: 16px;
        }
        .add-btn {
          padding: 6px 12px;
          font-size: 16px;
          cursor: pointer;
        }
        .task-list {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .task-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 10px;
          border-bottom: 1px solid #ddd;
          transition: background 0.3s;
        }
        .task-item:hover {
          background-color: #f0f0f0;
        }
        .task-text {
          flex: 1;
          margin-left: 8px;
        }
        .task-text.completed {
          text-decoration: line-through;
          color: #888888e0;
        }
        .task-buttons {
          display: flex;
          gap: 8px;
        }
        button {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 4px 8px;
          transition: color 0.2s;
        }
        button:hover {
          color: #257e0a;
        }
      </style>
      <form class="task-form">
        <input type="text" class="task-input" placeholder="Введите задачу" required />
        <button type="submit" class="add-btn">Добавить</button>
      </form>
      <ul class="task-list"></ul>
    `;

    this.tasks = [];
    this.taskIdCounter = 0;

    // Элементы интерфейса
    this.form = this.shadowRoot.querySelector('.task-form');
    this.input = this.shadowRoot.querySelector('.task-input');
    this.taskListEl = this.shadowRoot.querySelector('.task-list');

    // Обработчик добавления задачи
    this.form.addEventListener('submit', (e) => {
      e.preventDefault();
      const taskText = this.input.value.trim();
      if (taskText !== '') {
        this.addTask(taskText);
        this.input.value = '';
      }
    });

    // Если в хранилище есть задачи с прошлых сессий
    if (isCached) {
      const copyCache = structuredClone(cache);
      cache = {};
      for (const key in copyCache) {
        const task = copyCache[key];
        this.addTask(task.text, task.completed);
      }
    }
  }

  // Метод для добавления задачи
  addTask(text, completed = false) {
    const task = {
      id: this.taskIdCounter++,
      text: text,
      completed: completed,
      cacheId: `${Date.now()}-${this.taskIdCounter}-${text}`,
    };
    this.tasks.push(task);

    addCache(task);
    this.renderTask(task);
  }

  // Метод для рендера одной задачи (минимальная перерисовка)
  renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    li.innerHTML = `
      <input type="checkbox" ${task.completed ? 'checked' : ''} />
      <span class="task-text ${task.completed ? 'completed' : ''}">${task.text}</span>
      <div class="task-buttons">
        <button class="delete-btn" title="Удалить">&times;</button>
      </div>
    `;

    // Обработчики для чекбокса и кнопки удаления
    const checkbox = li.querySelector('input[type="checkbox"]');
    const deleteBtn = li.querySelector('.delete-btn');

    checkbox.addEventListener('change', () => {
      this.toggleTaskCompletion(task.id);
    });

    deleteBtn.addEventListener('click', () => {
      this.removeTask(task.id);
    });

    this.taskListEl.appendChild(li);
  }

  // Обновление статуса выполнения
  toggleTaskCompletion(id) {
    const task = this.tasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      localStorage.setItem("cache", JSON.stringify(cache)); // Кэшируем статус тоже, чтобы работало
      this.updateTaskRender(id);
    }
  }

  // Удаление задачи
  removeTask(id) {
    const cacheId = this.tasks.filter(t => t.id === id)[0]["cacheId"];
    this.tasks = this.tasks.filter(t => t.id !== id);
    const li = this.shadowRoot.querySelector(`li[data-id="${id}"]`);
    if (li) {
      this.taskListEl.removeChild(li);
      removeCache(cacheId);
    }
  }

  // Обновление отображения задачи (используется для изменения статуса)
  updateTaskRender(id) {
    const li = this.shadowRoot.querySelector(`li[data-id="${id}"]`);
    if (li) {
      const task = this.tasks.find(t => t.id === id);
      if (task) {
        const checkbox = li.querySelector('input[type="checkbox"]');
        const span = li.querySelector('.task-text');
        checkbox.checked = task.completed;
        if (task.completed) {
          span.classList.add('completed');
        } else {
          span.classList.remove('completed');
        }
      }
    }
  }
}

// Получаем кэш из хранилища, если есть
const save = localStorage.getItem("cache");
if (save) {
  cache = JSON.parse(save);
  isCached = true;
}

// Монтируем компонент
customElements.define('task-list', TaskList);


