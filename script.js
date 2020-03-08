const preventDefault = event => event.preventDefault();
const preventEnter = event => event.key === 'Enter' ? event.preventDefault() : '';

const restoreOpacity = Node => { //al ser de tipo NodeList lo que obtenemos en geElements... debemos castearlo a array para poder iterarla con un forEach y añadir a cada nodo el listener dragend
    Node.addEventListener("dragend", function(event) {
        event.target.style.opacity = "1";
    })
}

/* Traemos las columnas del LocalStorage o creamos una array de cero */
const getLocalStorageColumns = () => localStorage.getItem('columns') ?
    JSON.parse(localStorage.getItem('columns')) : [];
const columns = getLocalStorageColumns();

/* Metemos las columnas en el DOM */
const renderColumns = (columns) => {
    document.querySelector('main').innerHTML = '';
    columns.forEach(column => {
        if (!column) return;
        let tasks = ``;
        column.tasks.forEach(task => {
            tasks += `<div class="task" id="${task.id}" draggable ondragstart ="dragTask(event,${task.id},${column.id})" >
            <h5 contentEditable onkeydown="preventEnter(event)" onkeyup="changeTaskTitleEnter(event,${task.id},${column.id})" onBlur="changeTaskTitleBlur(event, ${task.id}, ${column.id})">${task.title}</h5>
            <i class="far fa-trash-alt" onclick="removeTask(${task.id})"></i>
        </div>`
        })
        document.querySelector('main').innerHTML += `<div class="column" 
            id="${column.id}" draggable='true' ondragstart='dragColumn(event);'>
            
                    <div class="tituloColumna">
                        <h2 contentEditable onkeydown="preventEnter(event)" onkeyup="changeColumnTitleEnter(event,${column.id})" onBlur="changeColumnTitleBlur(event,${column.id})">${column.title}</h2>
                        <i class="far fa-trash-alt" onclick="removeColumn(${column.id})"></i>
                    </div>
                        <div class="tasks" ondragover="preventDefault(event)"  ondrop="dropTask(event)">
                        ${tasks}
                        </div>
                        <input type="text" onkeyup="addTask(event,${column.id})" placeholder="Nueva tarea">
                        </div>`

    });
    Array.from(document.getElementsByClassName("column")).forEach(restoreOpacity)
    Array.from(document.getElementsByClassName("task")).forEach(restoreOpacity)
    return columns
}
renderColumns(columns)

/* Cambiar titulo de Columna */
const changeTitleLocalStorage = (title, columnId) => {
    const columns = getLocalStorageColumns();
    const currentColumn = columns.find(column => columnId === column.id);
    currentColumn.title = title;
    localStorage.setItem('columns', JSON.stringify(columns));
}
const changeColumnTitleBlur = (event, columnId) => {
    changeTitleLocalStorage(event.target.innerText, columnId)
}
const changeColumnTitleEnter = (event, columnId) => {
    if (event.key === 'Enter') {
        changeTitleLocalStorage(event.target.value, columnId);
        event.target.blur();
    }
}

/* Quitar Columna */
const removeColumnFromLocalStorage = (columnId) => {
    const columns = getLocalStorageColumns();
    const columnsFiltered = columns.filter(column => column.id !== columnId);
    localStorage.setItem('columns', JSON.stringify(columnsFiltered));
}

const removeColumn = (columnId) => {
    document.getElementById(columnId).remove();
    removeColumnFromLocalStorage(columnId)
}

/* Drag & Drop de Columnas, sensible a la posición */
const dragColumn = (event) => {
    event.dataTransfer.setData('columnId', event.target.id);
    event.target.style.opacity = "0.01";
}

const dropColumn = (event) => {
    event.target.style.opacity = "1";
    if (event.target.classList.contains("main")) {
        const id = event.dataTransfer.getData('columnId', event.target.id);
        const position = Math.floor(event.pageX / 226.8); //determinamos la posición final de la columna a mover diviendo por el tamañao + el margin
        const columns = getLocalStorageColumns(); //obtenemos las columnas del localStorage
        const currentColumn = columns.find(column => column.id === +id); //buscamos la columna que estamos moviendo
        const updatedColumns = columns.filter(column => column.id !== +id); //quitamos la columna a mover
        updatedColumns.splice(position, 0, currentColumn); //insertamos la columna movida en la posición donde cae
        localStorage.setItem('columns', JSON.stringify(updatedColumns)); //guardamos cambios en localStorage
        renderColumns(updatedColumns); //actualizamos el DOM
    }

}

/* Cambiar titulo de Tarea*/
const changeTaskTitleLocalStorage = (title, taskId, columnId) => {
    const columns = getLocalStorageColumns();
    const currentColumn = columns.find(column => columnId === column.id);
    const currentTask = currentColumn.tasks.find(task => taskId === task.id);
    currentTask.title = title;
    localStorage.setItem('columns', JSON.stringify(columns));
}
const changeTaskTitleBlur = (event, taskId, columnId) => {
    changeTaskTitleLocalStorage(event.target.innerText, taskId, columnId)
}
const changeTaskTitleEnter = (event, taskId, columnId) => {
    if (event.key === 'Enter') {
        changeTaskTitleLocalStorage(event.target.value, taskId, columnId);
        event.target.blur();
    }
}

/* Quitar Tarea */
const removeTaskFromLocalStorage = (taskId, columnId) => {
    const columns = getLocalStorageColumns();
    const currentColumn = columns.find(column => column.id == columnId);
    const tasksFiltered = currentColumn.tasks.filter(task => task.id !== +taskId);
    currentColumn.tasks = tasksFiltered;
    localStorage.setItem('columns', JSON.stringify(columns));
    return columns;
}
const removeTask = (taskId) => {
    const currentColumnId = document.getElementById(taskId).parentElement.parentElement.id;
    removeTaskFromLocalStorage(taskId, currentColumnId)
    document.getElementById(taskId).remove();
}

/* Drag & Drop de Tareas....ESPERO que sensible a la posición */
const dragTask = (event, taskId, columnId) => {
    event.dataTransfer.setData("taskId", taskId);
    /*     const columnId = event.target.parentElement.parentElement.id; */
    event.dataTransfer.setData("columnId", columnId);
    console.log(taskId)
    console.log(columnId)
}

const dropTask = (event) => {
    const taskId = event.dataTransfer.getData("taskId");
    const oldColumnId = event.dataTransfer.getData("columnId");
    console.log(taskId)
    console.log(oldColumnId)
    const task = document.getElementById(taskId);
    if (event.target.classList.contains('tasks') && task) {
        event.target.appendChild(task)
        const newColumnId = event.target.parentElement.id;
        let columns = getLocalStorageColumns();
        const taskObj = columns.flatMap(column => column ? column.tasks : []).find(task => task.id === +taskId);
        columns = removeTaskFromLocalStorage(taskId, oldColumnId);
        columns.find(column => column.id === +newColumnId).tasks.push(taskObj);
        localStorage.setItem("columns", JSON.stringify(columns))
    }
}

/* SUPUESTAMENTE, con esto se cambia a la posición adecuada
const dropTask = (event) => {
    const taskId = event.dataTransfer.getData("taskId");
    const oldColumnId = event.dataTransfer.getData("columnId");
    console.log(oldColumnId);
    const position = Math.floor(event.offsetY / 31);
    if (event.target.classList.contains('tasks')) {
        const columns = getLocalStorageColumns();
        const currentColumn = event.target.parentElement.id;
        const currentTask = columns.find(column => column.id === +oldColumnId).find(task => task.id === +taskId);
        removeTaskFromLocalStorage = (taskId, oldColumnId);
        const updatedTasks= columns.find(column => column.id === +currentColumn).tasks;
        updatedTasks.splice(position, 0, currentTask);
        localStorage.setItem('columns', JSON.stringify(updatedTasks));
        renderColumns(updatedColumns);
    }
}
*/




const addTask = (event, columnId) => {
    if (event.key === 'Enter') {
        const taskId = Date.now();
        document.getElementById(columnId).children[1].innerHTML += `
        <div class="task" id="${taskId}" draggable ondragstart ="dragTask(event,${taskId},${column.id})" >
        <h5 contentEditable onkeydown="preventEnter(event)" onkeyup="changeTaskTitleEnter(event,${taskId},${columnId})" onBlur="changeTaskTitleBlur(event, ${taskId}, ${columnId})">${event.target.value}</h5>
            <i class="far fa-trash-alt" onclick="removeTask(${taskId})"></i>
        </div>`

        const columns = getLocalStorageColumns();
        //buscamos la columna en la cual se este creando la tarea
        const currentColumn = columns.find(column => column.id === columnId);
        //añadimos la tarea al array tasks de la columna en la que estamos
        currentColumn.tasks.push({
            id: taskId,
            title: event.target.value
        });
        //sobreescribo todas las columnas porque las strings en JS son inmutables
        localStorage.setItem('columns', JSON.stringify(columns));
        event.target.value = '';
    }
}


document.querySelector('.addColumn').onkeyup = event => {
    if (event.key === "Enter") {
        const columnId = Date.now();
        const title = event.target.value
        document.querySelector('main').innerHTML += ` <div class="column" 
        id="${columnId}" draggable='true'  ondragstart='dragColumn(event);'>
                   
                <div class="tituloColumna">
                <h2 contentEditable onkeydown="preventEnter(event)" onkeyup="changeColumnTitleEnter(event,${columnId})" onBlur="changeColumnTitleBlur(event,${columnId})">${title}</h2>
                <i class="far fa-trash-alt" onclick="removeColumn(${columnId})"></i>
            </div>
                    <div class="tasks" ondragover="preventDefault(event)"  ondrop="dropTask(event)">
                    </div>
                    <input type="text" onkeyup="addTask(event,${columnId})"  placeholder="Nueva tarea">
                    </div>`
        const columns = getLocalStorageColumns();
        columns.push({
            id: columnId,
            title,
            tasks: []
        })
        localStorage.setItem('columns', JSON.stringify(columns))
        event.target.value = '';
    }
}