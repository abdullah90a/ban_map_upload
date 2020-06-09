const TYPES_TO_SHOW = [];

const MAP = L.map('map').setView([38, -95], 4);
L.tileLayer.provider('CartoDB.Positron').addTo(MAP);

const info = L.control();
info.update = function (content) { this._div.innerHTML = (content ? content : ""); };
info.onAdd = function () {
    this._div = L.DomUtil.create('div', 'info smaller-info');
    this.update();
    return this._div;
};
info.addTo(MAP);

const TYPE_SELECTOR = document.getElementById('typeSelect');
TYPE_SELECTOR.addEventListener('change', evt => {
    let selectedType = evt.target.value;
    let indexOfExisting = TYPES_TO_SHOW.findIndex(type => type.name === selectedType);
    let typeDataHolder = { name: selectedType, markers: [] };

    if (indexOfExisting >= 0) {
        TYPES_TO_SHOW[indexOfExisting].markers.forEach(marker => marker.remove());
        TYPES_TO_SHOW.splice(indexOfExisting, 1);
    }
    TYPES_TO_SHOW.push(typeDataHolder);

    getTypeData(selectedType, typeDataHolder);
});

function getTypeData(selectedType, typeDataHolder) {
    const request = new XMLHttpRequest();
    request.typeDataHolder = typeDataHolder;
    request.selectedType = selectedType;
    request.onload = mapData;
    request.open('GET', `http://127.0.0.1:3000/types/${selectedType}`);
    request.send();
}

function mapData() {
    JSON.parse(this.responseText).forEach((datum, index) => {
        const marker = L.marker([datum.lat, datum.lng], {
            icon: L.icon({
                iconUrl: `http://127.0.0.1:3000/markers/${this.selectedType}.png`,

                iconSize:     [40, 30], // size of the icon
                iconAnchor:   [30, 20], // point of the icon which will correspond to marker's location
            })
        });

        const keysToRender = Object.keys(datum).filter(key => !(['_id', 'lat', 'lng'].includes(key)));
        marker.on('click', () => {
            let updateString = `<div class="floaterDiv">${this.selectedType} :: Data Item</div>`;
            keysToRender.forEach(key => {
                updateString += `
                    <div class="floaterDiv">
                        <h4>${key}</h4><span>${datum[key]}</span>
                    </div>
                `;
            });
            updateString += `
                <button onclick="deleteItem(${"'" + this.selectedType + "'," + index + ",'" + datum["_id"] + "'"})">
                    Delete
                </button>
            `;
            info.update(updateString);
        });

        marker.addTo(MAP);
        this.typeDataHolder.markers.push(marker);
    });

    createTypeAndItemsDisplay(this.selectedType);
}

function deleteItem(selectedType, index, id) {
    TYPES_TO_SHOW.find(type => type.name === selectedType).markers[index].remove();
    info.update();

    console.log(`http://127.0.0.1:3000/deleteItem/${selectedType}/${id}`)
    // const request = new XMLHttpRequest();
    // request.open('GET', `http://127.0.0.1:3000/deleteItem/${SELECTED_TYPE}/${id}`);
    // request.send();
}

const TYPE_LIST = document.getElementById('types');
function createTypeAndItemsDisplay(selectedType) {
    let selectedTypeId = `${selectedType}-li`;
    if (document.getElementById(selectedTypeId) !== null) { return; }

    TYPE_LIST.innerHTML += `
        <li id="${selectedTypeId}">
            <button onclick="deleteType('${selectedType}')">${selectedType}</button>
        </li>
    `;
}

function deleteType(selectedType) {
    let typeToRemove = TYPES_TO_SHOW.findIndex(type => type.name === selectedType);
    if (typeToRemove < 0) { return; }

    TYPES_TO_SHOW[typeToRemove].markers.forEach(marker => marker.remove());
    TYPES_TO_SHOW.splice(typeToRemove,1);
    TYPE_LIST.removeChild(document.getElementById(`${selectedType}-li`));

    console.log(`http://127.0.0.1:3000/deleteType/${selectedType}`);
    // const request = new XMLHttpRequest();
    // request.onload = () => window.location.reload();
    // request.open('GET', `http://127.0.0.1:3000/deleteType/${SELECTED_TYPE}`);
    // request.send();
}