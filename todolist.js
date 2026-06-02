// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {
    // Select elements
    const todoForm = document.getElementById('todoForm');
    const todoInput = document.getElementById('todoInput');
    const todoPriority = document.getElementById('todoPriority');
    const todoCategory = document.getElementById('todoCategory');
    const todoDeadline = document.getElementById('todoDeadline');
    
    const todoList = document.getElementById('todoList');
    const emptyState = document.getElementById('emptyState');
    const itemsLeft = document.getElementById('itemsLeft');
    const clearCompletedBtn = document.getElementById('clearCompletedBtn');
    
    const filterBtns = document.querySelectorAll('.filter-btn');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    const searchInput = document.getElementById('searchInput');
    const catFilterBtns = document.querySelectorAll('.cat-filter-btn');
    
    const currentDateEl = document.getElementById('currentDate');
    const currentTimeEl = document.getElementById('currentTime');
    
    // Application state
    let todos = JSON.parse(localStorage.getItem('todos')) || [];
    let currentFilter = 'all';
    let currentCategoryFilter = 'all';
    let searchQuery = '';
    let editingTodoId = null;

    // Initialize application
    init();

    function init() {
        // Event listeners
        todoForm.addEventListener('submit', handleAddTodo);
        clearCompletedBtn.addEventListener('click', handleClearCompleted);
        themeToggleBtn.addEventListener('click', toggleTheme);
        
        // Task List Filter tabs (All, Active, Completed)
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentFilter = e.target.dataset.filter;
                renderTodos();
            });
        });

        // Category Filter pills
        catFilterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                catFilterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                currentCategoryFilter = e.target.dataset.category;
                renderTodos();
            });
        });

        // Real-time search
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value.toLowerCase().trim();
            renderTodos();
        });

        // Setup theme from local storage
        const savedTheme = localStorage.getItem('theme') || 'dark';
        document.documentElement.setAttribute('data-theme', savedTheme);
        updateThemeIcon(savedTheme);

        // Start Clock
        updateClock();
        setInterval(updateClock, 1000);

        // Initial render
        renderTodos();
    }

    // Live Date and Time Display
    function updateClock() {
        const now = new Date();
        
        // Date format: e.g., "Monday, June 2, 2026"
        const dateOptions = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        currentDateEl.textContent = now.toLocaleDateString('en-US', dateOptions);
        
        // Time format: e.g., "02:04:15 AM"
        currentTimeEl.textContent = now.toLocaleTimeString('en-US', { hour12: true });
    }

    // Add a new todo item
    function handleAddTodo(e) {
        e.preventDefault();
        const text = todoInput.value.trim();
        if (text === '') return;

        const newTodo = {
            id: Date.now().toString(),
            text: text,
            priority: todoPriority.value, // low, medium, high
            category: todoCategory.value, // Personal, Work, Study
            deadline: todoDeadline.value || null, // date string or null
            completed: false
        };

        todos.unshift(newTodo); // Add to beginning
        saveToLocalStorage();
        renderTodos();

        // Reset text input and date picker, leave priority and category intact
        todoInput.value = '';
        todoDeadline.value = '';
        todoInput.focus();
    }

    // Toggle todo completion
    function toggleTodo(id) {
        // Prevent action if inline editing is active on this specific item
        if (editingTodoId === id) return;

        todos = todos.map(todo => {
            if (todo.id === id) {
                return { ...todo, completed: !todo.completed };
            }
            return todo;
        });
        saveToLocalStorage();
        renderTodos();
    }

    // Delete a single todo item
    function deleteTodo(id) {
        const itemElement = document.querySelector(`[data-id="${id}"]`);
        if (itemElement) {
            itemElement.style.animation = 'slideOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            itemElement.addEventListener('animationend', () => {
                todos = todos.filter(todo => todo.id !== id);
                if (editingTodoId === id) editingTodoId = null;
                saveToLocalStorage();
                renderTodos();
            });
        } else {
            todos = todos.filter(todo => todo.id !== id);
            if (editingTodoId === id) editingTodoId = null;
            saveToLocalStorage();
            renderTodos();
        }
    }

    // Inline Edit trigger
    function startEditTodo(id) {
        editingTodoId = id;
        renderTodos();
        
        // Focus the edit text field
        const itemElement = document.querySelector(`[data-id="${id}"]`);
        if (itemElement) {
            const input = itemElement.querySelector('.edit-input');
            if (input) {
                input.focus();
                // Move cursor to the end of the text
                const val = input.value;
                input.value = '';
                input.value = val;
            }
        }
    }

    // Save edited todo text
    function saveEditTodo(id, newText) {
        const trimmed = newText.trim();
        if (trimmed !== '') {
            todos = todos.map(todo => {
                if (todo.id === id) {
                    return { ...todo, text: trimmed };
                }
                return todo;
            });
            saveToLocalStorage();
        }
        editingTodoId = null;
        renderTodos();
    }

    // Cancel edit
    function cancelEditTodo() {
        editingTodoId = null;
        renderTodos();
    }

    // Clear completed tasks
    function handleClearCompleted() {
        // Animate all completed items first
        const completedElements = document.querySelectorAll('.todo-item.completed');
        if (completedElements.length === 0) return;

        let animatedCount = 0;
        completedElements.forEach(el => {
            el.style.animation = 'slideOut 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards';
            el.addEventListener('animationend', () => {
                animatedCount++;
                if (animatedCount === completedElements.length) {
                    todos = todos.filter(todo => !todo.completed);
                    if (todos.every(t => t.id !== editingTodoId)) editingTodoId = null;
                    saveToLocalStorage();
                    renderTodos();
                }
            });
        });
    }

    // Theme toggle
    function toggleTheme() {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        updateThemeIcon(newTheme);
    }

    function updateThemeIcon(theme) {
        const icon = themeToggleBtn.querySelector('i');
        if (theme === 'light') {
            icon.className = 'fa-solid fa-sun';
        } else {
            icon.className = 'fa-solid fa-moon';
        }
    }

    // Save state to LocalStorage
    function saveToLocalStorage() {
        localStorage.setItem('todos', JSON.stringify(todos));
    }

    // Count and update active tasks counter
    function updateCounter() {
        const activeCount = todos.filter(todo => !todo.completed).length;
        itemsLeft.textContent = activeCount;
    }

    // Helper: Check if a deadline date has passed (ignoring time)
    function isOverdue(deadlineStr) {
        if (!deadlineStr) return false;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const deadline = new Date(deadlineStr);
        deadline.setHours(0, 0, 0, 0);
        return deadline < today;
    }

    // Helper: Format date for presentation (e.g. "Jun 5, 2026")
    function formatDeadline(deadlineStr) {
        if (!deadlineStr) return '';
        const date = new Date(deadlineStr);
        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    // Render the to-do list onto the screen
    function renderTodos() {
        // Filter and Search todos based on active filters
        const filteredTodos = todos.filter(todo => {
            // 1. Completion state filter (All, Active, Completed)
            if (currentFilter === 'active' && todo.completed) return false;
            if (currentFilter === 'completed' && !todo.completed) return false;
            
            // 2. Category tag filter (All Cats, Personal, Work, Study)
            if (currentCategoryFilter !== 'all' && todo.category !== currentCategoryFilter) return false;
            
            // 3. Search query match
            if (searchQuery !== '' && !todo.text.toLowerCase().includes(searchQuery)) return false;

            return true;
        });

        // Toggle empty state visibility
        if (filteredTodos.length === 0) {
            todoList.style.display = 'none';
            emptyState.style.display = 'flex';
        } else {
            todoList.style.display = 'flex';
            emptyState.style.display = 'none';
        }

        // Render items
        todoList.innerHTML = '';
        filteredTodos.forEach(todo => {
            const li = document.createElement('li');
            li.className = `todo-item priority-${todo.priority} ${todo.completed ? 'completed' : ''}`;
            li.setAttribute('data-id', todo.id);

            // 1. Upper / Main row layout
            const mainRow = document.createElement('div');
            mainRow.className = 'todo-item-main';

            // Check if this item is currently being edited
            if (editingTodoId === todo.id) {
                // Render Edit Input Field inline
                const editWrapper = document.createElement('div');
                editWrapper.className = 'edit-input-wrapper';

                const editInput = document.createElement('input');
                editInput.type = 'text';
                editInput.className = 'edit-input';
                editInput.value = todo.text;
                
                // Allow save on Enter key
                editInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        saveEditTodo(todo.id, editInput.value);
                    } else if (e.key === 'Escape') {
                        cancelEditTodo();
                    }
                });

                const saveBtn = document.createElement('button');
                saveBtn.className = 'btn-save-edit';
                saveBtn.setAttribute('aria-label', 'Save edit');
                saveBtn.innerHTML = '<i class="fa-solid fa-check"></i>';
                saveBtn.addEventListener('click', () => saveEditTodo(todo.id, editInput.value));

                const cancelBtn = document.createElement('button');
                cancelBtn.className = 'btn-cancel-edit';
                cancelBtn.setAttribute('aria-label', 'Cancel edit');
                cancelBtn.innerHTML = '<i class="fa-solid fa-xmark"></i>';
                cancelBtn.addEventListener('click', cancelEditTodo);

                editWrapper.appendChild(editInput);
                editWrapper.appendChild(saveBtn);
                editWrapper.appendChild(cancelBtn);
                mainRow.appendChild(editWrapper);
            } else {
                // Render standard interactive Checkbox + text display
                const leftWrapper = document.createElement('div');
                leftWrapper.className = 'todo-item-left';
                leftWrapper.addEventListener('click', () => toggleTodo(todo.id));

                const checkbox = document.createElement('div');
                checkbox.className = 'custom-checkbox';
                checkbox.innerHTML = '<i class="fa-solid fa-check"></i>';

                const textSpan = document.createElement('span');
                textSpan.className = 'todo-item-text';
                textSpan.textContent = todo.text;

                leftWrapper.appendChild(checkbox);
                leftWrapper.appendChild(textSpan);
                mainRow.appendChild(leftWrapper);

                // Action buttons (Edit & Delete)
                const actionsWrapper = document.createElement('div');
                actionsWrapper.className = 'todo-actions';

                const editBtn = document.createElement('button');
                editBtn.className = 'btn-edit';
                editBtn.setAttribute('aria-label', `Edit task: ${todo.text}`);
                editBtn.innerHTML = '<i class="fa-solid fa-pen"></i>';
                editBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    startEditTodo(todo.id);
                });

                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'btn-delete';
                deleteBtn.setAttribute('aria-label', `Delete task: ${todo.text}`);
                deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
                deleteBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    deleteTodo(todo.id);
                });

                actionsWrapper.appendChild(editBtn);
                actionsWrapper.appendChild(deleteBtn);
                mainRow.appendChild(actionsWrapper);
            }

            // 2. Sub metadata row layout (Category pill + Deadline label + Priority name tag)
            const subRow = document.createElement('div');
            subRow.className = 'todo-item-sub';

            // Category tag
            const catBadge = document.createElement('span');
            catBadge.className = `category-badge cat-${todo.category.toLowerCase()}`;
            catBadge.textContent = todo.category;
            subRow.appendChild(catBadge);

            // Priority text badge
            const prioBadge = document.createElement('span');
            prioBadge.className = `priority-tag prio-${todo.priority}`;
            prioBadge.textContent = `${todo.priority} Priority`;
            subRow.appendChild(prioBadge);

            // Deadline date warning badge (if set)
            if (todo.deadline) {
                const deadlineBadge = document.createElement('span');
                const overdue = isOverdue(todo.deadline) && !todo.completed;
                deadlineBadge.className = `deadline-badge ${overdue ? 'overdue' : ''}`;
                
                deadlineBadge.innerHTML = overdue 
                    ? `<i class="fa-solid fa-triangle-exclamation"></i> Overdue: ${formatDeadline(todo.deadline)}` 
                    : `<i class="fa-regular fa-clock"></i> Due: ${formatDeadline(todo.deadline)}`;
                
                subRow.appendChild(deadlineBadge);
            }

            li.appendChild(mainRow);
            li.appendChild(subRow);
            todoList.appendChild(li);
        });

        // Update counter
        updateCounter();
    }
});
