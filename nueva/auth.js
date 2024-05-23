const clientId = '185859829591-k1bspc3ksrha9pe2o7lmh5gv8q987a2m.apps.googleusercontent.com';
const apiKey = 'AIzaSyCyVG9n1lH7sfiSF2ABW6q5Q00xLVkXDgI';
const scopes = 'https://www.googleapis.com/auth/spreadsheets.readonly';

function handleClientLoad() {
    gapi.load('client:auth2', initClient);
}

function initClient() {
    gapi.client.init({
        apiKey: apiKey,
        clientId: clientId,
        scope: scopes
    }).then(function () {
        gapi.auth2.getAuthInstance().isSignedIn.listen(updateSigninStatus);
        updateSigninStatus(gapi.auth2.getAuthInstance().isSignedIn.get());
        document.getElementById('login').onclick = handleAuthClick;
    });
}

function updateSigninStatus(isSignedIn) {
    if (isSignedIn) {
        loadSheetData();
    } else {
        document.getElementById('content').innerText = 'Por favor, inicie sesión para ver los datos.';
    }
}

function handleAuthClick(event) {
    gapi.auth2.getAuthInstance().signIn();
}

function loadSheetData() {
    gapi.client.sheets.spreadsheets.values.get({
        spreadsheetId: '1bw3HxqGjmG7lyvJkvl-lqquB0UiuCsNBe48XhekwR8I',
        range: 'TERMINALES!A1',
    }).then(function(response) {
        const range = response.result;
        if (range.values.length > 0) {
            document.getElementById('content').innerText = 'Datos: ' + range.values[0];
        } else {
            document.getElementById('content').innerText = 'No se encontraron datos.';
        }
    }, function(response) {
        document.getElementById('content').innerText = 'Error: ' + response.result.error.message;
    });
}

function handleClientLoad() {
    gapi.load('client:auth2', initClient); // Asegúrate de que gapi está definido antes de llamar a load
}
