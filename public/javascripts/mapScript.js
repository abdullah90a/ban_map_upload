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
let SELECTED_TYPE = undefined;
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

let MARKERS = [];
function mapData() {
    const data = JSON.parse(this.responseText);

    MARKERS.forEach(marker => marker.remove());
    MARKERS = [];
    data.forEach(datum => {
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
    })
}