
"use strict";

// ============================================
// TASKHIVE - TASK MANAGEMENT APPLICATION
// ============================================

const STORAGE = {
    tasks: "taskhive-tasks",
    projects: "taskhive-projects",
    members: "taskhive-members"
};

const $ = (selector) => document.querySelector(selector);

const taskList = $("#taskList");
const taskModal = $("#taskModal");
const taskForm = $("#taskForm");

let tasks = loadData(STORAGE.tasks, [
    {
        id: 1,
        title: "Design dashboard UI",
        category: "Design",
        priority: "High",
        status: "In Progress",
        dueDate: "",
        projectId: null,
        createdAt: 1
    },
    {
        id: 2,
        title: "Build authentication page",
        category: "Development",
        priority: "Medium",
        status: "To Do",
        dueDate: "",
        projectId: null,
        createdAt: 2
    },
    {
        id: 3,
        title: "Create project documentation",
        category: "Documentation",
        priority: "Low",
        status: "Completed",
        dueDate: "",
        projectId: null,
        createdAt: 3
    }
]);

let projects = loadData(STORAGE.projects, []);

let members = loadData(STORAGE.members, [
    {
        id: 1,
        name: "Viresh",
        role: "Workspace Owner"
    }
]);

let editingTaskId = null;

// ============================================
// STORAGE
// ============================================

function loadData(key, fallback) {
    try {
        const saved = localStorage.getItem(key);

        if (saved === null) {
            return fallback;
        }

        const parsed = JSON.parse(saved);

        return Array.isArray(parsed) ? parsed : fallback;
    } catch (error) {
        console.error(`Could not load ${key}:`, error);
        return fallback;
    }
}

function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`Could not save ${key}:`, error);
        alert("Unable to save data. Check your browser storage.");
        return false;
    }
}

function saveTasks() {
    return saveData(STORAGE.tasks, tasks);
}

function saveProjects() {
    return saveData(STORAGE.projects, projects);
}

function saveMembers() {
    return saveData(STORAGE.members, members);
}

// ============================================
// HELPERS
// ============================================

function createElement(tag, className, text) {
    const element = document.createElement(tag);

    if (className) {
        element.className = className;
    }

    if (text !== undefined) {
        element.textContent = text;
    }

    return element;
}

function getToday() {
    const date = new Date();

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

function isOverdue(task) {
    return Boolean(
        task.dueDate &&
        task.dueDate < getToday() &&
        task.status !== "Completed"
    );
}

function isValidDate(value) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00`);

    return !Number.isNaN(date.getTime()) &&
        date.toISOString().slice(0, 10) === value;
}

function priorityRank(priority) {
    return {
        High: 1,
        Medium: 2,
        Low: 3
    }[priority] ?? 4;
}

function formatDate(value) {
    if (!value || !isValidDate(value)) {
        return value || "";
    }

    const [year, month, day] = value.split("-");

    return `${day}/${month}/${year}`;
}

// ============================================
// TASK STATISTICS
// ============================================

function updateStatistics() {
    $("#totalTasks").textContent = tasks.length;

    $("#progressTasks").textContent = tasks.filter(
        task => task.status === "In Progress"
    ).length;

    $("#completedTasks").textContent = tasks.filter(
        task => task.status === "Completed"
    ).length;

    $("#overdueTasks").textContent = tasks.filter(isOverdue).length;
}

// ============================================
// SEARCH, FILTER AND SORT
// ============================================

function getVisibleTasks() {
    const search = $("#searchInput").value.trim().toLowerCase();
    const status = $("#statusFilter").value;
    const priority = $("#priorityFilter").value;
    const sort = $("#sortTasks").value;

    const result = tasks.filter(task => {
        const matchesSearch =
            task.title.toLowerCase().includes(search) ||
            task.category.toLowerCase().includes(search);

        const matchesStatus =
            status === "all" || task.status === status;

        const matchesPriority =
            priority === "all" || task.priority === priority;

        return matchesSearch && matchesStatus && matchesPriority;
    });

    result.sort((a, b) => {
        switch (sort) {
            case "oldest":
                return a.createdAt - b.createdAt;

            case "priority":
                return priorityRank(a.priority) -
                    priorityRank(b.priority);

            case "deadline":
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return a.dueDate.localeCompare(b.dueDate);

            case "title":
                return a.title.localeCompare(b.title);

            case "newest":
            default:
                return b.createdAt - a.createdAt;
        }
    });

    return result;
}

// ============================================
// RENDER TASKS
// ============================================

function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = getVisibleTasks();

    if (visibleTasks.length === 0) {
        const empty = createElement(
            "p",
            "subtitle",
            tasks.length === 0
                ? "No tasks yet. Create your first task!"
                : "No matching tasks. Try changing your filters."
        );

        empty.style.padding = "24px 0";
        taskList.appendChild(empty);
    }

    visibleTasks.forEach(task => {
        const row = createElement("article", "task-row");
        const details = createElement("div");

        const title = createElement("strong", "", task.title);

        const description = createElement(
            "p",
            "",
            `${task.category} · ${task.priority} priority`
        );

        if (task.dueDate) {
            description.textContent +=
                ` · Due: ${formatDate(task.dueDate)}`;
        }

        if (isOverdue(task)) {
            description.textContent += " · OVERDUE";
            description.style.color = "#d14343";
        }

        details.append(title, description);

        const actions = createElement("div", "task-actions");

        // Change task status
        const statusSelect = createElement(
            "select",
            "task-status-select"
        );

        statusSelect.setAttribute(
            "aria-label",
            `Status for ${task.title}`
        );

        ["To Do", "In Progress", "Completed"].forEach(status => {
            const option = createElement("option", "", status);

            option.value = status;
            option.selected = task.status === status;

            statusSelect.appendChild(option);
        });

        statusSelect.addEventListener("change", () => {
            task.status = statusSelect.value;

            if (saveTasks()) {
                renderAll();
            }
        });

        // Edit task
        const editButton = createElement(
            "button",
            "secondary-btn",
            "Edit"
        );

        editButton.type = "button";
        editButton.style.marginTop = "0";

        editButton.addEventListener("click", () => {
            openTaskModal(task);
        });

        // Delete task
        const deleteButton = createElement(
            "button",
            "delete-task",
            "Delete"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            if (!confirm(`Delete "${task.title}"?`)) {
                return;
            }

            const previousTasks = tasks;
            tasks = tasks.filter(item => item.id !== task.id);

            if (saveTasks()) {
                renderAll();
            } else {
                tasks = previousTasks;
                renderAll();
            }
        });

        actions.append(statusSelect, editButton, deleteButton);
        row.append(details, actions);
        taskList.appendChild(row);
    });

    $("#taskCount").textContent =
        `Showing ${visibleTasks.length} of ${tasks.length} tasks`;

    updateStatistics();
}

// ============================================
// TASK MODAL
// ============================================

function updateProjectDropdown(selectedId = "") {
    const select = $("#taskProject");

    select.replaceChildren(
        createElement("option", "", "No project")
    );

    select.options[0].value = "";

    projects.forEach(project => {
        const option = createElement(
            "option",
            "",
            project.name
        );

        option.value = String(project.id);
        option.selected = String(selectedId) === String(project.id);

        select.appendChild(option);
    });
}

function openTaskModal(task = null) {
    editingTaskId = task ? task.id : null;

    taskForm.reset();

    $("#taskCategory").value = "General";
    $("#taskPriority").value = "Medium";
    $("#taskStatus").value = "To Do";

    updateProjectDropdown(task?.projectId ?? "");

    if (task) {
        $("#taskTitle").value = task.title;
        $("#taskCategory").value = task.category;
        $("#taskPriority").value = task.priority;
        $("#taskStatus").value = task.status;
        $("#taskDueDate").value = task.dueDate || "";
        $("#taskProject").value = task.projectId
            ? String(task.projectId)
            : "";

        taskModal.querySelector("h2").textContent = "Edit Task";
        taskForm.querySelector('[type="submit"]').textContent =
            "Save Changes";
    } else {
        taskModal.querySelector("h2").textContent = "Create a Task";
        taskForm.querySelector('[type="submit"]').textContent =
            "Save Task";
    }

    if (!taskModal.open) {
        taskModal.showModal();
    }

    $("#taskTitle").focus();
}

function closeTaskModal() {
    taskModal.close();
    editingTaskId = null;
    taskForm.reset();
}

function handleTaskSubmit(event) {
    event.preventDefault();

    const title = $("#taskTitle").value.trim();
    const category = $("#taskCategory").value.trim() || "General";
    const priority = $("#taskPriority").value;
    const status = $("#taskStatus").value;
    const dueDate = $("#taskDueDate").value;
    const projectValue = $("#taskProject").value;

    if (!title) {
        alert("Please enter a task name.");
        return;
    }

    if (dueDate && !isValidDate(dueDate)) {
        alert("Please select a valid deadline.");
        return;
    }

    const projectId = projectValue ? Number(projectValue) : null;

    const taskData = {
        title,
        category,
        priority,
        status,
        dueDate,
        projectId
    };

    const previousTasks = tasks;

    if (editingTaskId !== null) {
        tasks = tasks.map(task =>
            task.id === editingTaskId
                ? { ...task, ...taskData }
                : task
        );
    } else {
        tasks.unshift({
            id: Date.now(),
            ...taskData,
            createdAt: Date.now()
        });
    }

    if (!saveTasks()) {
        tasks = previousTasks;
        return;
    }

    closeTaskModal();
    renderAll();
}

// ============================================
// PROJECT MANAGEMENT
// ============================================

function renderProjects() {
    const projectList = $("#projectList");

    projectList.replaceChildren();

    if (projects.length === 0) {
        projectList.appendChild(
            createElement(
                "p",
                "subtitle",
                "No projects yet. Click + New Project to create one."
            )
        );

        return;
    }

    projects.forEach(project => {
        const card = createElement("article", "project-card");

        const title = createElement("h2", "", project.name);

        const description = createElement(
            "p",
            "",
            project.description || "No description provided."
        );

        const projectTasks = tasks.filter(
            task => String(task.projectId) === String(project.id)
        );

        const completed = projectTasks.filter(
            task => task.status === "Completed"
        ).length;

        const count = createElement(
            "p",
            "project-task-count",
            `${completed} of ${projectTasks.length} tasks completed`
        );

        const deleteButton = createElement(
            "button",
            "delete-task",
            "Delete project"
        );

        deleteButton.type = "button";

        deleteButton.addEventListener("click", () => {
            if (!confirm(`Delete project "${project.name}"?`)) {
                return;
            }

            const previousProjects = projects;
            const previousTasks = tasks;

            projects = projects.filter(
                item => item.id !== project.id
            );

            tasks = tasks.map(task =>
                task.projectId === project.id
                    ? { ...task, projectId: null }
                    : task
            );

            if (saveProjects() && saveTasks()) {
                renderAll();
            } else {
                projects = previousProjects;
                tasks = previousTasks;
                saveProjects();
                saveTasks();
                renderAll();
            }
        });

        card.append(title, description, count, deleteButton);
        projectList.appendChild(card);
    });
}

function addProject() {
    const name = prompt("Enter project name:");

    if (name === null || !name.trim()) {
        return;
    }

    const description = prompt(
        "Enter a short project description:",
        ""
    );

    if (description === null) {
        return;
    }

    const previousProjects = projects;

    projects.unshift({
        id: Date.now(),
        name: name.trim(),
        description: description.trim()
    });

    if (saveProjects()) {
        renderAll();
    } else {
        projects = previousProjects;
    }
}

// ============================================
// TEAM MEMBERS
// ============================================

function renderTeam() {
    const teamList = $("#teamList");

    teamList.replaceChildren();

    members.forEach(member => {
        const row = createElement("div", "team-member");

        const avatar = createElement(
            "div",
            "profile-avatar",
            member.name.charAt(0).toUpperCase()
        );

        const details = createElement("div");

        details.append(
            createElement("strong", "", member.name),
            createElement("p", "", member.role)
        );

        row.append(avatar, details);

        if (member.role !== "Workspace Owner") {
            const removeButton = createElement(
                "button",
                "remove-member",
                "Remove"
            );

            removeButton.type = "button";

            removeButton.addEventListener("click", () => {
                if (!confirm(`Remove ${member.name} from this workspace?`)) {
                    return;
                }

                const previousMembers = members;

                members = members.filter(
                    item => item.id !== member.id
                );

                if (saveMembers()) {
                    renderTeam();
                } else {
                    members = previousMembers;
                    renderTeam();
                }
            });

            row.appendChild(removeButton);
        }

        teamList.appendChild(row);
    });
}

function addMember() {
    const name = prompt("Enter team member name:");

    if (name === null || !name.trim()) {
        return;
    }

    const role = prompt(
        "Enter their role:",
        "Team Member"
    );

    if (role === null || !role.trim()) {
        return;
    }

    const previousMembers = members;

    members.push({
        id: Date.now(),
        name: name.trim(),
        role: role.trim()
    });

    if (saveMembers()) {
        renderTeam();
    } else {
        members = previousMembers;
    }
}

// ============================================
// NAVIGATION
// ============================================

function updateNavigation() {
    const currentPage = location.hash.slice(1) || "dashboard";

    document.querySelectorAll(".nav-link").forEach(link => {
        const active = link.dataset.page === currentPage;

        link.classList.toggle("active", active);

        if (active) {
            link.setAttribute("aria-current", "page");
        } else {
            link.removeAttribute("aria-current");
        }
    });
}

document.querySelectorAll("[data-page-link]").forEach(button => {
    button.addEventListener("click", () => {
        location.hash = button.dataset.pageLink;
    });
});

window.addEventListener("hashchange", updateNavigation);

// ============================================
// EVENT LISTENERS
// ============================================

$("#addTaskBtn").addEventListener("click", () => openTaskModal());

document.querySelectorAll("[data-open-modal]").forEach(button => {
    button.addEventListener("click", () => openTaskModal());
});

$("#closeModalBtn").addEventListener("click", closeTaskModal);
$("#cancelModalBtn").addEventListener("click", closeTaskModal);

taskForm.addEventListener("submit", handleTaskSubmit);

taskModal.addEventListener("click", event => {
    if (event.target === taskModal) {
        closeTaskModal();
    }
});

$("#searchInput").addEventListener("input", renderTasks);
$("#statusFilter").addEventListener("change", renderTasks);
$("#priorityFilter").addEventListener("change", renderTasks);
$("#sortTasks").addEventListener("change", renderTasks);

$("#addProjectBtn").addEventListener("click", addProject);
$("#addMemberBtn").addEventListener("click", addMember);

// ============================================
// RENDER ALL APPLICATION SECTIONS
// ============================================

function renderAll() {
    renderTasks();
    renderProjects();
    renderTeam();
    updateProjectDropdown();
}

// Initialize application
renderAll();
updateNavigation();
