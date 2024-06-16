const API_KEY = 'AIzaSyCyVG9n1lH7sfiSF2ABW6q5Q00xLVkXDgI';
const CLIENT_ID = '185859829591-k1bspc3ksrha9pe2o7lmh5gv8q987a2m.apps.googleusercontent.com';
const SPREADSHEET_ID = '1ZMAIPcRS2hPV4pojfXWZflPQfIrOBehRvPoreotvlAI';
let tokenClient;
let gapiInited = false;
let gisInited = false;
let isAuthenticated = false;

function gapiLoaded() {
    gapi.load('client', initializeGapiClient);
}

async function initializeGapiClient() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        gapiInited = true;
        maybeEnableButtons();
    } catch (error) {
        console.error('Error initializing GAPI client:', error);
        showAlert('Error initializing GAPI client', true);
    }
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        callback: '',
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited && !isAuthenticated) {
        const token = localStorage.getItem('google_api_token');
        if (token) {
            gapi.client.setToken({ access_token: token });
            validateToken();
        } else {
            requestAccessToken();
        }
    } else if (isAuthenticated) {
        loadData();
    }
}

async function validateToken() {
    try {
        const tokenInfo = await gapi.client.oauth2.tokeninfo({ access_token: gapi.client.getToken().access_token });
        if (tokenInfo.error) {
            requestAccessToken();
        } else {
            isAuthenticated = true;
            loadData();
        }
    } catch (error) {
        requestAccessToken();
        console.error('Error validating token:', error);
    }
}

function requestAccessToken() {
    tokenClient.callback = async (resp) => {
        if (resp.error !== undefined) {
            console.error('Error during token callback:', resp);
            showAlert('Error during token callback', true);
            throw (resp);
        }
        localStorage.setItem('google_api_token', resp.access_token);
        gapi.client.setToken({ access_token: resp.access_token });
        isAuthenticated = true;
        loadData();
    };
    tokenClient.requestAccessToken();
}

async function loadSheetData(range, elementId) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: range,
        });
        const data = response.result.values || [];
        const table = document.getElementById(elementId);
        table.innerHTML = '';
        const thead = document.createElement('thead');
        const tbody = document.createElement('tbody');

        data.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            row.forEach((cell, cellIndex) => {
                const cellElement = rowIndex === 0 ? document.createElement('th') : document.createElement('td');
                cellElement.textContent = cell || '-'; // Add placeholder if cell is empty
                if (rowIndex > 0 && (cellIndex === 2 || cellIndex === 3)) { // make columns 3 and 4 editable
                    cellElement.contentEditable = true;
                    cellElement.classList.add('editable');
                    cellElement.addEventListener('focus', handleCellFocus);
                    cellElement.addEventListener('blur', handleCellBlur);
                }
                tr.appendChild(cellElement);
            });
            if (rowIndex === 0) {
                thead.appendChild(tr);
            } else {
                tbody.appendChild(tr);
            }
        });

        // Ensure all rows have the same number of cells
        const maxColumns = Math.max(...data.map(row => row.length));
        const allRows = [thead.querySelector('tr'), ...tbody.querySelectorAll('tr')];
        allRows.forEach(tr => {
            while (tr.children.length < maxColumns) {
                const cellElement = document.createElement(tr.parentElement === thead ? 'th' : 'td');
                cellElement.textContent = '-';
                if (tr.parentElement === tbody && (tr.children.length === 2 || tr.children.length === 3)) {
                    cellElement.contentEditable = true;
                    cellElement.classList.add('editable');
                    cellElement.addEventListener('focus', handleCellFocus);
                    cellElement.addEventListener('blur', handleCellBlur);
                }
                tr.appendChild(cellElement);
            }
        });

        table.appendChild(thead);
        table.appendChild(tbody);
    } catch (error) {
        console.error('Error fetching sheet data:', error);
        showAlert('Error fetching sheet data', true);
    }
}

function handleCellFocus(event) {
    if (event.target.textContent === '-') {
        event.target.textContent = '';
    }
}

function handleCellBlur(event) {
    let text = event.target.textContent.trim();
    if (text === '') {
        event.target.textContent = '-';
    } else if (!isNaN(text) && text !== '-') {
        event.target.textContent = formatNumber(text);
    }
}

function formatNumber(num) {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
}

function loadData() {
    loadSheetData('INTRANET!B7:H15', 'tableElRoble');
    loadSheetData('INTRANET!J7:P15', 'tableLaReina');
    loadSheetData('INTRANET!R7:X15', 'tableMariaAngelica');
}

function publishData(tableId, range) {
    if (!isAuthenticated) {
        requestAccessToken();
        return;
    }

    const table = document.getElementById(tableId);
    const rows = table.getElementsByTagName('tr');
    const values = [];

    for (let i = 0; i < rows.length; i++) {
        const cells = rows[i].getElementsByTagName(i === 0 ? 'th' : 'td');
        const row = [];
        for (let j = 0; j < cells.length; j++) {
            row.push(cells[j].textContent === '-' ? '' : cells[j].textContent);
        }
        values.push(row);
    }

    const body = {
        values: values
    };

    gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: range,
        valueInputOption: 'RAW',
        resource: body
    }).then((response) => {
        console.log('Data published successfully:', response);
        showAlert('Datos publicados exitosamente', false);
    }, (error) => {
        console.error('Error publishing data:', error.result.error.message);
        showAlert('Error al publicar los datos', true);
    });
}

function showAlert(message, isError = false) {
    const alertBox = document.getElementById('alert');
    alertBox.textContent = message;
    alertBox.className = isError ? 'alert error show' : 'alert success show';
    setTimeout(() => {
        alertBox.className = 'alert';
    }, 3000);
}

document.addEventListener('DOMContentLoaded', (event) => {
    gapiLoaded();
    gisLoaded();
});

function toggleMenu() {
    const navLinks = document.querySelector('.nav-links');
    navLinks.style.display = navLinks.style.display === 'flex' ? 'none' : 'flex';
}
