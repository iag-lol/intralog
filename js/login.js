const CLIENT_ID = '185859829591-esem7nmdnnctnp3c9072c7ii3brssoa1.apps.googleusercontent.com';
const API_KEY = 'AIzaSyBDLRSUqxX-qchAUcZYsRTO2WOzwbgVxP0';
const SPREADSHEET_ID = '1ZMAIPcRS2hPV4pojfXWZflPQfIrOBehRvPoreotvlAI';

let tokenClient;
let gapiInited = false;
let gisInited = false;
let credentials = [];

document.addEventListener('DOMContentLoaded', function() {
    gapi.load('client:auth2', initializeGapiClient);
});

async function initializeGapiClient() {
    await gapi.client.init({
        apiKey: API_KEY,
        discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    });
    gapiInited = true;
    maybeEnableButtons();
}

function gisLoaded() {
    tokenClient = google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/spreadsheets.readonly',
        callback: '', // definido más tarde
    });
    gisInited = true;
    maybeEnableButtons();
}

function maybeEnableButtons() {
    if (gapiInited && gisInited) {
        tokenClient.callback = async (resp) => {
            if (resp.error !== undefined) {
                console.error(resp);
                showAlert('Error al intentar acceder a Google Sheets.', true);
                return;
            }
            gapi.client.setToken(resp);
            await fetchData();
        };
        tokenClient.requestAccessToken();
    }
}

async function fetchData() {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'credenciales!A2:B',
        });
        credentials = response.result.values;

        const statusResponse = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'credenciales!E1',
        });
        const statusText = statusResponse.result.values ? statusResponse.result.values[0][0] : 'No status found';
        document.getElementById('sheet-status').textContent = statusText;

    } catch (error) {
        console.error('Error fetching data:', error);
        showAlert('Error fetching data: ' + error.message, true);
    }
}

function handleLogin() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    const validCredential = credentials.find(cred => cred[0] === username && cred[1] === password);

    if (validCredential) {
        showAlert('Acceso concedido. Redirigiendo...', false);
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 2000);
    } else {
        showAlert('Usuario o contraseña incorrectos.', true);
    }
}

function showAlert(message, isError) {
    const alertBox = document.getElementById('alert');
    alertBox.textContent = message;
    alertBox.className = `alert ${isError ? 'error' : 'success'} show`;
    setTimeout(() => {
        alertBox.className = 'alert';
    }, 3000);
}

function showForgotPassword() {
    document.getElementById('forgot-password-form').style.display = 'flex';
}

function closeForgotPassword() {
    document.getElementById('forgot-password-form').style.display = 'none';
}

function handleForgotPassword() {
    const username = document.getElementById('fp-username').value;
    const email = document.getElementById('fp-email').value;

    const userCredential = credentials.find(cred => cred[0] === username);

    if (userCredential) {
        // Aquí debes implementar el envío del correo electrónico
        showAlert(`Contraseña enviada al correo: ${email}`, false);
    } else {
        showAlert('Usuario no encontrado.', true);
    }
}

function showCreateAccount() {
    document.getElementById('create-account-form').style.display = 'flex';
}

function closeCreateAccount() {
    document.getElementById('create-account-form').style.display = 'none';
}

async function handleCreateAccount() {
    const username = document.getElementById('ca-username').value;
    const password = document.getElementById('ca-password').value;
    const confirmPassword = document.getElementById('ca-confirm-password').value;

    if (password !== confirmPassword) {
        showAlert('Las contraseñas no coinciden.', true);
        return;
    }

    try {
        const response = await gapi.client.sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: 'credenciales!A:B',
            valueInputOption: 'RAW',
            resource: {
                values: [[username, password]],
            },
        });
        showAlert('Cuenta creada exitosamente.', false);
        closeCreateAccount();
    } catch (error) {
        console.error('Error creating account:', error);
        showAlert('Error al crear la cuenta: ' + error.message, true);
    }
}

window.addEventListener('load', () => {
    gisLoaded();
});
