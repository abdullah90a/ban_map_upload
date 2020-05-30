const TYPE_SELECTOR = document.getElementById("typeSelect");
TYPE_SELECTOR.addEventListener("change", evt => {
    console.log(evt);
});

const MAP = L.map('map').setView([38, -95], 4);
L.tileLayer.provider('CartoDB.Positron').addTo(MAP);