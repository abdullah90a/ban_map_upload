let MARKERS = [];
let MAP_DATA = undefined;
let SELECTED_TYPE = undefined;

const MAP = L.map('map').setView([38, -95], 4);
L.tileLayer.provider('CartoDB.Positron').addTo(MAP);

const info = L.control();
info.update = function (content) { this._div.innerHTML = (content ? content : '<h5>' + 'Click on something!' + '</h5>'); };
info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info smaller-info');
    this.update();
    return this._div;
};
info.addTo(MAP);

const TYPE_SELECTOR = document.getElementById('typeSelect');
TYPE_SELECTOR.addEventListener('change', evt => {
    SELECTED_TYPE = evt.target.value;
    getTypeData();
});

function getTypeData() {
    const request = new XMLHttpRequest();
    request.onload = mapData;
    request.open('GET', `http://127.0.0.1:3000/nuUpload/types/${SELECTED_TYPE}`);
    request.send();
}

function mapData() {
    MAP_DATA = JSON.parse(this.responseText);

    MARKERS.forEach(marker => marker.remove());
    MARKERS = [];
    MAP_DATA.forEach(datum => {
        const marker = L.marker([datum.lat, datum.lng], {
            icon: L.icon({
                iconUrl: `http://127.0.0.1:3000/markers/${SELECTED_TYPE}.png`,

                iconSize:     [40, 30], // size of the icon
                iconAnchor:   [30, 20], // point of the icon which will correspond to marker's location
            })
        });

        const keysToRender = Object.keys(datum).filter(key => !(['_id', 'lat', 'lng'].includes(key)));
        marker.on('click', () => {
            let updateString = '';
            keysToRender.forEach(key => {
                updateString += `<h4>${key}</h4><span>${datum[key]}</span>`;
            });
            info.update(updateString);
        });

        marker.addTo(MAP);
        MARKERS.push(marker);
    });

    createTypeAndItemsDisplay();
}

function deleteType() {
    MARKERS.forEach(marker => marker.remove());

    const request = new XMLHttpRequest();
    request.onload = () => window.location.reload();
    request.open('GET', `http://127.0.0.1:3000/nuUpload/deleteType/${SELECTED_TYPE}`);
    request.send();
}

function deleteItem(index, id) {
    MARKERS[index].remove();

    const request = new XMLHttpRequest();
    request.onload = () => getTypeData();
    request.open('GET', `http://127.0.0.1:3000/nuUpload/deleteItem/${SELECTED_TYPE}/${id}`);
    request.send();
}

const DISPLAY_DIV = document.getElementById('types');
function createTypeAndItemsDisplay() {
    let items_list = '';
    MAP_DATA.forEach((datum, index) => {
        let item = '';
        const keysToRender = Object.keys(datum).filter(key => !(['_id', 'lat', 'lng'].includes(key)));
        keysToRender.forEach(key => {
            item += `<tr><td>${key}</td><td>${datum[key]}</td></tr>`;
        });
        items_list += `
            <li>
                ${'<table>' + item + '</table>'}
                <button onclick="deleteItem(${index + ", '" + datum["_id"] + "'"})">Delete</button>
            </li>
        `;
    });

    DISPLAY_DIV.innerHTML = `
        <h3>Items in '${SELECTED_TYPE}'</h3>
        <button onclick="deleteType()">Delete</button>
        <ul>${items_list}</ul>
    `;
}